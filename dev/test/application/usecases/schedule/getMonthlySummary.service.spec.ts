import { createUniqueWorksFinancial } from 'src/application/mappers/monthlySummaryMapper';
import { MonthlySummaryService } from 'src/application/usecases/works/schedule/getMonthlySummary.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryEntry,
  GroupTeamSummaryEntry,
  MonthlyCapacityMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('src/application/mappers/monthlySummaryMapper', () => ({
  createUniqueWorksFinancial: jest.fn(),
  MonthlySummaryMapper: jest.fn(),
}));

const mockCreateUniqueWorksFinancial = createUniqueWorksFinancial as jest.Mock;

// ─── Factories ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: GetMonthlySummaryDTO = {
  dataFinal: '31/03/2024',
  idParceira: 'parceira-42',
  idRegional: 'regional-2',
} as any;

const DEFAULT_METRICS: MonthlyCapacityMetrics = {
  dailyFinancialGoal: 5000,
  dailyFinancialGoalWithOverhead: 5400,
  totalFinancial: 5000,
  totalFinancialWith8: 5800,
};

function makeRecord(
  overrides: {
    data_prog?: string;
    prog?: number;
    exec?: number | null;
    mo_planejada?: number;
    mo_pend?: number;
    ovnota?: string;
    ordem_dci?: string;
    ordem_dca?: string;
    ordem_dcd?: string;
    ordem_dcim?: string;
    grupo?: string;
    turma?: string;
  } = {},
) {
  return {
    data_prog: overrides.data_prog ?? '2024-03-15T00:00:00.000Z',
    prog: overrides.prog ?? 100,
    exec: overrides.exec !== undefined ? overrides.exec : 80,
    obras: {
      mo_planejada: overrides.mo_planejada ?? 1000,
      mo_pend: overrides.mo_pend ?? 200,
      ovnota: overrides.ovnota ?? 'OV001',
      ordem_dci: overrides.ordem_dci ?? 'DCI001',
      ordem_dca: overrides.ordem_dca ?? 'DCA001',
      ordem_dcd: overrides.ordem_dcd ?? 'DCD001',
      ordem_dcim: overrides.ordem_dcim ?? 'DCIM001',
      tipos: { id_grupo: 1, grupos: { grupo: overrides.grupo ?? 'GRP_A' } },
      turmas: { turma: overrides.turma ?? 'TRM_1' },
    },
  };
}

function makePortfolioRecord(
  overrides: {
    mo_planejada?: number;
    mo_pend?: number;
    ovnota?: string;
    ordem_dci?: string;
    ordem_dca?: string;
    ordem_dcd?: string;
    ordem_dcim?: string;
    executado?: number;
    id_turma?: number;
    id_grupo?: number;
    grupo?: string;
    turma?: string;
  } = {},
) {
  return {
    mo_planejada: overrides.mo_planejada ?? null,
    mo_pend: overrides.mo_pend ?? 200,
    ovnota: overrides.ovnota ?? 'OV001',
    ordem_dci: overrides.ordem_dci ?? 'DCI001',
    ordem_dca: overrides.ordem_dca ?? 'DCA001',
    ordem_dcd: overrides.ordem_dcd ?? 'DCD001',
    ordem_dcim: overrides.ordem_dcim ?? 'DCIM001',
    executado: overrides.executado ?? null,
    id_turma: overrides.id_turma ?? 1,
    tipos: {
      id_grupo: overrides.id_grupo ?? 2,
      grupos: { grupo: overrides.grupo ?? 'GRP_A' },
    },
    turmas: { turma: overrides.turma ?? 'TRM_1' },
  };
}

function makeDailyEntry(date = '15/03/2024'): DailySummaryEntry {
  return {
    dataProg: date,
    qtdeSchedules: 0,
    teamsTotal: 0,
    financialGoal: 0,
    financialGoalWith8: 0,
    diaryGoal: 0,
    diaryGoalWith8: 0,
    totalMoPlan: 0,
    totalMoProg: 0,
    totalMoExec: 0,
    diff: 0,
  };
}

