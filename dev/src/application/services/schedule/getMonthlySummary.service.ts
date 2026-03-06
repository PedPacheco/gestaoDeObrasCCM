import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';

import {
  GET_MONTHLY_SUMMARY_REPOSITORY,
  IGetMonthlySummaryRepository,
} from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntry,
  GroupTeamSummaryEntry,
  GroupTeamSummaryEntryResponse,
  MonthlyCapacityMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';
import { aggregateCapacityByMonth } from 'src/domain/services/monthlySummaryCalculator.service';
import {
  accumulateDailySummaryEntry,
  accumulateGroupTeamEntry,
  createDailySummaryEntry,
  createGroupTeamEntry,
  finalizeDailySummaryEntry,
} from '../../mappers/monthlySummaryMapper';

@Injectable()
export class GetMonthlySummaryService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_REPOSITORY)
    private readonly monthlySummaryRepository: IGetMonthlySummaryRepository,
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
  ) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<DailySummaryEntry[]> {
    const [data, executionCapacity] = await Promise.all([
      this.monthlySummaryRepository.getSummary(filters),
      this.executionCapacityRepository.getFinancialValue('2026'),
    ]);

    const capacityCache = new Map<number, MonthlyCapacityMetrics>();

    const getOrComputeCapacity = (
      monthIndex: number,
    ): MonthlyCapacityMetrics => {
      if (!capacityCache.has(monthIndex)) {
        capacityCache.set(
          monthIndex,
          aggregateCapacityByMonth(executionCapacity, monthIndex),
        );
      }
      return capacityCache.get(monthIndex)!;
    };

    const summaryMap = new Map<string, DailySummaryEntry>();

    for (const record of data) {
      const date = moment.utc(record.data_prog);
      const formattedDate = date.format('DD/MM/YYYY');
      const monthIndex = date.month();

      const metrics = getOrComputeCapacity(monthIndex);

      if (!summaryMap.has(formattedDate)) {
        summaryMap.set(
          formattedDate,
          createDailySummaryEntry(formattedDate, metrics),
        );
      }

      const entry = summaryMap.get(formattedDate)!;
      const baseMo = record.obras.mo_planejada;
      const prog = record.prog;
      const exec = record.exec ?? 0;

      accumulateDailySummaryEntry(entry, baseMo, prog, exec, metrics);
    }

    for (const entry of summaryMap.values()) {
      finalizeDailySummaryEntry(entry);
    }

    return Array.from(summaryMap.values());
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GroupTeamSummaryEntryResponse[]> {
    const data = await this.monthlySummaryRepository.getSecondSummary(filters);

    const summaryMap = new Map<string, GroupTeamSummaryEntry>();

    for (const record of data) {
      const { ovnota, ordem_dci, ordem_dca, ordem_dcd, ordem_dcim } = record;
      const grupo: string = record.tipos.grupos.grupo;
      const turma: string = record.turmas.turma;
      const key = `${grupo}::${turma}`;
      const keyWork = `${ovnota}-${ordem_dci}-${ordem_dca}-${ordem_dcd}-${ordem_dcim}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, createGroupTeamEntry(grupo, turma));
      }

      const entry = summaryMap.get(key)!;
      const baseMo: number = record.mo_planejada;

      if (!entry._obrasContabilizadas.has(keyWork)) {
        entry._obrasContabilizadas.add(keyWork);
        entry.qtdeObras += 1;
      }

      for (const programacao of record.programacoes) {
        accumulateGroupTeamEntry(
          entry,
          baseMo,
          programacao.prog,
          programacao.exec,
        );
      }
    }

    return Array.from(summaryMap.values()).map((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _obrasContabilizadas, ...rest } = entry;

      rest.diff =
        rest.totalMoProg > 0 ? (rest.totalMoExec / rest.totalMoProg) * 100 : 0;

      return rest;
    });
  }
}
