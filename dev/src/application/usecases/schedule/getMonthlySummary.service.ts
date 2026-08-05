import moment from 'moment';
import {
  createUniqueWorksFinancial,
  MonthlySummaryMapper,
} from 'src/application/mappers/monthlySummaryMapper';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/contracts/IExecutionCapacityRepository';
import {
  GET_MONTHLY_SUMMARY_REPOSITORY,
  IGetMonthlySummaryRepository,
} from 'src/domain/contracts/schedule/IGetMonthlySummaryRepository';
import {
  IMonthlySummaryCalculator,
  MONTHLY_SUMMARY_CALCULATOR,
} from 'src/domain/services/monthlySummaryCalculator.service';
import { TeamAggregationService } from 'src/domain/services/teamAggregator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntry,
  DailySummaryResult,
  GroupSummaryResult,
  GroupTeamSummaryEntry,
  MonthlyCapacityMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MonthlySummaryService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_REPOSITORY)
    private readonly monthlySummaryRepository: IGetMonthlySummaryRepository,
    @Inject(MONTHLY_SUMMARY_CALCULATOR)
    private readonly calculator: IMonthlySummaryCalculator,
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
    private readonly summaryMapper: MonthlySummaryMapper,
    private readonly teamsAggregatorService: TeamAggregationService,
  ) {}

  async getSummary(filters: GetMonthlySummaryDTO): Promise<DailySummaryResult> {
    const year = moment(filters.dataFinal, 'DD/MM/YYYY').year().toString();

    const [data, portfolioData, contractValue, executionCapacity] =
      await Promise.all([
        this.monthlySummaryRepository.getSummary(filters),
        this.monthlySummaryRepository.getPortfolioSummary(filters),
        this.monthlySummaryRepository.getContractValue(filters),
        this.executionCapacityRepository.getFinancialValue({
          ano: year,
          idParceira: filters.idParceira,
          idRegional: filters.idRegional,
        }),
      ]);

    const financialCapacityByMonth: (MonthlyCapacityMetrics | undefined)[] =
      Array.from({ length: 12 }, () => undefined);

    const contractValueByMonth = contractValue.reduce(
      (acc, item) => {
        const value = item.valor_contrato / item.meses;

        acc.monthlyValue += value;

        return acc;
      },
      { monthlyValue: 0 },
    );

    const summaryMap = new Map<string, DailySummaryEntry>();

    const portfolioTotal = portfolioData.reduce(
      (acc, item) => {
        const moPlanejada = item.mo_planejada ?? 0;

        return {
          qtdeWorks: acc.qtdeWorks + 1,

          portfolioExec:
            acc.portfolioExec +
            (moPlanejada - (moPlanejada * (item.executado ?? 0)) / 100),
        };
      },
      {
        qtdeWorks: 0,
        portfolioExec: 0,
      },
    );

    const totalTeamsMap = this.teamsAggregatorService.buildTotalTeamsMap(data);
    const executionTeams =
      this.teamsAggregatorService.buildExecutionCapacityTeams(
        filters.dataInicial,
        filters.dataFinal,
        executionCapacity,
      );

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
        financials.moPend,
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

    const totals = this.calculator.aggregateDailySummaryTotals(
      summary,
      total,
      portfolioTotal,
      executionTeams,
    );

    return { summary, totals, contractValueByMonth };
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GroupSummaryResult> {
    const [data, portfolioData] = await Promise.all([
      await this.monthlySummaryRepository.getSummary(filters),
      await this.monthlySummaryRepository.getPortfolioSummary(filters),
    ]);

    const summaryMap = new Map<string, GroupTeamSummaryEntry>();
    const uniqueWorksFinancial = createUniqueWorksFinancial();
    const contabilizedWorks = new Set<string>();

    const portfolioTotal = portfolioData.reduce(
      (acc, item) => {
        const moPlanejada = item.mo_planejada ?? 0;
        const remainingPlannedLabor =
          moPlanejada - (moPlanejada * (item.executado ?? 0)) / 100;

        return {
          portfolioTotal: acc.portfolioTotal + remainingPlannedLabor,
          portfolioRda:
            item.tipos.id_grupo === 3
              ? acc.portfolioRda + remainingPlannedLabor
              : acc.portfolioRda,

          portfolioBt0:
            item.tipos.id_grupo === 4
              ? acc.portfolioBt0 + remainingPlannedLabor
              : acc.portfolioBt0,

          portfolioRecom:
            item.tipos.id_grupo === 2
              ? acc.portfolioRecom + remainingPlannedLabor
              : acc.portfolioRecom,

          portfolioMarket:
            item.tipos.id_grupo === 1
              ? acc.portfolioMarket + remainingPlannedLabor
              : acc.portfolioMarket,
        };
      },
      {
        portfolioTotal: 0,
        portfolioRda: 0,
        portfolioBt0: 0,
        portfolioRecom: 0,
        portfolioMarket: 0,
      },
    );

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
      const idTurma: number = record.obras.id_turma;
      const idGrupo: number = tipos.id_grupo;
      const groupKey = `${grupo}::${turma}`;

      if (!summaryMap.has(groupKey)) {
        summaryMap.set(
          groupKey,
          this.summaryMapper.createGroupTeamEntry(
            grupo,
            turma,
            idTurma,
            idGrupo,
          ),
        );
      }

      const entry = summaryMap.get(groupKey)!;
      const financials = this.extractFinancials(record.obras);

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.moPlan,
        financials.moPend,
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
      portfolioTotal,
      uniqueWorksFinancial,
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

  private extractFinancials(obras: { mo_planejada: number; mo_pend: number }): {
    moPlan: number;
    moPend: number;
  } {
    return {
      moPlan: obras.mo_planejada,
      moPend: obras.mo_pend,
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
    target: { totalMoPlan: number; totalMoPend: number },
    financials: { moPlan: number; moPend: number },
  ): void {
    target.totalMoPlan += financials.moPlan;
    target.totalMoPend += financials.moPend;
  }
}
