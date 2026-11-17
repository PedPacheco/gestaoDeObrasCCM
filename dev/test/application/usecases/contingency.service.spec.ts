// test/application/usecases/contingency.service.spec.ts
import type { IContingencyRepository } from 'src/domain/contracts/IContingencyRepository';
import { ValidationError } from 'src/domain/errors/domain.error';
import type {
  CapacityByYearMonth,
  ContingencyGroupItem,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
// ⚠️ Ajuste estes caminhos à localização real
import type { CreateContingencyInput } from 'src/application/types';
import { ContingencyService } from 'src/application/usecases/contingency.service';

// ─── Dados de teste ──────────────────────────────────────────────────

const makeCreateContingencyInput = (
  overrides: Partial<CreateContingencyInput> = {},
): CreateContingencyInput =>
  ({
    availabilityDate: '2025-06-10',
    partnerId: 1,
    laborType: 'ELETRICISTA',
    laborQuantity: 5,
    teamType: 'EQUIPE_A',
    teamQuantity: 3,
    allocatedCsd: 'SIM',
    userId: 42,
    ...overrides,
  }) as CreateContingencyInput;

const makeEmergencyTeam = (
  overrides: Partial<EmergencyTeam> = {},
): EmergencyTeam => ({
  year: 2025,
  month: 6,
  type: 'EQUIPE_A',
  quantity: 3,
  value: 450,
  ...overrides,
});

const makeCapacity = (
  overrides: Partial<CapacityByYearMonth> = {},
): CapacityByYearMonth =>
  ({
    year: 2025,
    month: 6,
    capacity: 10,
    value: 1000,
    ...overrides,
  }) as CapacityByYearMonth;

const makeRecentContingency = (
  overrides: Partial<RecentContingency> = {},
): RecentContingency =>
  ({
    id: 1,
    availabilityDate: new Date('2025-06-10T00:00:00.000Z'),
    userName: 'Ana Silva',
    partner: 'Parceira A',
    ...overrides,
  }) as RecentContingency;

const makeGroupItem = (
  overrides: Partial<ContingencyGroupItem> = {},
): ContingencyGroupItem =>
  ({
    name: 'ELETRICISTA',
    laborQuantity: 5,
    teamsQuantity: 1,
    ...overrides,
  }) as ContingencyGroupItem;

// ─── Mocks ───────────────────────────────────────────────────────────

const makeRepository = () =>
  ({
    create: vi.fn(),
    findRecent: vi.fn(),
    groupByPartner: vi.fn(),
    groupByField: vi.fn(),
    groupByCsd: vi.fn(),
    getEmergencyTeamsWithValue: vi.fn(),
    getCapacityByYearMonth: vi.fn(),
  }) satisfies Partial<Record<keyof IContingencyRepository, Mock>>;

// ─── Suíte ───────────────────────────────────────────────────────────

describe('ContingencyService', () => {
  let repository: ReturnType<typeof makeRepository>;
  let service: ContingencyService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = makeRepository();
    service = new ContingencyService(repository as never);
  });

  // ─── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('should parse the availability date as UTC midnight and delegate to the repository', async () => {
      const input = makeCreateContingencyInput();

      await expect(service.create(input)).resolves.toBeUndefined();

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...input,
        availabilityDate: new Date('2025-06-10T00:00:00.000Z'),
      });
    });

    it.each([
      ['an impossible calendar date', '2025-02-30'],
      ['a different date format', '10/06/2025'],
      ['a single-digit month', '2025-6-10'],
      ['a date with time', '2025-06-10T10:00:00'],
      ['an empty string', ''],
    ])(
      'should throw ValidationError and skip persistence when the date is %s',
      async (_label, availabilityDate) => {
        const promise = service.create(
          makeCreateContingencyInput({ availabilityDate }),
        );

        await expect(promise).rejects.toBeInstanceOf(ValidationError);
        await expect(promise).rejects.toThrow(
          `Data de disponibilidade inválida: "${availabilityDate}". Formato esperado: YYYY-MM-DD`,
        );
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('should propagate repository errors', async () => {
      const dbError = new Error('db down');
      repository.create.mockRejectedValueOnce(dbError);

      await expect(service.create(makeCreateContingencyInput())).rejects.toBe(
        dbError,
      );
    });
  });

  // ─── getDashboard ────────────────────────────────────────────────

  describe('getDashboard', () => {
    beforeEach(() => {
      // 02:00 UTC de 1 de julho = ainda 30 de junho no Brasil (UTC-3)
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2025-07-01T02:00:00.000Z'));

      repository.findRecent.mockResolvedValue([]);
      repository.groupByPartner.mockResolvedValue([]);
      repository.groupByField.mockResolvedValue([]);
      repository.groupByCsd.mockResolvedValue([]);
      repository.getEmergencyTeamsWithValue.mockResolvedValue([]);
      repository.getCapacityByYearMonth.mockResolvedValue([]);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const expectAllQueriesCalledWith = (filter: unknown) => {
      expect(repository.findRecent).toHaveBeenCalledWith(filter);
      expect(repository.groupByPartner).toHaveBeenCalledWith(filter);
      expect(repository.groupByField).toHaveBeenCalledWith('laborType', filter);
      expect(repository.groupByField).toHaveBeenCalledWith('teamType', filter);
      expect(repository.groupByField).toHaveBeenCalledTimes(2);
      expect(repository.groupByCsd).toHaveBeenCalledWith(filter);
      expect(repository.getEmergencyTeamsWithValue).toHaveBeenCalledWith(
        filter,
      );
      expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(filter);
    };

    // ─── Período ───────────────────────────────────────────────────

    describe('default period', () => {
      it('should use the current UTC month when called without a query', async () => {
        await service.getDashboard();

        expectAllQueriesCalledWith({
          mesInicial: '2025-07',
          mesFinal: '2025-07',
        });
      });

      it('should keep other filters when applying the default period', async () => {
        await service.getDashboard({ idParceira: [10] } as never);

        expectAllQueriesCalledWith({
          idParceira: [10],
          mesInicial: '2025-07',
          mesFinal: '2025-07',
        });
      });

      it.each([
        ['only mesInicial', { mesInicial: '2025-01' }],
        ['only mesFinal', { mesFinal: '2025-03' }],
        ['both months', { mesInicial: '2025-01', mesFinal: '2025-03' }],
      ])(
        'should keep the query unchanged when it has %s',
        async (_label, query) => {
          await service.getDashboard(query);

          expect(repository.findRecent.mock.calls[0][0]).toBe(query);
          expectAllQueriesCalledWith(query);
        },
      );
    });

    // ─── Montagem completa ────────────────────────────────────────

    it('should build the dashboard from every repository result', async () => {
      const partners = [{ name: 'Parceira A', value: 4 }];
      const csds = [{ name: 'CSD Norte', value: 2 }];

      repository.findRecent.mockResolvedValueOnce([
        makeRecentContingency({
          id: 7,
          availabilityDate: new Date('2025-06-10T23:30:00.000Z'),
        }),
      ]);
      repository.groupByPartner.mockResolvedValueOnce(partners);
      repository.groupByCsd.mockResolvedValueOnce(csds);
      repository.groupByField.mockImplementation(async (field: string) =>
        field === 'laborType'
          ? [
              makeGroupItem({
                name: 'ELETRICISTA',
                laborQuantity: 5,
                teamsQuantity: 1,
              }),
              makeGroupItem({
                name: 'AJUDANTE',
                laborQuantity: 2,
                teamsQuantity: 1,
              }),
              makeGroupItem({
                name: 'ELETRICISTA',
                laborQuantity: 3,
                teamsQuantity: 1,
              }),
            ]
          : [
              makeGroupItem({
                name: 'EQUIPE_A',
                laborQuantity: 9,
                teamsQuantity: 2,
              }),
              makeGroupItem({
                name: 'EQUIPE_A',
                laborQuantity: 9,
                teamsQuantity: 1,
              }),
            ],
      );
      repository.getEmergencyTeamsWithValue.mockResolvedValueOnce([
        makeEmergencyTeam({
          month: 6,
          type: 'EQUIPE_A',
          quantity: 3,
          value: 450,
        }),
        makeEmergencyTeam({
          month: 6,
          type: 'EQUIPE_B',
          quantity: 2,
          value: 300,
        }),
        makeEmergencyTeam({
          month: 7,
          type: 'EQUIPE_A',
          quantity: 1,
          value: 150,
        }),
      ]);
      repository.getCapacityByYearMonth.mockResolvedValueOnce([
        makeCapacity({ month: 6, capacity: 10, value: 1000 }),
        makeCapacity({ month: 7, capacity: 10, value: 1200 }),
      ]);

      const result = await service.getDashboard({
        mesInicial: '2025-06',
        mesFinal: '2025-07',
      });

      expect(result).toStrictEqual({
        allocatedPercentage: 30, // 6 equipas / 20 de capacidade
        monthlyCapacity: [
          { year: '2025', month: 6, capacity: 10, value: 1000 },
          { year: '2025', month: 7, capacity: 10, value: 1200 },
        ],
        emergencyTeams: [
          { year: 2025, month: 6, type: 'EQUIPE_A', quantity: 5, value: 750 },
          { year: 2025, month: 7, type: 'EQUIPE_A', quantity: 1, value: 150 },
        ],
        recentAnswers: [
          {
            id: 7,
            date: '2025-06-10',
            name: 'Ana Silva',
            partner: 'Parceira A',
          },
        ],
        partners,
        laborTypes: [
          { name: 'ELETRICISTA', value: 8 },
          { name: 'AJUDANTE', value: 2 },
        ],
        teamTypes: [{ name: 'EQUIPE_A', value: 3 }],
        csds,
      });
      expect(result.partners).toBe(partners);
      expect(result.csds).toBe(csds);
    });

    it('should return empty sections and a null percentage when there is no data', async () => {
      await expect(service.getDashboard()).resolves.toStrictEqual({
        allocatedPercentage: null,
        monthlyCapacity: [],
        emergencyTeams: [],
        recentAnswers: [],
        partners: [],
        laborTypes: [],
        teamTypes: [],
        csds: [],
      });
    });

    // ─── Equipas de emergência ────────────────────────────────────

    it('should merge emergency teams by year and month, keeping first-seen order', async () => {
      repository.getEmergencyTeamsWithValue.mockResolvedValueOnce([
        makeEmergencyTeam({ year: 2025, month: 7, quantity: 1, value: 100 }),
        makeEmergencyTeam({ year: 2024, month: 7, quantity: 2, value: 200 }),
        makeEmergencyTeam({
          year: 2025,
          month: 7,
          type: 'EQUIPE_B',
          quantity: 4,
          value: 400,
        }),
      ]);

      const { emergencyTeams } = await service.getDashboard();

      expect(emergencyTeams).toStrictEqual([
        { year: 2025, month: 7, type: 'EQUIPE_A', quantity: 5, value: 500 },
        { year: 2024, month: 7, type: 'EQUIPE_A', quantity: 2, value: 200 },
      ]);
    });

    it('should not mutate the rows returned by the repository', async () => {
      const rows = [
        makeEmergencyTeam({ quantity: 3, value: 450 }),
        makeEmergencyTeam({ type: 'EQUIPE_B', quantity: 2, value: 300 }),
      ];
      const snapshot = structuredClone(rows);
      repository.getEmergencyTeamsWithValue.mockResolvedValueOnce(rows);

      await service.getDashboard();

      expect(rows).toStrictEqual(snapshot);
    });

    // ─── Percentagem cedida ───────────────────────────────────────

    it.each([
      ['capacity is empty', [3], [], null],
      ['total capacity is zero', [3], [0, 0], null],
      ['there are no emergency teams', [], [10], 0],
      ['the ratio is exact', [3], [10], 30],
      ['the ratio rounds down', [1], [3], 33],
      ['the ratio rounds up', [2], [3], 67],
      ['teams exceed capacity', [15], [10], 150],
    ])(
      'should calculate allocatedPercentage when %s',
      async (_label, quantities, capacities, expected) => {
        repository.getEmergencyTeamsWithValue.mockResolvedValueOnce(
          quantities.map((quantity, i) =>
            makeEmergencyTeam({ month: i + 1, quantity }),
          ),
        );
        repository.getCapacityByYearMonth.mockResolvedValueOnce(
          capacities.map((capacity, i) =>
            makeCapacity({ month: i + 1, capacity }),
          ),
        );

        const { allocatedPercentage } = await service.getDashboard();

        expect(allocatedPercentage).toBe(expected);
      },
    );

    // ─── Respostas recentes ───────────────────────────────────────

    it('should format recent answer dates as UTC YYYY-MM-DD', async () => {
      repository.findRecent.mockResolvedValueOnce([
        makeRecentContingency({
          availabilityDate: new Date('2025-12-31T23:59:59.000Z'),
        }),
        makeRecentContingency({
          id: 2,
          availabilityDate: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]);

      const { recentAnswers } = await service.getDashboard();

      expect(recentAnswers.map((r) => r.date)).toStrictEqual([
        '2025-12-31',
        '2026-01-01',
      ]);
    });

    // ─── Erros ────────────────────────────────────────────────────

    it('should propagate errors from any repository query', async () => {
      const dbError = new Error('db down');
      repository.getCapacityByYearMonth.mockRejectedValueOnce(dbError);

      await expect(service.getDashboard()).rejects.toBe(dbError);
    });
  });
});
