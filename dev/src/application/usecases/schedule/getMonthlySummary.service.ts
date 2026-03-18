import * as moment from 'moment';
import {
  createUniqueWorksFinancial,
  MonthlySummaryMapper,
} from 'src/application/mappers/monthlySummaryMapper';
import {
  GET_MONTHLY_SUMMARY_REPOSITORY,
  IGetMonthlySummaryRepository,
} from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import {
  IMonthlySummaryCalculator,
  MONTHLY_SUMMARY_CALCULATOR,
} from 'src/domain/services/monthlySummaryCalculator.service';
import { buildTotalTeamsMap } from 'src/domain/services/teamAggregator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntry,
  DailySummaryResult,
  GroupSummaryResult,
  GroupTeamSummaryEntry,
  MonthlyCapacityMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';

@Injectable()
export class MonthlySummaryService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_REPOSITORY)
    private readonly monthlySummaryRepository: IGetMonthlySummaryRepository,
    @Inject(MONTHLY_SUMMARY_CALCULATOR)
    private readonly calculator: IMonthlySummaryCalculator,
    private readonly summaryMapper: MonthlySummaryMapper,
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
  ) {}

  async getSummary(filters: GetMonthlySummaryDTO): Promise<DailySummaryResult> {
    const year = moment(filters.dataFinal, 'DD/MM/YYYY').year().toString();

    const [data, executionCapacity] = await Promise.all([
      this.monthlySummaryRepository.getSummary(filters),
      this.executionCapacityRepository.getFinancialValue(
        year,
        filters.idParceira,
        filters.idRegional,
      ),
    ]);

    const financialCapacityByMonth: (MonthlyCapacityMetrics | undefined)[] =
      Array.from({ length: 12 }, () => undefined);

    const summaryMap = new Map<string, DailySummaryEntry>();

    const totalTeamsMap = buildTotalTeamsMap(data);

    for (const record of data) {
      const date = moment.utc(record.data_prog);
      const formattedDate = date.format('DD/MM/YYYY');
      const monthIndex = date.month();

      financialCapacityByMonth[monthIndex] ??=
        this.calculator.aggregateFinancialCapacityByMonth(
          executionCapacity,
          monthIndex,
        );

      const metrics = financialCapacityByMonth[monthIndex]!;
      const teamsTotal = totalTeamsMap.get(formattedDate);

      if (!summaryMap.has(formattedDate)) {
        summaryMap.set(
          formattedDate,
          this.summaryMapper.createDailySummaryEntry(
            formattedDate,
            metrics,
            teamsTotal,
          ),
        );
      }

      const entry = summaryMap.get(formattedDate)!;
      const financials = this.extractFinancials(record.obras);

      const exec = record.exec ?? 0;

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.moPlan,
        record.prog,
        exec,
      );

      const goalContribution = this.calculator.calculateGoalPercentage(
        workOrderMetrics.moProg,
        metrics.dailyFinancialGoal,
      );

      const goalWith8Contribution = this.calculator.calculateGoalPercentage(
        workOrderMetrics.moProg,
        metrics.dailyFinancialGoalWithOverhead,
      );

      this.summaryMapper.accumulateDailySummaryEntry(
        entry,
        workOrderMetrics,
        goalContribution,
        goalWith8Contribution,
      );
    }

    const summaryArray = Array.from(summaryMap.values());

    const summary = summaryArray.map((entry) => ({
      ...entry,
      diff: this.calculator.calculateExecutionRate(
        entry.totalMoProg,
        entry.totalMoExec,
      ),
    }));

    const total = financialCapacityByMonth.reduce(
      (acc, item) => {
        acc.totalFinancialGoal += item?.totalFinancial ?? 0;
        acc.totalFinancialGoalWith8 += item?.totalFinancialWith8 ?? 0;

        return acc;
      },
      { totalFinancialGoal: 0, totalFinancialGoalWith8: 0 },
    );

    const totals = this.calculator.aggregateDailySummaryTotals(summary, total);

    return { summary, totals };
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GroupSummaryResult> {
    const data = await this.monthlySummaryRepository.getSummary(filters);

    const summaryMap = new Map<string, GroupTeamSummaryEntry>();
    const uniqueWorksFinancial = createUniqueWorksFinancial();
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

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.moPlan,
        record.prog,
        record.exec,
      );

      const prevMetrics = this.calculator.calculateMoPrev(
        financials.moPlan,
        record.exec,
        record.prog,
      );

      const workKey = this.buildWorkKey(
        ovnota,
        ordem_dci,
        ordem_dca,
        ordem_dcd,
        ordem_dcim,
      );

      this.summaryMapper.accumulateGroupTeamEntry(
        entry,
        workOrderMetrics,
        prevMetrics.moPrev,
        contabilizedWorks.has(workKey),
      );

      if (!contabilizedWorks.has(workKey)) {
        contabilizedWorks.add(workKey);
        this.accumulateUniqueWorkFinancials(uniqueWorksFinancial, financials);
      }
    }

    const summaryArray = Array.from(summaryMap.values());

    const totals = this.calculator.aggregateGroupTotals(
      summaryArray,
      uniqueWorksFinancial.totalMoPlan,
    );

    const summary = summaryArray.map((entry) => ({
      ...entry,
      diff: this.calculator.calculateExecutionRate(
        entry.totalMoProg,
        entry.totalMoExec,
      ),
    }));

    return { summary, totals };
  }

  private extractFinancials(obras: { mo_planejada: number }): {
    moPlan: number;
  } {
    return {
      moPlan: obras.mo_planejada,
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
    target: { totalMoPlan: number },
    financials: { moPlan: number },
  ): void {
    target.totalMoPlan += financials.moPlan;
  }
}
