import { MonthlySummaryCalculator } from 'src/domain/services/monthlySummaryCalculator.service';
import {
  FINANCIAL_OVERHEAD_FACTOR,
  MONTH_INDEX_TO_KEY,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

// O mapper é mockado para que estes testes não dependam do formato inicial real
// dos totais: cada chamada devolve um objeto novo e zerado.
jest.mock('src/application/mappers/monthlySummaryMapper', () => ({
  createInitialTotals: () => ({
    totalSchedules: 0,
    totalTeams: 0,
    totalMoProg: 0,
    totalMoExec: 0,
    totalFinancialGoal: 0,
    totalFinancialGoalWith8: 0,
    totalDiaryGoal: 0,
    totalDiaryGoalWith8: 0,
    totalDiff: 0,
    totalWorks: 0,
    totalQtdeRfpTeams: null,
    totalExecutionCapacityTeams: null,
  }),
  createInitialTotalsByGrouping: () => ({
    totalSchedules: 0,
    totalMoProgByGrouping: 0,
    totalMoExecByGrouping: 0,
    totalMoPrevByGrouping: 0,
    totalProgMarket: 0,
    totalExecMarket: 0,
    totalProgRecom: 0,
    totalExecRecom: 0,
    totalProgRda: 0,
    totalExecRda: 0,
    totalProgBt0: 0,
    totalExecBt0: 0,
    totalWalletBt0: 0,
    totalWalletMarket: 0,
    totalWalletRecom: 0,
    totalWalletRda: 0,
    totalWallet: 0,
    totalMoPlanByGrouping: 0,
    totalMoPendByGrouping: 0,
    totalDiff: 0,
  }),
}));

const capacityEntry = (
  monthIndex: number,
  teams: unknown,
  shouldCost: unknown,
  extra: Record<string, unknown> = {},
) => ({
  [MONTH_INDEX_TO_KEY[monthIndex]]: teams,
  should_cost: shouldCost,
  ...extra,
});

describe('MonthlySummaryCalculator', () => {
  let calculator: MonthlySummaryCalculator;

  beforeEach(() => {
    calculator = new MonthlySummaryCalculator();
  });

  describe('aggregateFinancialCapacityByMonth', () => {
    it('soma equipes x should_cost de todas as entradas do mês', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [capacityEntry(0, 2, 1000), capacityEntry(0, 3, 500)],
        0,
      );

      expect(result.totalFinancial).toBe(3500);
    });

    it('deriva meta diária, meta com overhead e total com 8,5%', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [capacityEntry(0, 2, 1000)],
        0,
      );

      const daily = 2000 / WORKING_DAYS_PER_MONTH;
      expect(result.dailyFinancialGoal).toBeCloseTo(daily, 6);
      expect(result.dailyFinancialGoalWithOverhead).toBeCloseTo(
        daily * FINANCIAL_OVERHEAD_FACTOR,
        6,
      );
      expect(result.totalFinancialWith8).toBeCloseTo(2000 * 1.085, 6);
    });

    it('usa somente a coluna do mês pedido', () => {
      const entry = {
        [MONTH_INDEX_TO_KEY[0]]: 2,
        [MONTH_INDEX_TO_KEY[1]]: 5,
        should_cost: 100,
      };

      expect(
        calculator.aggregateFinancialCapacityByMonth([entry], 0).totalFinancial,
      ).toBe(200);
      expect(
        calculator.aggregateFinancialCapacityByMonth([entry], 1).totalFinancial,
      ).toBe(500);
    });

    it.each(Array.from({ length: 12 }, (_, i) => i))(
      'lê a coluna correta para o mês de índice %i',
      (monthIndex) => {
        const result = calculator.aggregateFinancialCapacityByMonth(
          [capacityEntry(monthIndex, 1, 10)],
          monthIndex,
        );

        expect(result.totalFinancial).toBe(10);
      },
    );

    it('considera zero equipes quando a coluna do mês não existe', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [{ should_cost: 1000 }],
        3,
      );

      expect(result.totalFinancial).toBe(0);
    });

    it('considera should_cost nulo/indefinido como zero', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [capacityEntry(0, 2, null), capacityEntry(0, 2, undefined)],
        0,
      );

      expect(result.totalFinancial).toBe(0);
    });

    it('converte valores numéricos em string', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [capacityEntry(0, '2', '1000')],
        0,
      );

      expect(result.totalFinancial).toBe(2000);
    });

    it('lista vazia gera tudo zerado e overhead zero', () => {
      const result = calculator.aggregateFinancialCapacityByMonth([], 0);

      expect(result).toEqual({
        dailyFinancialGoal: 0,
        dailyFinancialGoalWithOverhead: 0,
        totalFinancial: 0,
        totalFinancialWith8: 0,
      });
    });

    it('não aplica overhead quando a meta diária não é positiva', () => {
      const result = calculator.aggregateFinancialCapacityByMonth(
        [capacityEntry(0, -1, 1000)],
        0,
      );

      expect(result.dailyFinancialGoal).toBeLessThan(0);
      expect(result.dailyFinancialGoalWithOverhead).toBe(0);
    });
  });

  describe('calculateWorkOrderMetrics', () => {
    it('calcula programado e executado a partir dos percentuais', () => {
      expect(calculator.calculateWorkOrderMetrics(1000, 400, 50, 25)).toEqual({
        moPlan: 1000,
        moPend: 400,
        moProg: 500,
        moExec: 250,
      });
    });

    it('prog e exec zerados geram zero', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 400, 0, 0);

      expect(result.moProg).toBe(0);
      expect(result.moExec).toBe(0);
    });

    it('100% devolve o valor planejado', () => {
      const result = calculator.calculateWorkOrderMetrics(800, 0, 100, 100);

      expect(result.moProg).toBe(800);
      expect(result.moExec).toBe(800);
    });

    it('repassa moPlan e moPend sem alteração', () => {
      const result = calculator.calculateWorkOrderMetrics(
        123.45,
        67.89,
        10,
        10,
      );

      expect(result.moPlan).toBe(123.45);
      expect(result.moPend).toBe(67.89);
    });
  });

  describe('calculatePointByPointMetrics', () => {
    it('usa o custo ponto a ponto como programado e executado', () => {
      const result = calculator.calculatePointByPointMetrics(1000, 400, {
        planejado: 250,
        executado: 100,
      });

      expect(result).toEqual({
        moPlan: 1000,
        moPend: 400,
        moProg: 250,
        moExec: 100,
      });
    });

    it('ignora mo_planejada para programado/executado', () => {
      const withBigPlan = calculator.calculatePointByPointMetrics(
        1_000_000,
        0,
        { planejado: 10, executado: 5 },
      );
      const withSmallPlan = calculator.calculatePointByPointMetrics(1, 0, {
        planejado: 10,
        executado: 5,
      });

      expect(withBigPlan.moProg).toBe(withSmallPlan.moProg);
      expect(withBigPlan.moExec).toBe(withSmallPlan.moExec);
    });

    it('custo zerado gera programado e executado zero', () => {
      const result = calculator.calculatePointByPointMetrics(1000, 400, {
        planejado: 0,
        executado: 0,
      });

      expect(result.moProg).toBe(0);
      expect(result.moExec).toBe(0);
    });

    it('retorna o mesmo formato do cálculo padrão', () => {
      const standard = calculator.calculateWorkOrderMetrics(1, 1, 1, 1);
      const pointByPoint = calculator.calculatePointByPointMetrics(1, 1, {
        planejado: 1,
        executado: 1,
      });

      expect(Object.keys(pointByPoint).sort()).toEqual(
        Object.keys(standard).sort(),
      );
    });
  });

  describe('calculateGoalPercentage', () => {
    it('calcula o percentual da meta', () => {
      expect(calculator.calculateGoalPercentage(50, 200)).toBe(25);
    });

    it('permite passar de 100%', () => {
      expect(calculator.calculateGoalPercentage(300, 200)).toBe(150);
    });

    it('meta zero retorna 0', () => {
      expect(calculator.calculateGoalPercentage(50, 0)).toBe(0);
    });

    it('meta negativa retorna 0', () => {
      expect(calculator.calculateGoalPercentage(50, -10)).toBe(0);
    });

    it('valor zero retorna 0', () => {
      expect(calculator.calculateGoalPercentage(0, 100)).toBe(0);
    });
  });

  describe('calculateMoPrev', () => {
    it('usa o prog quando exec é nulo', () => {
      expect(calculator.calculateMoPrev(1000, null, 40)).toEqual({
        moPrev: 400,
      });
    });

    it('usa o exec quando informado', () => {
      expect(calculator.calculateMoPrev(1000, 80, 40)).toEqual({ moPrev: 800 });
    });

    it('exec igual a 0 é considerado executado (não cai no prog)', () => {
      expect(calculator.calculateMoPrev(1000, 0, 40)).toEqual({ moPrev: 0 });
    });
  });

  describe('calculatePointByPointMoPrev', () => {
    const cost = { planejado: 300, executado: 120 };

    it('usa o planejado quando exec é nulo', () => {
      expect(calculator.calculatePointByPointMoPrev(null, cost)).toEqual({
        moPrev: 300,
      });
    });

    it('usa o executado quando exec foi informado', () => {
      expect(calculator.calculatePointByPointMoPrev(80, cost)).toEqual({
        moPrev: 120,
      });
    });

    it('exec igual a 0 é considerado executado (usa o executado)', () => {
      expect(calculator.calculatePointByPointMoPrev(0, cost)).toEqual({
        moPrev: 120,
      });
    });
  });

  describe('calculateExecutionRate', () => {
    it('calcula executado / programado em percentual', () => {
      expect(calculator.calculateExecutionRate(200, 50)).toBe(25);
    });

    it('programado zero retorna 0', () => {
      expect(calculator.calculateExecutionRate(0, 50)).toBe(0);
    });

    it('executado zero retorna 0', () => {
      expect(calculator.calculateExecutionRate(100, 0)).toBe(0);
    });

    it('permite passar de 100%', () => {
      expect(calculator.calculateExecutionRate(100, 150)).toBe(150);
    });
  });

  describe('aggregateDailySummaryTotals', () => {
    const rows = [
      { qtdeSchedules: 2, teamsTotal: 3, totalMoProg: 500, totalMoExec: 250 },
      { qtdeSchedules: 1, teamsTotal: 4, totalMoProg: 300, totalMoExec: 300 },
    ] as any[];
    const capacity = {
      totalFinancialGoal: 2000,
      totalFinancialGoalWith8: 2170,
    };
    const portfolio = { qtdeWorks: 7, portfolioSap: 0, portfolioExec: 0 };
    const teams = { rfpTeams: 5, executionCapacityTeams: 9 };

    it('soma agendamentos, equipes, programado e executado', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        teams,
      );

      expect(totals.totalSchedules).toBe(3);
      expect(totals.totalTeams).toBe(7);
      expect(totals.totalMoProg).toBe(800);
      expect(totals.totalMoExec).toBe(550);
    });

    it('repassa as metas financeiras', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        teams,
      );

      expect(totals.totalFinancialGoal).toBe(2000);
      expect(totals.totalFinancialGoalWith8).toBe(2170);
    });

    it('calcula o percentual diário como programado total / meta', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        teams,
      );

      expect(totals.totalDiaryGoal).toBeCloseTo((800 / 2000) * 100, 6);
      expect(totals.totalDiaryGoalWith8).toBeCloseTo((800 / 2170) * 100, 6);
    });

    it('meta zerada gera percentual diário 0', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        { totalFinancialGoal: 0, totalFinancialGoalWith8: 0 },
        portfolio,
        teams,
      );

      expect(totals.totalDiaryGoal).toBe(0);
      expect(totals.totalDiaryGoalWith8).toBe(0);
    });

    it('calcula a taxa de execução total', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        teams,
      );

      expect(totals.totalDiff).toBeCloseTo((550 / 800) * 100, 6);
    });

    it('usa a quantidade de obras da carteira e as equipes de capacidade', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        teams,
      );

      expect(totals.totalWorks).toBe(7);
      expect(totals.totalQtdeRfpTeams).toBe(5);
      expect(totals.totalExecutionCapacityTeams).toBe(9);
    });

    it('mantém equipes nulas quando não há capacidade cadastrada', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        rows,
        capacity,
        portfolio,
        { rfpTeams: null, executionCapacityTeams: null },
      );

      expect(totals.totalQtdeRfpTeams).toBeNull();
      expect(totals.totalExecutionCapacityTeams).toBeNull();
    });

    it('sem linhas, mantém totais zerados', () => {
      const totals = calculator.aggregateDailySummaryTotals(
        [],
        { totalFinancialGoal: 0, totalFinancialGoalWith8: 0 },
        { ...portfolio, qtdeWorks: 0 },
        teams,
      );

      expect(totals.totalSchedules).toBe(0);
      expect(totals.totalMoProg).toBe(0);
      expect(totals.totalDiff).toBe(0);
      expect(totals.totalWorks).toBe(0);
    });
  });

  describe('aggregateGroupTotals', () => {
    const makeRow = (idGrupo: number, prog: number, exec: number, prev = 0) =>
      ({
        idGrupo,
        qtdeSchedules: 1,
        totalMoProg: prog,
        totalMoExec: exec,
        totalMoPrev: prev,
      }) as any;

    const portfolio = {
      portfolioRda: 20,
      portfolioBt0: 30,
      portfolioRecom: 40,
      portfolioMarket: 50,
      portfolioTotal: 140,
    };
    const unique = { totalMoPlan: 5000, totalMoPend: 2000 };

    it('soma os totais gerais por agrupamento', () => {
      const totals = calculator.aggregateGroupTotals(
        [makeRow(1, 100, 50, 80), makeRow(3, 200, 100, 150)],
        portfolio,
        unique,
      );

      expect(totals.totalSchedules).toBe(2);
      expect(totals.totalMoProgByGrouping).toBe(300);
      expect(totals.totalMoExecByGrouping).toBe(150);
      expect(totals.totalMoPrevByGrouping).toBe(230);
    });

    it('separa programado e executado por grupo (1=Mercado, 2=Recom, 3=RDA, 4=BT0)', () => {
      const totals = calculator.aggregateGroupTotals(
        [
          makeRow(1, 10, 1),
          makeRow(2, 20, 2),
          makeRow(3, 30, 3),
          makeRow(4, 40, 4),
          makeRow(1, 100, 10),
        ],
        portfolio,
        unique,
      );

      expect(totals.totalProgMarket).toBe(110);
      expect(totals.totalExecMarket).toBe(11);
      expect(totals.totalProgRecom).toBe(20);
      expect(totals.totalExecRecom).toBe(2);
      expect(totals.totalProgRda).toBe(30);
      expect(totals.totalExecRda).toBe(3);
      expect(totals.totalProgBt0).toBe(40);
      expect(totals.totalExecBt0).toBe(4);
    });

    it('grupos desconhecidos entram só nos totais gerais', () => {
      const totals = calculator.aggregateGroupTotals(
        [makeRow(99, 100, 50)],
        portfolio,
        unique,
      );

      expect(totals.totalMoProgByGrouping).toBe(100);
      expect(totals.totalProgMarket).toBe(0);
      expect(totals.totalProgRecom).toBe(0);
      expect(totals.totalProgRda).toBe(0);
      expect(totals.totalProgBt0).toBe(0);
    });

    it('preenche a carteira por grupo e o total', () => {
      const totals = calculator.aggregateGroupTotals([], portfolio, unique);

      expect(totals.totalWalletRda).toBe(20);
      expect(totals.totalWalletBt0).toBe(30);
      expect(totals.totalWalletRecom).toBe(40);
      expect(totals.totalWalletMarket).toBe(50);
      expect(totals.totalWallet).toBe(140);
    });

    it('usa os valores de obras únicas para planejado e pendente', () => {
      const totals = calculator.aggregateGroupTotals([], portfolio, unique);

      expect(totals.totalMoPlanByGrouping).toBe(5000);
      expect(totals.totalMoPendByGrouping).toBe(2000);
    });

    it('calcula a taxa de execução total', () => {
      const totals = calculator.aggregateGroupTotals(
        [makeRow(1, 200, 50)],
        portfolio,
        unique,
      );

      expect(totals.totalDiff).toBe(25);
    });

    it('sem linhas, taxa de execução é 0', () => {
      const totals = calculator.aggregateGroupTotals([], portfolio, unique);

      expect(totals.totalDiff).toBe(0);
    });
  });
});
