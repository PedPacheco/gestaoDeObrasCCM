import { MonthlySummaryService } from 'src/application/usecases/works/schedule/getMonthlySummary.service';
import { MonthlySummaryCalculator } from 'src/domain/services/monthlySummaryCalculator.service';
import { PointByPointCostService } from 'src/domain/services/pointByPointCost.service';
import {
  FINANCIAL_OVERHEAD_FACTOR,
  MONTH_INDEX_TO_KEY,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

// Mapper mockado: o foco aqui é a regra do use case (padrão x ponto a ponto),
// não o formato interno dos totais do mapper.
jest.mock('src/application/mappers/monthlySummaryMapper', () => ({
  MonthlySummaryMapper: class {},
  createUniqueWorksFinancial: () => ({ totalMoPlan: 0, totalMoPend: 0 }),
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

type Filters = Parameters<MonthlySummaryService['getSummary']>[0];

const filters = {
  dataInicial: '01/03/2026',
  dataFinal: '31/03/2026',
  idParceira: [1],
  idRegional: [2],
} as unknown as Filters;

const makeObra = (overrides: Record<string, any> = {}) => ({
  programacao_ponto_a_ponto: false,
  ovnota: 'OV1',
  ordem_dci: 'I1',
  ordem_dca: 'A1',
  ordem_dcd: 'D1',
  ordem_dcim: 'M1',
  mo_planejada: 1000,
  mo_pend: 400,
  executado: 0,
  id_turma: 1,
  turmas: { turma: 'T1' },
  tipos: { id_grupo: 1, grupos: { grupo: 'MERCADO' } },
  ...overrides,
});

const makeRecord = (overrides: Record<string, any> = {}) => ({
  id: 1,
  data_prog: '2026-03-10T00:00:00.000Z',
  prog: 50,
  exec: null,
  equipe_linha_viva: 0,
  equipe_linha_morta: 0,
  equipe_regularizacao: 0,
  obras: makeObra(),
  ...overrides,
});

const makeServiceItem = (overrides: Record<string, any> = {}) => ({
  idProg: 1,
  tipo: 'S',
  qtdeProgramada: 0,
  qtdeRealizada: 0,
  preco: 0,
  ...overrides,
});

describe('MonthlySummaryService', () => {
  let monthlySummaryRepository: {
    getSummary: jest.Mock;
    getPortfolioSummary: jest.Mock;
    getContractValue: jest.Mock;
  };
  let executionCapacityRepository: { getFinancialValue: jest.Mock };
  let teamsAggregatorService: {
    buildTotalTeamsMap: jest.Mock;
    buildExecutionCapacityTeams: jest.Mock;
  };
  let workServicesQueryService: {
    getServiceScheduleHistoryByIdSchedule: jest.Mock;
  };
  let summaryMapper: Record<string, jest.Mock>;
  let calculator: MonthlySummaryCalculator;
  let service: MonthlySummaryService;

  const arrange = (
    data: any[],
    options: {
      portfolio?: any[];
      contracts?: any[];
      capacity?: any[];
      services?: any[];
    } = {},
  ) => {
    monthlySummaryRepository.getSummary.mockResolvedValue(data);
    monthlySummaryRepository.getPortfolioSummary.mockResolvedValue(
      options.portfolio ?? [],
    );
    monthlySummaryRepository.getContractValue.mockResolvedValue(
      options.contracts ?? [],
    );
    executionCapacityRepository.getFinancialValue.mockResolvedValue(
      options.capacity ?? [],
    );
    workServicesQueryService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      options.services ?? [],
    );
  };

  beforeEach(() => {
    monthlySummaryRepository = {
      getSummary: jest.fn(),
      getPortfolioSummary: jest.fn(),
      getContractValue: jest.fn(),
    };
    executionCapacityRepository = { getFinancialValue: jest.fn() };
    teamsAggregatorService = {
      buildTotalTeamsMap: jest.fn(() => new Map()),
      buildExecutionCapacityTeams: jest.fn(() => ({
        rfpTeams: 3,
        executionCapacityTeams: 5,
      })),
    };
    workServicesQueryService = {
      getServiceScheduleHistoryByIdSchedule: jest.fn().mockResolvedValue([]),
    };

    summaryMapper = {
      createDailySummaryEntry: jest.fn((date, _metrics, teamsTotal) => ({
        dataProg: date,
        teamsTotal: teamsTotal ?? 0,
        qtdeSchedules: 0,
        totalMoProg: 0,
        totalMoExec: 0,
      })),
      accumulateDailySummaryEntry: jest.fn((entry, metrics) => {
        entry.qtdeSchedules += 1;
        entry.totalMoProg += metrics.moProg;
        entry.totalMoExec += metrics.moExec;
      }),
      createGroupTeamEntry: jest.fn((grupo, turma, idTurma, idGrupo) => ({
        grupo,
        turma,
        idTurma,
        idGrupo,
        qtdeSchedules: 0,
        totalMoProg: 0,
        totalMoExec: 0,
        totalMoPrev: 0,
      })),
      accumulateGroupTeamEntry: jest.fn((entry, metrics, moPrev) => {
        entry.qtdeSchedules += 1;
        entry.totalMoProg += metrics.moProg;
        entry.totalMoExec += metrics.moExec;
        entry.totalMoPrev += moPrev;
      }),
    };

    calculator = new MonthlySummaryCalculator();

    service = new MonthlySummaryService(
      monthlySummaryRepository as never,
      calculator,
      executionCapacityRepository as never,
      summaryMapper as never,
      teamsAggregatorService as never,
      workServicesQueryService as never,
      new PointByPointCostService(),
    );
  });

  describe('getSummary', () => {
    describe('busca de dados', () => {
      it('consulta repositórios usando os filtros e o ano da data final', async () => {
        arrange([]);

        await service.getSummary(filters);

        expect(monthlySummaryRepository.getSummary).toHaveBeenCalledWith(
          filters,
        );
        expect(
          monthlySummaryRepository.getPortfolioSummary,
        ).toHaveBeenCalledWith(filters);
        expect(monthlySummaryRepository.getContractValue).toHaveBeenCalledWith(
          filters,
        );
        expect(
          executionCapacityRepository.getFinancialValue,
        ).toHaveBeenCalledWith({
          ano: '2026',
          idParceira: [1],
          idRegional: [2],
        });
      });

      it('sem registros retorna resumo vazio e totais calculados', async () => {
        arrange([]);

        const result = await service.getSummary(filters);

        expect(result.summary).toEqual([]);
        expect(result.totals).toBeDefined();
        expect(result.totals.totalSchedules).toBe(0);
      });
    });

    describe('cálculo padrão (ponto_a_ponto = false)', () => {
      it('programado = mo_planejada x prog%', async () => {
        arrange([makeRecord({ prog: 50, exec: null })]);

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(500);
        expect(summary[0].totalMoExec).toBe(0);
      });

      it('executado = mo_planejada x exec%', async () => {
        arrange([makeRecord({ prog: 50, exec: 25 })]);

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(500);
        expect(summary[0].totalMoExec).toBe(250);
      });

      it('não consulta serviços ponto a ponto quando nenhuma obra é ponto a ponto', async () => {
        arrange([makeRecord(), makeRecord({ id: 2 })]);

        await service.getSummary(filters);

        expect(
          workServicesQueryService.getServiceScheduleHistoryByIdSchedule,
        ).not.toHaveBeenCalled();
      });

      it('usa o calculador padrão e não o de ponto a ponto', async () => {
        const standardSpy = jest.spyOn(calculator, 'calculateWorkOrderMetrics');
        const p2pSpy = jest.spyOn(calculator, 'calculatePointByPointMetrics');
        arrange([makeRecord()]);

        await service.getSummary(filters);

        expect(standardSpy).toHaveBeenCalledWith(1000, 400, 50, 0);
        expect(p2pSpy).not.toHaveBeenCalled();
      });
    });

    describe('cálculo ponto a ponto (ponto_a_ponto = true)', () => {
      const p2pRecord = (overrides: Record<string, any> = {}) =>
        makeRecord({
          id: 7,
          obras: makeObra({ programacao_ponto_a_ponto: true }),
          ...overrides,
        });

      it('programado e executado vêm dos serviços, não de mo_planejada', async () => {
        arrange([p2pRecord({ prog: 50, exec: 25 })], {
          services: [
            makeServiceItem({
              idProg: 7,
              qtdeProgramada: 10,
              qtdeRealizada: 4,
              preco: 25,
            }),
          ],
        });

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(250);
        expect(summary[0].totalMoExec).toBe(100);
      });

      it('soma vários serviços da mesma programação', async () => {
        arrange([p2pRecord()], {
          services: [
            makeServiceItem({
              idProg: 7,
              qtdeProgramada: 2,
              qtdeRealizada: 1,
              preco: 100,
            }),
            makeServiceItem({
              idProg: 7,
              qtdeProgramada: 3,
              qtdeRealizada: 3,
              preco: 50,
            }),
            makeServiceItem({
              idProg: 7,
              tipo: 'M',
              qtdeProgramada: 3,
              qtdeRealizada: 3,
              preco: 50,
            }),
          ],
        });

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(350);
        expect(summary[0].totalMoExec).toBe(250);
      });

      it('consulta serviços apenas das programações ponto a ponto', async () => {
        arrange([
          makeRecord({ id: 1 }),
          p2pRecord({ id: 7 }),
          p2pRecord({ id: 8 }),
        ]);

        await service.getSummary(filters);

        expect(
          workServicesQueryService.getServiceScheduleHistoryByIdSchedule,
        ).toHaveBeenCalledTimes(1);
        expect(
          workServicesQueryService.getServiceScheduleHistoryByIdSchedule,
        ).toHaveBeenCalledWith([7, 8]);
      });

      it('programação ponto a ponto sem serviços fica zerada', async () => {
        arrange([p2pRecord({ prog: 80, exec: 80 })], { services: [] });

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(0);
        expect(summary[0].totalMoExec).toBe(0);
      });

      it('ignora serviços de outras programações', async () => {
        arrange([p2pRecord({ id: 7 })], {
          services: [
            makeServiceItem({
              idProg: 999,
              qtdeProgramada: 100,
              qtdeRealizada: 100,
              preco: 100,
            }),
          ],
        });

        const { summary } = await service.getSummary(filters);

        expect(summary[0].totalMoProg).toBe(0);
      });

      it('usa o calculador ponto a ponto, mantendo moPlan/moPend da obra', async () => {
        const p2pSpy = jest.spyOn(calculator, 'calculatePointByPointMetrics');
        const standardSpy = jest.spyOn(calculator, 'calculateWorkOrderMetrics');
        arrange([p2pRecord()], {
          services: [
            makeServiceItem({
              idProg: 7,
              qtdeProgramada: 1,
              qtdeRealizada: 1,
              preco: 10,
            }),
          ],
        });

        await service.getSummary(filters);

        expect(p2pSpy).toHaveBeenCalledWith(1000, 400, {
          planejado: 10,
          executado: 10,
        });
        expect(standardSpy).not.toHaveBeenCalled();
      });

      it('mistura obras padrão e ponto a ponto no mesmo dia', async () => {
        arrange(
          [
            makeRecord({ id: 1, prog: 50, exec: 50 }), // padrão: 500 / 500
            p2pRecord({ id: 7 }), // ponto a ponto: 250 / 100
          ],
          {
            services: [
              makeServiceItem({
                idProg: 7,
                qtdeProgramada: 10,
                qtdeRealizada: 4,
                preco: 25,
              }),
            ],
          },
        );

        const { summary } = await service.getSummary(filters);

        expect(summary).toHaveLength(1);
        expect(summary[0].qtdeSchedules).toBe(2);
        expect(summary[0].totalMoProg).toBe(750);
        expect(summary[0].totalMoExec).toBe(600);
      });
    });

    describe('agrupamento por dia', () => {
      it('registros no mesmo dia viram uma única entrada', async () => {
        arrange([makeRecord({ id: 1 }), makeRecord({ id: 2 })]);

        const { summary } = await service.getSummary(filters);

        expect(summary).toHaveLength(1);
        expect(summary[0].dataProg).toBe('10/03/2026');
        expect(summary[0].qtdeSchedules).toBe(2);
        expect(summaryMapper.createDailySummaryEntry).toHaveBeenCalledTimes(1);
      });

      it('dias diferentes geram entradas diferentes', async () => {
        arrange([
          makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
          makeRecord({ id: 2, data_prog: '2026-03-11T00:00:00.000Z' }),
        ]);

        const { summary } = await service.getSummary(filters);

        expect(summary.map((s: any) => s.dataProg)).toEqual([
          '10/03/2026',
          '11/03/2026',
        ]);
      });

      it('repassa o total de equipes do dia ao criar a entrada', async () => {
        teamsAggregatorService.buildTotalTeamsMap.mockReturnValue(
          new Map([['10/03/2026', 4]]),
        );
        arrange([
          makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
          makeRecord({ id: 2, data_prog: '2026-03-11T00:00:00.000Z' }),
        ]);

        await service.getSummary(filters);

        const calls = summaryMapper.createDailySummaryEntry.mock.calls;
        expect(calls[0][0]).toBe('10/03/2026');
        expect(calls[0][2]).toBe(4);
        expect(calls[1][0]).toBe('11/03/2026');
        expect(calls[1][2]).toBeUndefined();
      });

      it('calcula a taxa de execução (diff) de cada dia', async () => {
        arrange([makeRecord({ prog: 50, exec: 25 })]);

        const { summary } = await service.getSummary(filters);

        expect(summary[0].diff).toBe(50);
      });

      it('diff é 0 quando nada foi programado', async () => {
        arrange([makeRecord({ prog: 0, exec: 0 })]);

        const { summary } = await service.getSummary(filters);

        expect(summary[0].diff).toBe(0);
      });
    });

    describe('meta financeira', () => {
      const capacity = [
        {
          [MONTH_INDEX_TO_KEY[2]]: 2,
          [MONTH_INDEX_TO_KEY[3]]: 1,
          should_cost: 1000,
        },
      ];

      it('contribuição da meta usa o programado da obra e a meta diária do mês', async () => {
        arrange([makeRecord({ prog: 50 })], { capacity });

        await service.getSummary(filters);

        const dailyGoal = 2000 / WORKING_DAYS_PER_MONTH;
        const args = summaryMapper.accumulateDailySummaryEntry.mock.calls[0];
        expect(args[1]).toMatchObject({ moProg: 500 });
        expect(args[2]).toBeCloseTo((500 / dailyGoal) * 100, 6);
        expect(args[3]).toBeCloseTo(
          (500 / (dailyGoal * FINANCIAL_OVERHEAD_FACTOR)) * 100,
          6,
        );
      });

      it('para ponto a ponto a contribuição usa o valor dos serviços', async () => {
        arrange(
          [
            makeRecord({
              id: 7,
              obras: makeObra({ programacao_ponto_a_ponto: true }),
            }),
          ],
          {
            capacity,
            services: [
              makeServiceItem({
                idProg: 7,
                qtdeProgramada: 10,
                qtdeRealizada: 0,
                preco: 25,
              }),
            ],
          },
        );

        await service.getSummary(filters);

        const dailyGoal = 2000 / WORKING_DAYS_PER_MONTH;
        const args = summaryMapper.accumulateDailySummaryEntry.mock.calls[0];
        expect(args[1]).toMatchObject({ moProg: 250 });
        expect(args[2]).toBeCloseTo((250 / dailyGoal) * 100, 6);
      });

      it('sem capacidade cadastrada a contribuição é 0', async () => {
        arrange([makeRecord()], { capacity: [] });

        await service.getSummary(filters);

        const args = summaryMapper.accumulateDailySummaryEntry.mock.calls[0];
        expect(args[2]).toBe(0);
        expect(args[3]).toBe(0);
      });

      it('calcula a capacidade do mês uma única vez', async () => {
        const spy = jest.spyOn(calculator, 'aggregateFinancialCapacityByMonth');
        arrange(
          [
            makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
            makeRecord({ id: 2, data_prog: '2026-03-11T00:00:00.000Z' }),
            makeRecord({ id: 3, data_prog: '2026-03-12T00:00:00.000Z' }),
          ],
          { capacity },
        );

        await service.getSummary(filters);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(capacity, 2);
      });

      it('calcula a capacidade de cada mês presente nos registros', async () => {
        const spy = jest.spyOn(calculator, 'aggregateFinancialCapacityByMonth');
        arrange(
          [
            makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
            makeRecord({ id: 2, data_prog: '2026-04-10T00:00:00.000Z' }),
          ],
          { capacity },
        );

        await service.getSummary({
          ...filters,
          dataFinal: '30/04/2026',
        } as Filters);

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe('totais', () => {
      const capacity = [
        {
          [MONTH_INDEX_TO_KEY[2]]: 2,
          [MONTH_INDEX_TO_KEY[3]]: 1,
          should_cost: 1000,
        },
      ];

      it('soma a meta financeira dos meses presentes no período', async () => {
        const spy = jest.spyOn(calculator, 'aggregateDailySummaryTotals');
        arrange(
          [
            makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
            makeRecord({ id: 2, data_prog: '2026-04-10T00:00:00.000Z' }),
          ],
          { capacity },
        );

        await service.getSummary({
          ...filters,
          dataFinal: '30/04/2026',
        } as Filters);

        const totalArg = spy.mock.calls[0][1];
        expect(totalArg.totalFinancialGoal).toBeCloseTo(3000, 6);
        expect(totalArg.totalFinancialGoalWith8).toBeCloseTo(3000 * 1.085, 6);
      });

      it('meses sem registros não entram na meta', async () => {
        const spy = jest.spyOn(calculator, 'aggregateDailySummaryTotals');
        arrange([makeRecord()], { capacity });

        await service.getSummary(filters);

        expect(spy.mock.calls[0][1].totalFinancialGoal).toBeCloseTo(2000, 6);
      });

      it('carteira: conta obras e soma o saldo planejado a executar', async () => {
        const spy = jest.spyOn(calculator, 'aggregateDailySummaryTotals');
        arrange([makeRecord()], {
          portfolio: [
            { mo_planejada: 1000, executado: 25 },
            { mo_planejada: null, executado: null },
            { mo_planejada: 200, executado: null },
          ],
        });

        await service.getSummary(filters);

        expect(spy.mock.calls[0][2]).toEqual({
          qtdeWorks: 3,
          portfolioExec: 750 + 0 + 200,
        });
      });

      it('repassa as equipes de capacidade de execução', async () => {
        const spy = jest.spyOn(calculator, 'aggregateDailySummaryTotals');
        arrange([makeRecord()]);

        const { totals } = await service.getSummary(filters);

        expect(
          teamsAggregatorService.buildExecutionCapacityTeams,
        ).toHaveBeenCalledWith('01/03/2026', '31/03/2026', []);
        expect(spy.mock.calls[0][3]).toEqual({
          rfpTeams: 3,
          executionCapacityTeams: 5,
        });
        expect(totals.totalQtdeRfpTeams).toBe(3);
        expect(totals.totalExecutionCapacityTeams).toBe(5);
      });

      it('totais refletem o resumo, incluindo obras ponto a ponto', async () => {
        arrange(
          [
            makeRecord({ id: 1, prog: 50, exec: 50 }),
            makeRecord({
              id: 7,
              obras: makeObra({ programacao_ponto_a_ponto: true }),
            }),
          ],
          {
            services: [
              makeServiceItem({
                idProg: 7,
                qtdeProgramada: 10,
                qtdeRealizada: 4,
                preco: 25,
              }),
            ],
          },
        );

        const { totals } = await service.getSummary(filters);

        expect(totals.totalMoProg).toBe(750);
        expect(totals.totalMoExec).toBe(600);
        expect(totals.totalSchedules).toBe(2);
      });
    });

    describe('valor de contrato mensal', () => {
      it('soma valor_contrato / meses de todos os contratos', async () => {
        arrange([makeRecord()], {
          contracts: [
            { valor_contrato: 1200, meses: 12 },
            { valor_contrato: 600, meses: 6 },
          ],
        });

        const result = await service.getSummary(filters);

        expect(result.contractValueByMonth).toEqual({ monthlyValue: 200 });
      });

      it('sem contratos o valor mensal é 0', async () => {
        arrange([makeRecord()]);

        const result = await service.getSummary(filters);

        expect(result.contractValueByMonth).toEqual({ monthlyValue: 0 });
      });
    });
  });

  describe('getSecondSummary', () => {
    const p2pRecord = (overrides: Record<string, any> = {}) =>
      makeRecord({
        id: 7,
        obras: makeObra({ programacao_ponto_a_ponto: true }),
        ...overrides,
      });

    describe('busca de dados', () => {
      it('consulta resumo e carteira com os filtros', async () => {
        arrange([]);

        await service.getSecondSummary(filters);

        expect(monthlySummaryRepository.getSummary).toHaveBeenCalledWith(
          filters,
        );
        expect(
          monthlySummaryRepository.getPortfolioSummary,
        ).toHaveBeenCalledWith(filters);
      });

      it('sem registros retorna resumo vazio', async () => {
        arrange([]);

        const result = await service.getSecondSummary(filters);

        expect(result.summary).toEqual([]);
        expect(result.totals).toBeDefined();
      });

      it('não consulta serviços quando não há obras ponto a ponto', async () => {
        arrange([makeRecord()]);

        await service.getSecondSummary(filters);

        expect(
          workServicesQueryService.getServiceScheduleHistoryByIdSchedule,
        ).not.toHaveBeenCalled();
      });

      it('consulta serviços apenas das programações ponto a ponto', async () => {
        arrange([
          makeRecord({ id: 1 }),
          p2pRecord({ id: 7 }),
          p2pRecord({ id: 9 }),
        ]);

        await service.getSecondSummary(filters);

        expect(
          workServicesQueryService.getServiceScheduleHistoryByIdSchedule,
        ).toHaveBeenCalledWith([7, 9]);
      });
    });

    describe('agrupamento por grupo/turma', () => {
      it('mesma turma e mesmo grupo viram uma única entrada', async () => {
        arrange([
          makeRecord({ id: 1, obras: makeObra({ ovnota: 'OV1' }) }),
          makeRecord({ id: 2, obras: makeObra({ ovnota: 'OV2' }) }),
        ]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary).toHaveLength(1);
        expect(summary[0].grupo).toBe('MERCADO');
        expect(summary[0].turma).toBe('T1');
        expect(summary[0].qtdeSchedules).toBe(2);
      });

      it('turmas ou grupos diferentes geram entradas diferentes', async () => {
        arrange([
          makeRecord({ id: 1 }),
          makeRecord({
            id: 2,
            obras: makeObra({
              ovnota: 'OV2',
              id_turma: 2,
              turmas: { turma: 'T2' },
            }),
          }),
          makeRecord({
            id: 3,
            obras: makeObra({
              ovnota: 'OV3',
              tipos: { id_grupo: 3, grupos: { grupo: 'RDA' } },
            }),
          }),
        ]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary.map((s: any) => `${s.grupo}::${s.turma}`)).toEqual([
          'MERCADO::T1',
          'MERCADO::T2',
          'RDA::T1',
        ]);
      });

      it('cria a entrada com idTurma e idGrupo da obra', async () => {
        arrange([
          makeRecord({
            obras: makeObra({
              id_turma: 5,
              tipos: { id_grupo: 4, grupos: { grupo: 'BT0' } },
            }),
          }),
        ]);

        await service.getSecondSummary(filters);

        expect(summaryMapper.createGroupTeamEntry).toHaveBeenCalledWith(
          'BT0',
          'T1',
          5,
          4,
        );
      });

      it('calcula o diff de cada entrada', async () => {
        arrange([makeRecord({ prog: 50, exec: 25 })]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].diff).toBe(50);
      });
    });

    describe('cálculo padrão', () => {
      it('programado/executado vêm de mo_planejada e percentuais', async () => {
        arrange([makeRecord({ prog: 50, exec: 25 })]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoProg).toBe(500);
        expect(summary[0].totalMoExec).toBe(250);
      });

      it('exec nulo conta como zero no executado', async () => {
        arrange([makeRecord({ prog: 50, exec: null })]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoExec).toBe(0);
      });

      it('previsto usa o prog quando exec é nulo', async () => {
        arrange([makeRecord({ prog: 50, exec: null })]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoPrev).toBe(500);
      });

      it('previsto usa o exec quando informado', async () => {
        arrange([makeRecord({ prog: 50, exec: 80 })]);

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoPrev).toBe(800);
      });
    });

    describe('cálculo ponto a ponto', () => {
      const services = [
        makeServiceItem({
          idProg: 7,
          qtdeProgramada: 10,
          qtdeRealizada: 4,
          preco: 25,
        }),
      ];

      it('programado/executado vêm dos serviços', async () => {
        arrange([p2pRecord({ prog: 50, exec: 25 })], { services });

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoProg).toBe(250);
        expect(summary[0].totalMoExec).toBe(100);
      });

      it('previsto usa o planejado dos serviços quando exec é nulo', async () => {
        arrange([p2pRecord({ exec: null })], { services });

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoPrev).toBe(250);
      });

      it('previsto usa o executado dos serviços quando exec foi informado', async () => {
        arrange([p2pRecord({ exec: 80 })], { services });

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoPrev).toBe(100);
      });

      it('previsto usa o executado também quando exec é 0', async () => {
        arrange([p2pRecord({ exec: 0 })], { services });

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoPrev).toBe(100);
      });

      it('sem serviços, programado, executado e previsto ficam zerados', async () => {
        arrange([p2pRecord({ exec: null })], { services: [] });

        const { summary } = await service.getSecondSummary(filters);

        expect(summary[0].totalMoProg).toBe(0);
        expect(summary[0].totalMoExec).toBe(0);
        expect(summary[0].totalMoPrev).toBe(0);
      });

      it('usa os métodos de ponto a ponto do calculador', async () => {
        const metricsSpy = jest.spyOn(
          calculator,
          'calculatePointByPointMetrics',
        );
        const prevSpy = jest.spyOn(calculator, 'calculatePointByPointMoPrev');
        const standardPrevSpy = jest.spyOn(calculator, 'calculateMoPrev');
        arrange([p2pRecord({ exec: 10 })], { services });

        await service.getSecondSummary(filters);

        expect(metricsSpy).toHaveBeenCalledTimes(1);
        expect(prevSpy).toHaveBeenCalledWith(10, {
          planejado: 250,
          executado: 100,
        });
        expect(standardPrevSpy).not.toHaveBeenCalled();
      });

      it('mistura obras padrão e ponto a ponto na mesma entrada', async () => {
        arrange(
          [
            makeRecord({
              id: 1,
              prog: 50,
              exec: 50,
              obras: makeObra({ ovnota: 'OV1' }),
            }),
            p2pRecord({
              id: 7,
              obras: makeObra({
                ovnota: 'OV2',
                programacao_ponto_a_ponto: true,
              }),
            }),
          ],
          { services },
        );

        const { summary } = await service.getSecondSummary(filters);

        expect(summary).toHaveLength(1);
        expect(summary[0].totalMoProg).toBe(750);
        expect(summary[0].totalMoExec).toBe(600);
      });
    });

    describe('obras únicas', () => {
      it('repete a mesma obra em várias programações: contabiliza uma única vez', async () => {
        const spy = jest.spyOn(calculator, 'aggregateGroupTotals');
        arrange([
          makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
          makeRecord({ id: 2, data_prog: '2026-03-11T00:00:00.000Z' }),
          makeRecord({
            id: 3,
            obras: makeObra({ ovnota: 'OV2', mo_planejada: 500, mo_pend: 100 }),
          }),
        ]);

        await service.getSecondSummary(filters);

        expect(spy.mock.calls[0][2]).toEqual({
          totalMoPlan: 1500,
          totalMoPend: 500,
        });
      });

      it('informa ao mapper se a obra já havia sido contabilizada', async () => {
        arrange([
          makeRecord({ id: 1, data_prog: '2026-03-10T00:00:00.000Z' }),
          makeRecord({ id: 2, data_prog: '2026-03-11T00:00:00.000Z' }),
          makeRecord({ id: 3, obras: makeObra({ ovnota: 'OV2' }) }),
        ]);

        await service.getSecondSummary(filters);

        const flags = summaryMapper.accumulateGroupTeamEntry.mock.calls.map(
          (call) => call[3],
        );
        expect(flags).toEqual([false, true, false]);
      });

      it('a chave da obra considera ovnota e todas as ordens', async () => {
        const spy = jest.spyOn(calculator, 'aggregateGroupTotals');
        arrange([
          makeRecord({ id: 1, obras: makeObra({ ordem_dci: 'I1' }) }),
          makeRecord({ id: 2, obras: makeObra({ ordem_dci: 'I2' }) }),
        ]);

        await service.getSecondSummary(filters);

        expect(spy.mock.calls[0][2].totalMoPlan).toBe(2000);
      });
    });

    describe('carteira', () => {
      it('soma o saldo planejado a executar por grupo', async () => {
        const spy = jest.spyOn(calculator, 'aggregateGroupTotals');
        arrange([makeRecord()], {
          portfolio: [
            { mo_planejada: 1000, executado: 50, tipos: { id_grupo: 1 } },
            { mo_planejada: 2000, executado: 0, tipos: { id_grupo: 3 } },
            { mo_planejada: 500, executado: 0, tipos: { id_grupo: 4 } },
            { mo_planejada: 100, executado: 0, tipos: { id_grupo: 2 } },
          ],
        });

        await service.getSecondSummary(filters);

        expect(spy.mock.calls[0][1]).toEqual({
          portfolioTotal: 500 + 2000 + 500 + 100,
          portfolioMarket: 500,
          portfolioRda: 2000,
          portfolioBt0: 500,
          portfolioRecom: 100,
        });
      });

      it('obras sem mo_planejada/executado contam como zero', async () => {
        const spy = jest.spyOn(calculator, 'aggregateGroupTotals');
        arrange([makeRecord()], {
          portfolio: [
            { mo_planejada: null, executado: null, tipos: { id_grupo: 1 } },
          ],
        });

        await service.getSecondSummary(filters);

        expect(spy.mock.calls[0][1].portfolioTotal).toBe(0);
        expect(spy.mock.calls[0][1].portfolioMarket).toBe(0);
      });

      it('grupo desconhecido entra só no total da carteira', async () => {
        const spy = jest.spyOn(calculator, 'aggregateGroupTotals');
        arrange([makeRecord()], {
          portfolio: [
            { mo_planejada: 100, executado: 0, tipos: { id_grupo: 99 } },
          ],
        });

        await service.getSecondSummary(filters);

        expect(spy.mock.calls[0][1]).toMatchObject({
          portfolioTotal: 100,
          portfolioMarket: 0,
          portfolioRda: 0,
          portfolioBt0: 0,
          portfolioRecom: 0,
        });
      });
    });

    describe('totais', () => {
      it('totais agregam programado e executado por grupo, incluindo ponto a ponto', async () => {
        arrange(
          [
            makeRecord({
              id: 1,
              prog: 50,
              exec: 50,
              obras: makeObra({ ovnota: 'OV1' }),
            }),
            p2pRecord({
              id: 7,
              obras: makeObra({
                ovnota: 'OV2',
                programacao_ponto_a_ponto: true,
              }),
            }),
          ],
          {
            services: [
              makeServiceItem({
                idProg: 7,
                qtdeProgramada: 10,
                qtdeRealizada: 4,
                preco: 25,
              }),
            ],
          },
        );

        const { totals } = await service.getSecondSummary(filters);

        expect(totals.totalMoProgByGrouping).toBe(750);
        expect(totals.totalMoExecByGrouping).toBe(600);
        expect(totals.totalProgMarket).toBe(750);
        expect(totals.totalExecMarket).toBe(600);
        expect(totals.totalSchedules).toBe(2);
      });
    });
  });
});
