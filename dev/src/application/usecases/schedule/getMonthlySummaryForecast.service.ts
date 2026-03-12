import * as moment from 'moment';
import {
  createUniqueWorksFinancial,
  MonthlySummaryForecastMapper,
  WorkItemFinancials,
} from 'src/application/mappers/monthlySummaryForecastMapper';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';
import {
  GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
  IGetMonthlySummaryForecastRepository,
} from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import {
  IMonthlySummaryForecastCalculator,
  MONTHLY_SUMMARY_FORECAST_CALCULATOR,
} from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

import { Inject, Injectable } from '@nestjs/common';
import {
  DailySummaryForecastResult,
  GroupSummaryForecastResult,
  UniqueWorksFinancial,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';
import { buildTotalTeamsMap } from 'src/domain/services/teamAggregator.service';

@Injectable()
export class GetMonthlySummaryForecastService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY)
    private readonly monthlySummaryForecastRepository: IGetMonthlySummaryForecastRepository,
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
    // ANTES: dependia da classe concreta MonthlySummaryForecastCalculator
    // AGORA: depende da interface IMonthlySummaryForecastCalculator (DIP do SOLID)
    @Inject(MONTHLY_SUMMARY_FORECAST_CALCULATOR)
    private readonly calculator: IMonthlySummaryForecastCalculator,
    private readonly summaryMapper: MonthlySummaryForecastMapper,
  ) {}

  // ANTES: Promise<any> — sem type safety no retorno
  // AGORA: Promise<DailySummaryForecastResult> — contrato claro para consumidores
  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<DailySummaryForecastResult> {
    const year = moment(filters.dataFinal, 'DD/MM/YYYY').year().toString();

    const [data, executionCapacity] = await Promise.all([
      this.monthlySummaryForecastRepository.getSummary(filters),
      this.executionCapacityRepository.getFinancialValue(
        year,
        filters.idParceira,
      ),
    ]);

    // Array fixo de 12 posições substitui Map<number, ...> — meses vão de 0 a 11,
    // acesso por índice é O(1) e mais semântico que um Map para chaves numéricas densas
    const financialCapacityByMonth: (
      | MonthlyCapacityMetricsForecast
      | undefined
    )[] = new Array(12);

    const summaryMap = new Map<string, DailySummaryEntryForecast>();
    const uniqueWorksFinancial = createUniqueWorksFinancial();
    const contabilizedWorks = new Set<string>();

    // ANTES: TeamAggregator.buildTotalTeamsMap percorria `data` inteiro antes do loop
    //        principal → dois passes completos sobre o array.
    // AGORA: buildTotalTeamsMap ainda é chamado antes do loop, mas como função pura
    //        (sem overhead de serviço). Para datasets muito grandes, o loop poderia
    //        ser fundido, mas a legibilidade desta separação justifica o custo em
    //        casos de uso típicos. A remoção do @Injectable() já elimina o overhead
    //        de instanciação e DI do NestJS.
    const totalTeamsMap = buildTotalTeamsMap(data);

    for (const record of data) {
      const { ordem_dca, ordem_dcd, ordem_dci, ordem_dcim, ovnota } =
        record.obras;

      const date = moment.utc(record.data_prog);
      const formattedDate = date.format('DD/MM/YYYY');
      const monthIndex = date.month();

      // Lazy cache com array — evita recomputar para datas do mesmo mês
      financialCapacityByMonth[monthIndex] ??=
        this.calculator.aggregateFinancialCapacityByMonth(
          executionCapacity,
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

      // ANTES: 4 variáveis locais soltas (baseMoPlan, baseMatPlan, etc.) repetidas
      //        em ambos os métodos do service.
      // AGORA: extraídas via helper privado que retorna WorkItemFinancials —
      //        objeto tipado, com nomes semânticos, reutilizável e sem risco de
      //        trocar a ordem dos argumentos posicionais.
      const financials = this.extractFinancials(record.obras);

      // ANTES: o Mapper chamava calculator.calculateWorkOrderMetrics internamente.
      //        Isso acoplava Mapper ao Calculator e impedia testes unitários isolados.
      // AGORA: o Service (orquestrador) calcula e entrega os valores prontos ao Mapper.
      const exec = record.exec ?? 0;
      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.servicePlan,
        financials.materialPlan,
        record.prog,
        exec,
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

    // ANTES: calculator.calculateExecutionRate era chamado dentro do Mapper
    //        em finalizeDailySummaryEntry — o Mapper não deveria saber calcular.
    // AGORA: o Service calcula a taxa e passa o valor pronto ao Mapper finalizador.
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
    const totals = this.calculator.aggregateDailySummaryTotals(
      summary,
      uniqueWorksFinancial,
    );

    return { summary, totals };
  }

  // ANTES: Promise<any>
  // AGORA: Promise<GroupSummaryForecastResult> — tipo explícito
  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GroupSummaryForecastResult> {
    const data =
      await this.monthlySummaryForecastRepository.getSummary(filters);

    const summaryMap = new Map<string, GroupTeamSummaryEntryForecast>();
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

      // ANTES: exec nullable era passado ao Mapper que o repassava ao Calculator —
      //        a normalização (exec ?? 0) ocorria em pontos diferentes da cadeia.
      // AGORA: exec é normalizado aqui, no ponto de entrada do loop, de forma uniforme.
      const exec = record.exec ?? 0;

      const workOrderMetrics = this.calculator.calculateWorkOrderMetrics(
        financials.servicePlan,
        financials.materialPlan,
        record.prog,
        exec,
      );

      const prevMetrics = this.calculator.calculateMoPrev(
        financials.servicePlan,
        financials.materialPlan,
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

    // ANTES: diff calculado inline com fórmula duplicada (não usava calculateExecutionRate)
    // AGORA: usa calculator.calculateExecutionRate — eliminando a duplicação de lógica
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

  // ─── Helpers privados ────────────────────────────────────────────────────────

  // Centraliza a extração dos campos financeiros brutos de uma obra.
  // Elimina as 4 variáveis locais repetidas (baseMoPlan, baseMatPlan, etc.)
  // e garante a ordem correta dos campos via objeto tipado.
  private extractFinancials(obras: {
    capex_mo_plan: number;
    capex_mat_plan: number;
    capex_mo_pend: number;
    capex_mat_pend: number;
  }): WorkItemFinancials {
    return {
      servicePlan: obras.capex_mo_plan,
      materialPlan: obras.capex_mat_plan,
      servicePend: obras.capex_mo_pend,
      materialPend: obras.capex_mat_pend,
    };
  }

  // Chave composta que identifica unicamente uma obra — centralizada para evitar
  // a string template duplicada nos dois métodos públicos.
  private buildWorkKey(
    ovnota: string,
    ordem_dci: string,
    ordem_dca: string,
    ordem_dcd: string,
    ordem_dcim: string,
  ): string {
    return `${ovnota}-${ordem_dci}-${ordem_dca}-${ordem_dcd}-${ordem_dcim}`;
  }

  // Acúmulo de financeiros de obras únicas extraído do corpo do loop —
  // ANTES: 4 linhas de += repetidas identicamente nos dois métodos públicos.
  // AGORA: um único ponto de mutação, nomeado de forma intencional.
  private accumulateUniqueWorkFinancials(
    target: UniqueWorksFinancial,
    financials: WorkItemFinancials,
  ): void {
    target.totalServiceMoPlan += financials.servicePlan;
    target.totalMaterialMoPlan += financials.materialPlan;
    target.totalServiceMoPend += financials.servicePend;
    target.totalMaterialMoPend += financials.materialPend;
  }
}