function makeGroupEntry(
  grupo = 'GRP_A',
  turma = 'TRM_1',
): GroupTeamSummaryEntry {
  return {
    grupo,
    turma,
    qtdeSchedules: 0,
    totalMoPlan: 0,
    totalMoProg: 0,
    totalMoPend: 0,
    totalMoExec: 0,
    totalMoPrev: 0,
    diff: 0,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MonthlySummaryService', () => {
  let service: MonthlySummaryService;

  let monthlySummaryRepository: {
    getSummary: jest.Mock;
    getPortfolioSummary: jest.Mock;
    getContractValue: jest.Mock;
  };
  let calculator: {
    aggregateFinancialCapacityByMonth: jest.Mock;
    calculateWorkOrderMetrics: jest.Mock;
    calculateGoalPercentage: jest.Mock;
    calculateMoPrev: jest.Mock;
    calculateExecutionRate: jest.Mock;
    aggregateDailySummaryTotals: jest.Mock;
    aggregateGroupTotals: jest.Mock;
  };
  let summaryMapper: {
    createDailySummaryEntry: jest.Mock;
    accumulateDailySummaryEntry: jest.Mock;
    createGroupTeamEntry: jest.Mock;
    accumulateGroupTeamEntry: jest.Mock;
  };
  let executionCapacityRepository: { getFinancialValue: jest.Mock };
  let teamAggregatorService: {
    buildExecutionCapacityTeams: jest.Mock;
    buildTotalTeamsMap: jest.Mock;
  };

  beforeEach(() => {
    monthlySummaryRepository = {
      getSummary: jest.fn(),
      getPortfolioSummary: jest.fn(),
      getContractValue: jest.fn(),
    };
    calculator = {
      aggregateFinancialCapacityByMonth: jest
        .fn()
        .mockReturnValue(DEFAULT_METRICS),
      calculateWorkOrderMetrics: jest
        .fn()
        .mockReturnValue({ moProg: 800, moExec: 640 }),
      calculateGoalPercentage: jest.fn().mockReturnValue(16),
      calculateMoPrev: jest.fn().mockReturnValue({ moPrev: 720 }),
      calculateExecutionRate: jest.fn().mockReturnValue(80),
      aggregateDailySummaryTotals: jest
        .fn()
        .mockReturnValue({ totalMoProg: 0 }),
      aggregateGroupTotals: jest.fn().mockReturnValue({ totalWorks: 0 }),
    };
    summaryMapper = {
      createDailySummaryEntry: jest.fn().mockReturnValue(makeDailyEntry()),
      accumulateDailySummaryEntry: jest.fn(),
      createGroupTeamEntry: jest.fn().mockReturnValue(makeGroupEntry()),
      accumulateGroupTeamEntry: jest.fn(),
    };
    executionCapacityRepository = {
      getFinancialValue: jest.fn().mockResolvedValue([]),
    };
    teamAggregatorService = {
      buildExecutionCapacityTeams: jest.fn().mockReturnValue([]),
      buildTotalTeamsMap: jest.fn().mockReturnValue(
        new Map<string, number>([
          ['15/03/2024', 5],
          ['16/03/2024', 4],
        ]),
      ),
    };

    mockCreateUniqueWorksFinancial.mockReturnValue({ totalMoPlan: 0 });

    service = new MonthlySummaryService(
      monthlySummaryRepository as any,
      calculator as any,
      executionCapacityRepository as any,
      summaryMapper as any,
      teamAggregatorService as any,
    );
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getSummary ─────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('fetches repository data and execution capacity concurrently, deriving year from dataFinal', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([]);

      await service.getSummary(DEFAULT_FILTERS);

      expect(monthlySummaryRepository.getSummary).toHaveBeenCalledWith(
        DEFAULT_FILTERS,
      );
      expect(
        executionCapacityRepository.getFinancialValue,
      ).toHaveBeenCalledWith({
        ano: '2024',
        idParceira: DEFAULT_FILTERS.idParceira,
        idRegional: DEFAULT_FILTERS.idRegional,
      });
    });

    it('returns empty summary with aggregated totals when repository returns no data', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([]);

      const result = await service.getSummary(DEFAULT_FILTERS);

      expect(result.summary).toEqual([]);
      expect(result.totals).toEqual({ totalMoProg: 0 });
      expect(summaryMapper.createDailySummaryEntry).not.toHaveBeenCalled();
    });

    it('creates entry, calculates metrics and accumulates for a single record', async () => {
      const record = makeRecord({ exec: 80 });
      const recordPorfolio = makePortfolioRecord();
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        recordPorfolio,
      ]);
      monthlySummaryRepository.getSummary.mockResolvedValue([record]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);
      teamAggregatorService.buildTotalTeamsMap.mockReturnValue(
        new Map([['15/03/2024', 5]]),
      );

      const result = await service.getSummary(DEFAULT_FILTERS);

      // month index 2 (March) → financial capacity computed once
      expect(calculator.aggregateFinancialCapacityByMonth).toHaveBeenCalledWith(
        [],
        2,
      );
      // daily entry created with correct date, metrics and teamsTotal
      expect(summaryMapper.createDailySummaryEntry).toHaveBeenCalledWith(
        '15/03/2024',
        DEFAULT_METRICS,
        5,
      );
      // work order metrics use moPlan, prog and exec from the record
      expect(calculator.calculateWorkOrderMetrics).toHaveBeenCalledWith(
        1000,
        200,
        100,
        80,
      );
      // goal percentages computed against both daily goals
      expect(calculator.calculateGoalPercentage).toHaveBeenNthCalledWith(
        1,
        800,
        DEFAULT_METRICS.dailyFinancialGoal,
      );
      expect(calculator.calculateGoalPercentage).toHaveBeenNthCalledWith(
        2,
        800,
        DEFAULT_METRICS.dailyFinancialGoalWithOverhead,
      );
      // diff is appended to the final summary entry
      expect(result.summary[0].diff).toBe(80);
    });

    it('defaults exec to 0 when record.exec is null', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([
        makeRecord({ exec: null }),
      ]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);

      await service.getSummary(DEFAULT_FILTERS);

      expect(calculator.calculateWorkOrderMetrics).toHaveBeenCalledWith(
        1000,
        200,
        100,
        0,
      );
    });

    it('caches financial capacity per month — aggregateFinancialCapacityByMonth called once per distinct month', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([
        makeRecord({ data_prog: '2024-03-01T00:00:00.000Z', ovnota: 'OV001' }),
        makeRecord({ data_prog: '2024-03-20T00:00:00.000Z', ovnota: 'OV002' }),
        makeRecord({ data_prog: '2024-04-10T00:00:00.000Z', ovnota: 'OV003' }),
      ]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);
      summaryMapper.createDailySummaryEntry
        .mockReturnValueOnce(makeDailyEntry('01/03/2024'))
        .mockReturnValueOnce(makeDailyEntry('20/03/2024'))
        .mockReturnValueOnce(makeDailyEntry('10/04/2024'));

      await service.getSummary(DEFAULT_FILTERS);

      expect(
        calculator.aggregateFinancialCapacityByMonth,
      ).toHaveBeenCalledTimes(2);
      expect(calculator.aggregateFinancialCapacityByMonth).toHaveBeenCalledWith(
        [],
        2,
      );
      expect(calculator.aggregateFinancialCapacityByMonth).toHaveBeenCalledWith(
        [],
        3,
      );
    });

    it('creates summaryMap entry once per date but accumulates for every record on that date', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([
        makeRecord({ ovnota: 'OV001' }),
        makeRecord({ ovnota: 'OV002' }), // same date, different work key
      ]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);

      await service.getSummary(DEFAULT_FILTERS);

      expect(summaryMapper.createDailySummaryEntry).toHaveBeenCalledTimes(1);
      expect(summaryMapper.accumulateDailySummaryEntry).toHaveBeenCalledTimes(
        2,
      );
    });

    it('skips accumulateUniqueWorkFinancials for a duplicate work key', async () => {
      const uniqueTarget = { totalMoPlan: 0 };
      mockCreateUniqueWorksFinancial.mockReturnValue(uniqueTarget);
      const record = makeRecord({ mo_planejada: 500 });
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);
      monthlySummaryRepository.getSummary.mockResolvedValue([record, record]); // same key twice

      await service.getSummary(DEFAULT_FILTERS);

      expect(uniqueTarget.totalMoPlan).toBe(0); // counted only once
    });

    it('should treat undefined financial values as 0 when aggregating monthly totals', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([makeRecord()]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      monthlySummaryRepository.getContractValue.mockResolvedValue([
        { id: 1, meses: 60, id_turma: 2, valor_contrato: 151000035.0 },
      ]);

      // força cenário com undefined
      calculator.aggregateFinancialCapacityByMonth = jest
        .fn()
        .mockReturnValueOnce({
          totalFinancial: null,
          totalFinancialWith8: null,
          dailyFinancialGoal: 0,
          dailyFinancialGoalWithOverhead: 0,
        });

      calculator.aggregateDailySummaryTotals = jest.fn().mockReturnValueOnce({
        totalQtdeObras: 0,
        totalTeams: 0,
        totalFinancialGoal: 0,
        totalDiaryGoal: 0,
        totalFinancialGoalWith8: 0,
        totalDiaryGoalWith8: 0,
        totalMoProg: 0,
        totalMoExec: 0,
        totalDiff: 0,
      });

      const result = await service.getSummary(DEFAULT_FILTERS);

      // aqui você valida o resultado final agregado
      expect(result.totals.totalFinancialGoal).toBe(0);
      expect(result.totals.totalFinancialGoalWith8).toBe(0);
    });
  });

  // ─── getSecondSummary ────────────────────────────────────────────────────────

  describe('getSecondSummary', () => {
    it('fetches data from repository without calling executionCapacityRepository', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(monthlySummaryRepository.getSummary).toHaveBeenCalledWith(
        DEFAULT_FILTERS,
      );
      expect(
        executionCapacityRepository.getFinancialValue,
      ).not.toHaveBeenCalled();
    });

    it('returns empty summary with aggregated totals when repository returns no data', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);

      const result = await service.getSecondSummary(DEFAULT_FILTERS);

      expect(result.summary).toEqual([]);
      expect(result.totals).toEqual({ totalWorks: 0 });
    });

    it('creates entry, calculates metrics and accumulates for a single record', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([makeRecord()]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);

      const result = await service.getSecondSummary(DEFAULT_FILTERS);

      expect(summaryMapper.createGroupTeamEntry).toHaveBeenCalledWith(
        'GRP_A',
        'TRM_1',
        undefined,
        1,
      );
      expect(calculator.calculateWorkOrderMetrics).toHaveBeenCalledWith(
        1000,
        200,
        100,
        80,
      );
      expect(calculator.calculateMoPrev).toHaveBeenCalledWith(1000, 80, 100);
      expect(summaryMapper.accumulateGroupTeamEntry).toHaveBeenCalledWith(
        expect.any(Object),
        { moProg: 800, moExec: 640 },
        720,
        false,
      );
      expect(result.summary[0].diff).toBe(80);
    });

    it('creates group entry once per grupo/turma but accumulates for every record in that group', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([
        makeRecord({ ovnota: 'OV001', grupo: 'GRP_A', turma: 'TRM_1' }),
        makeRecord({ ovnota: 'OV002', grupo: 'GRP_A', turma: 'TRM_1' }),
      ]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(summaryMapper.createGroupTeamEntry).toHaveBeenCalledTimes(1);
      expect(summaryMapper.accumulateGroupTeamEntry).toHaveBeenCalledTimes(2);
    });

    it('creates separate group entries for different grupo/turma combinations', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([
        makeRecord({ ovnota: 'OV001', grupo: 'GRP_A', turma: 'TRM_1' }),
        makeRecord({ ovnota: 'OV002', grupo: 'GRP_B', turma: 'TRM_2' }),
      ]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);
      summaryMapper.createGroupTeamEntry
        .mockReturnValueOnce(makeGroupEntry('GRP_A', 'TRM_1'))
        .mockReturnValueOnce(makeGroupEntry('GRP_B', 'TRM_2'));

      const result = await service.getSecondSummary(DEFAULT_FILTERS);

      expect(summaryMapper.createGroupTeamEntry).toHaveBeenCalledTimes(2);
      expect(result.summary).toHaveLength(2);
    });

    it('skips accumulateUniqueWorkFinancials for a duplicate work key', async () => {
      const uniqueTarget = { totalMoPlan: 0 };
      mockCreateUniqueWorksFinancial.mockReturnValue(uniqueTarget);
      const record = makeRecord({ mo_planejada: 300 });
      monthlySummaryRepository.getSummary.mockResolvedValue([record, record]);
      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord(),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(uniqueTarget.totalMoPlan).toBe(300); // counted only once
    });

    it('should accumulate portfolioMarket when portfolio item belongs to Market group (id_grupo = 1)', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([makeRecord()]);

      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord({
          id_grupo: 1,
          mo_planejada: 1000,
          executado: null,
        }),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(calculator.aggregateGroupTotals).toHaveBeenCalledWith(
        expect.any(Array),
        {
          portfolioRda: 0,
          portfolioBt0: 0,
          portfolioRecom: 0,
          portfolioMarket: 1000,
          portfolioTotal: 1000,
        },
        expect.any(Object),
      );
    });

    it('should accumulate portfolioMarket when portfolio item belongs to Market group (id_grupo = 3)', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([makeRecord()]);

      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord({
          id_grupo: 3,
          mo_planejada: 1000,
          executado: null,
        }),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(calculator.aggregateGroupTotals).toHaveBeenCalledWith(
        expect.any(Array),
        {
          portfolioRda: 1000,
          portfolioBt0: 0,
          portfolioRecom: 0,
          portfolioMarket: 0,
          portfolioTotal: 1000,
        },
        expect.any(Object),
      );
    });

    it('should accumulate portfolioMarket when portfolio item belongs to Market group (id_grupo = 4)', async () => {
      monthlySummaryRepository.getSummary.mockResolvedValue([makeRecord()]);

      monthlySummaryRepository.getPortfolioSummary.mockResolvedValue([
        makePortfolioRecord({
          id_grupo: 4,
          mo_planejada: 1000,
          executado: null,
        }),
      ]);

      await service.getSecondSummary(DEFAULT_FILTERS);

      expect(calculator.aggregateGroupTotals).toHaveBeenCalledWith(
        expect.any(Array),
        {
          portfolioRda: 0,
          portfolioBt0: 1000,
          portfolioRecom: 0,
          portfolioMarket: 0,
          portfolioTotal: 1000,
        },
        expect.any(Object),
      );
    });
  });
});
