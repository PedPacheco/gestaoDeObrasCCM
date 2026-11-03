import moment from 'moment';
import {
  createUniqueWorksFinancialForecast,
  MonthlySummaryForecastMapper,
} from 'src/application/mappers/monthlySummaryForecastMapper';
import {
  GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
  IGetMonthlySummaryForecastRepository,
} from 'src/domain/contracts/schedule/IGetMonthlySummaryForecastRepository';
import {
  IMonthlySummaryForecastCalculator,
  MONTHLY_SUMMARY_FORECAST_CALCULATOR,
} from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { TeamAggregationService } from 'src/domain/services/teamAggregator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntryForecast,
  DailySummaryForecastResult,
  GroupSummaryForecastResult,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
  UniqueWorksFinancialForecast,
  WorkItemFinancialsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetMonthlySummaryForecastService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY)
    private readonly monthlySummaryForecastRepository: IGetMonthlySummaryForecastRepository,
    @Inject(MONTHLY_SUMMARY_FORECAST_CALCULATOR)
    private readonly calculator: IMonthlySummaryForecastCalculator,
    private readonly summaryMapper: MonthlySummaryForecastMapper,
    private readonly teamsAggregatorService: TeamAggregationService,
  ) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<DailySummaryForecastResult> {
    const year = moment(filters.dataFinal, 'DD/MM/YYYY').year();

    const [data, capexPlan] = await Promise.all([
      this.monthlySummaryForecastRepository.getSummary(filters),
      this.monthlySummaryForecastRepository.getCapexPlan(filters, year),
    ]);

    const financialCapacityByMonth: (
      MonthlyCapacityMetricsForecast | undefined
    )[] = new Array(12);

    const summaryMap = new Map<string, DailySummaryEntryForecast>();
    const uniqueWorksFinancial = createUniqueWorksFinancialForecast();
    const contabilizedWorks = new Set<string>();

    const totalTeamsMap = this.teamsAggregatorService.buildTotalTeamsMap(data);

    for (const record of data) {
      const { ordem_dca, ordem_dcd, ordem_dci, ordem_dcim, ovnota, executado } =
        record.obras;

      const date = moment.utc(record.data_prog);
      const formattedDate = date.format('DD/MM/YYYY');
      const monthIndex = date.month();

      financialCapacityByMonth[monthIndex] ??=
        this.calculator.aggregateFinancialCapacityByMonth(
          capexPlan,
          monthIndex,
        );

      const financialCapacityMetrics = financialCapacityByMonth[monthIndex]!;
      const teamsTotal = totalTeamsMap.get(formattedDate);

      if (!summaryMap.has(formattedDate)) {
        summaryMap.set(
          formattedDate,
          this.summaryMapper.createDailySummaryEntry(
            formattedDate,
            financialCapacityMetrics,
            teamsTotal,
          ),
        );
      }

      const entry = summaryMap.get(formattedDate)!;

      const financials = this.extractFinancials(record.obras);

      const exec = record.exec ?? 0;

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.servicePlan,
        financials.materialPlan,
        record.prog,
        exec,
        financials.servicePend,
        financials.materialPend,
        executado,
      );

      const goalContribution = this.calculator.calculateGoalPercentage(
        workOrderMetrics.serviceCapexProg,
        financialCapacityMetrics.dailyFinancialGoal,
      );

      this.summaryMapper.accumulateDailySummaryEntry(
        entry,
        financials,
        workOrderMetrics,
        goalContribution,
      );

      const workKey = this.buildWorkKey(
        ovnota,
        ordem_dci,
        ordem_dca,
        ordem_dcd,
        ordem_dcim,
      );

      if (!contabilizedWorks.has(workKey)) {
        contabilizedWorks.add(workKey);
        this.accumulateUniqueWorkFinancials(uniqueWorksFinancial, financials);
      }
    }

    for (const entry of summaryMap.values()) {
      const executionRate = this.calculator.calculateExecutionRate(
        entry.serviceMoProg,
        entry.materialMoProg,
        entry.serviceMoExec,
        entry.materialMoExec,
      );
      this.summaryMapper.finalizeDailySummaryEntry(entry, executionRate);
    }

    const summary = Array.from(summaryMap.values());

    const totalFinancial = financialCapacityByMonth.reduce((sum, item) => {
      return sum + (item?.totalFinancial ?? 0);
    }, 0);

    const totals = this.calculator.aggregateDailySummaryTotals(
      summary,
      uniqueWorksFinancial,
      totalFinancial,
    );

    return { summary, totals };
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GroupSummaryForecastResult> {
    const data =
      await this.monthlySummaryForecastRepository.getSummary(filters);

    const summaryMap = new Map<string, GroupTeamSummaryEntryForecast>();
    const uniqueWorksFinancial = createUniqueWorksFinancialForecast();
    const contabilizedWorks = new Set<string>();

    for (const record of data) {
      const {
        tipos,
        turmas,
        ordem_dca,
        ordem_dcd,
        ordem_dci,
        ordem_dcim,
        ovnota,
        executado,
      } = record.obras;

      const grupo: string = tipos.grupos.grupo;
      const turma: string = turmas.turma;
      const groupKey = `${grupo}::${turma}`;

      if (!summaryMap.has(groupKey)) {
        summaryMap.set(
          groupKey,
          this.summaryMapper.createGroupTeamEntry(grupo, turma),
        );
      }

      const entry = summaryMap.get(groupKey)!;
      const financials = this.extractFinancials(record.obras);

      const exec = record.exec ?? 0;

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.servicePlan,
        financials.materialPlan,
        record.prog,
        exec,
        financials.servicePend,
        financials.materialPend,
        executado,
      );

      const prevMetrics = this.calculator.calculateMoPrev(
        financials.servicePend,
        financials.materialPend,
        record.exec,
        record.prog,
      );

      this.summaryMapper.accumulateGroupTeamEntry(
        entry,
        financials,
        workOrderMetrics,
        prevMetrics,
      );

      const workKey = this.buildWorkKey(
        ovnota,
        ordem_dci,
        ordem_dca,
        ordem_dcd,
        ordem_dcim,
      );

      if (!contabilizedWorks.has(workKey)) {
        contabilizedWorks.add(workKey);
        this.accumulateUniqueWorkFinancials(uniqueWorksFinancial, financials);
      }
    }

    const summaryArray = Array.from(summaryMap.values());
    const totals = this.calculator.aggregateGroupTotals(
      summaryArray,
      uniqueWorksFinancial,
    );

    const summary = summaryArray.map((entry) => ({
      ...entry,
      diff: this.calculator.calculateExecutionRate(
        entry.totalServiceMoProg,
        entry.totalMaterialMoProg,
        entry.totalServiceMoExec,
        entry.totalMaterialMoExec,
      ),
    }));

    return { summary, totals };
  }

  private extractFinancials(obras: {
    capex_mo_plan: number;
    capex_mat_plan: number;
    capex_mo_pend: number;
    capex_mat_pend: number;
  }): WorkItemFinancialsForecast {
    return {
      servicePlan: obras.capex_mo_plan,
      materialPlan: obras.capex_mat_plan,
      servicePend: obras.capex_mo_pend,
      materialPend: obras.capex_mat_pend,
    };
  }

  private buildWorkKey(
    ovnota: string,
    ordem_dci: string,
    ordem_dca: string,
    ordem_dcd: string,
    ordem_dcim: string,
  ): string {
    return `${ovnota}-${ordem_dci}-${ordem_dca}-${ordem_dcd}-${ordem_dcim}`;
  }

  private accumulateUniqueWorkFinancials(
    target: UniqueWorksFinancialForecast,
    financials: WorkItemFinancialsForecast,
  ): void {
    target.totalServiceMoPlan += financials.servicePlan;
    target.totalMaterialMoPlan += financials.materialPlan;
    target.totalServiceMoPend += financials.servicePend;
    target.totalMaterialMoPend += financials.materialPend;
  }
}
