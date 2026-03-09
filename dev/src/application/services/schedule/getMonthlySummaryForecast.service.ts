import * as moment from 'moment';
import {
  accumulateDailySummaryEntryForecast,
  accumulateGroupTeamEntryForecast,
  createDailySummaryEntryForecast,
  createGroupTeamEntryForecast,
  finalizeDailySummaryEntryForecast,
} from 'src/application/mappers/monthlySummaryForecastMapper';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';
import {
  GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
  IGetMonthlySummaryForecastRepository,
} from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { aggregateCapacityByMonthForecast } from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetMonthlySummaryForecastService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY)
    private readonly monthlySummaryForecastRepository: IGetMonthlySummaryForecastRepository,
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
  ) {}

  async getSummary(filters: GetMonthlySummaryDTO): Promise<any> {
    const year = moment(filters.dataFinal, 'DD/MM/YYYY').year().toString();

    const [data, executionCapacity] = await Promise.all([
      this.monthlySummaryForecastRepository.getSummary(filters),
      this.executionCapacityRepository.getFinancialValue(year),
    ]);

    const capacityCache = new Map<number, MonthlyCapacityMetricsForecast>();

    const getOrComputeCapacity = (
      monthIndex: number,
    ): MonthlyCapacityMetricsForecast => {
      if (!capacityCache.has(monthIndex)) {
        capacityCache.set(
          monthIndex,
          aggregateCapacityByMonthForecast(executionCapacity, monthIndex),
        );
      }
      return capacityCache.get(monthIndex)!;
    };

    const summaryMap = new Map<string, DailySummaryEntryForecast>();

    for (const record of data) {
      const date = moment.utc(record.data_prog);
      const formattedDate = date.format('DD/MM/YYYY');
      const monthIndex = date.month();

      const metrics = getOrComputeCapacity(monthIndex);

      if (!summaryMap.has(formattedDate)) {
        summaryMap.set(
          formattedDate,
          createDailySummaryEntryForecast(formattedDate, metrics),
        );
      }

      const entry = summaryMap.get(formattedDate)!;
      const baseMoPlan = record.obras.capex_mo_plan;
      const baseMatPlan = record.obras.capex_mat_plan;
      const baseMoPend = record.obras.capex_mo_pend;
      const baseMatPend = record.obras.capex_mat_pend;
      const prog = record.prog;
      const exec = record.exec ?? 0;

      accumulateDailySummaryEntryForecast(
        entry,
        baseMoPlan,
        baseMoPend,
        baseMatPlan,
        baseMatPend,
        prog,
        exec,
        metrics,
      );
    }

    for (const entry of summaryMap.values()) {
      finalizeDailySummaryEntryForecast(entry);
    }

    return Array.from(summaryMap.values());
  }

  async getSecondSummary(filters: GetMonthlySummaryDTO): Promise<any> {
    const data =
      await this.monthlySummaryForecastRepository.getSecondSummary(filters);

    const summaryMap = new Map<string, GroupTeamSummaryEntryForecast>();

    for (const record of data) {
      const { ovnota, ordem_dci, ordem_dca, ordem_dcd, ordem_dcim } = record;
      const grupo: string = record.tipos.grupos.grupo;
      const turma: string = record.turmas.turma;
      const key = `${grupo}::${turma}`;
      const keyWork = `${ovnota}-${ordem_dci}-${ordem_dca}-${ordem_dcd}-${ordem_dcim}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, createGroupTeamEntryForecast(grupo, turma));
      }

      const entry = summaryMap.get(key)!;
      const baseMoPlan = record.capex_mo_plan;
      const baseMatPlan = record.capex_mat_plan;
      const baseMoPend = record.capex_mo_pend;
      const baseMatPend = record.capex_mat_pend;

      const isNewWork = !entry._obrasContabilizadas.has(keyWork);

      if (isNewWork) {
        entry._obrasContabilizadas.add(keyWork);
        entry.qtdeObras += 1;

        entry.totalMaterialMoPlan += baseMatPlan;
        entry.totalServiceMoPlan += baseMoPlan;
        entry.totalServiceMoPend += baseMoPend;
        entry.totalMaterialMoPend += baseMatPend;
      }

      for (const programacao of record.programacoes) {
        accumulateGroupTeamEntryForecast(
          entry,
          baseMoPlan,
          baseMatPlan,
          programacao.prog,
          programacao.exec,
        );
      }
    }

    return Array.from(summaryMap.values()).map((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _obrasContabilizadas, ...rest } = entry;

      const totalProg = entry.totalServiceMoProg + entry.totalMaterialMoProg;
      rest.diff =
        totalProg === 0
          ? 0
          : ((entry.totalServiceMoExec + entry.totalMaterialMoExec) /
              totalProg) *
            100;

      return rest;
    });
  }
}
