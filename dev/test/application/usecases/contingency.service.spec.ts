import { Test, TestingModule } from '@nestjs/testing';
import {
  ContingencyInput,
  CreateContingencyInput,
} from 'src/application/types';
import { ContingencyService } from 'src/application/usecases/contingency.service';
import {
  CONTINGENCY_REPOSITORY,
  IContingencyRepository,
} from 'src/domain/contracts/IContingencyRepository';
import { ValidationError } from 'src/domain/errors/domain.error';
import {
  CapacityByYearMonth,
  ContingencyGroupItem,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Fixtures ────────────────────────────────────────────────────────

const WORKING_DAYS_PER_MONTH = 22;

const team = (overrides: Partial<EmergencyTeam> = {}): EmergencyTeam =>
  ({
    year: 2026,
    month: 11,
    quantity: 0,
    value: 0,
    ...overrides,
  }) as EmergencyTeam;

const capacity = (
  overrides: Partial<CapacityByYearMonth> = {},
): CapacityByYearMonth =>
  ({
    year: 2026,
    month: 11,
    capacity: 0,
    value: 0,
    ...overrides,
  }) as CapacityByYearMonth;

const group = (
  name: string,
  laborQuantity: number,
  teamsQuantity: number,
): ContingencyGroupItem =>
  ({ name, laborQuantity, teamsQuantity }) as ContingencyGroupItem;

const recent = (
  overrides: Partial<RecentContingency> = {},
): RecentContingency =>
  ({
    id: 1,
    availabilityDate: new Date('2026-11-20T00:00:00.000Z'),
    userName: 'Ana Silva',
    partner: 'ENGELMIG',
    ...overrides,
  }) as RecentContingency;

// ─── Suite ───────────────────────────────────────────────────────────

describe('ContingencyService', () => {
  let service: ContingencyService;

  const repository = {
    create: vi.fn(),
    findRecent: vi.fn(),
    groupByPartner: vi.fn(),
    groupByField: vi.fn(),
    groupByCsd: vi.fn(),
    getEmergencyTeamsWithValue: vi.fn(),
    getCapacityByYearMonth: vi.fn(),
  };

  /** Configures the repository responses used by getDashboard */
  function arrangeDashboard(
    data: {
      recent?: RecentContingency[];
      partners?: unknown[];
      laborGroups?: ContingencyGroupItem[];
      teamGroups?: ContingencyGroupItem[];
      csds?: unknown[];
      emergencyTeams?: EmergencyTeam[];
      capacity?: CapacityByYearMonth[];
    } = {},
  ) {
    repository.findRecent.mockResolvedValue(data.recent ?? []);
    repository.groupByPartner.mockResolvedValue(data.partners ?? []);
    repository.groupByField.mockImplementation(async (field: string) =>
      field === 'laborType'
        ? (data.laborGroups ?? [])
        : (data.teamGroups ?? []),
    );
    repository.groupByCsd.mockResolvedValue(data.csds ?? []);
    repository.getEmergencyTeamsWithValue.mockResolvedValue(
      data.emergencyTeams ?? [],
    );
    repository.getCapacityByYearMonth.mockResolvedValue(data.capacity ?? []);
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingencyService,
        {
          provide: CONTINGENCY_REPOSITORY,
          useValue: repository as unknown as IContingencyRepository,
        },
      ],
    }).compile();

    service = module.get(ContingencyService);
    arrangeDashboard();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ────────────────────────────────────────────────────────

  describe('create', () => {
    const validInput = {
      availabilityDate: '2026-11-23',
      partner: 'ENGELMIG',
    } as unknown as CreateContingencyInput;

    it('should parse availabilityDate as a UTC date and forward the remaining fields', async () => {
      repository.create.mockResolvedValue(undefined);

      await service.create(validInput);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...validInput,
        availabilityDate: new Date('2026-11-23T00:00:00.000Z'),
      });
    });

    it('should resolve with undefined on success', async () => {
      repository.create.mockResolvedValue({ id: 99 });

      await expect(service.create(validInput)).resolves.toBeUndefined();
    });

    it.each([
      ['wrong format (DD/MM/YYYY)', '23/11/2026'],
      ['non-existent date', '2026-02-30'],
      ['date with time', '2026-11-23T10:00:00'],
      ['empty string', ''],
      ['random text', 'tomorrow'],
    ])(
      'should throw ValidationError for %s and not call the repository',
      async (_, availabilityDate) => {
        const input = { ...validInput, availabilityDate };

        await expect(service.create(input)).rejects.toBeInstanceOf(
          ValidationError,
        );
        await expect(service.create(input)).rejects.toThrow(
          `Data de disponibilidade inválida: "${availabilityDate}". Formato esperado: YYYY-MM-DD`,
        );
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('should propagate repository errors', async () => {
      repository.create.mockRejectedValue(new Error('database down'));

      await expect(service.create(validInput)).rejects.toThrow('database down');
    });
  });

  // ─── getDashboard: filters ─────────────────────────────────────────

  describe('getDashboard - period filter', () => {
    it('should default to the current UTC month when no period is provided', async () => {
      await service.getDashboard({});

      const expectedFilter = { mesInicial: '2026-11', mesFinal: '2026-11' };
      expect(repository.findRecent).toHaveBeenCalledWith(expectedFilter);
      expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(
        expectedFilter,
      );
    });

    it('should default to the current month when called without arguments', async () => {
      await service.getDashboard();

      expect(repository.findRecent).toHaveBeenCalledWith({
        mesInicial: '2026-11',
        mesFinal: '2026-11',
      });
    });

    it('should use the UTC month even when the local date is still in the previous month', async () => {
      // 30/11 23:30 in Brasília (UTC-3) is already 01/12 in UTC
      vi.setSystemTime(new Date('2026-12-01T02:30:00.000Z'));

      await service.getDashboard();

      expect(repository.findRecent).toHaveBeenCalledWith({
        mesInicial: '2026-12',
        mesFinal: '2026-12',
      });
    });

    it('should keep other filters when applying the default period', async () => {
      const query = { idParceira: [3] } as unknown as ContingencyInput;

      await service.getDashboard(query);

      expect(repository.findRecent).toHaveBeenCalledWith({
        idParceira: [3],
        mesInicial: '2026-11',
        mesFinal: '2026-11',
      });
    });

    it('should not override the period when both months are provided', async () => {
      const query: ContingencyInput = {
        mesInicial: '2026-01',
        mesFinal: '2026-03',
      };

      await service.getDashboard(query);

      expect(repository.findRecent).toHaveBeenCalledWith(query);
    });

    it.each([
      ['only mesInicial', { mesInicial: '2026-01' }],
      ['only mesFinal', { mesFinal: '2026-03' }],
    ])(
      'should not apply the default period when %s is provided',
      async (_, query) => {
        await service.getDashboard(query as ContingencyInput);

        expect(repository.findRecent).toHaveBeenCalledWith(query);
      },
    );

    it('should not mutate the received query', async () => {
      const query = {} as ContingencyInput;

      await service.getDashboard(query);

      expect(query).toEqual({});
    });

    it('should call every repository method once with the same filter', async () => {
      const query: ContingencyInput = {
        mesInicial: '2026-01',
        mesFinal: '2026-03',
      };

      await service.getDashboard(query);

      expect(repository.findRecent).toHaveBeenCalledExactlyOnceWith(query);
      expect(repository.groupByPartner).toHaveBeenCalledExactlyOnceWith(query);
      expect(repository.groupByCsd).toHaveBeenCalledExactlyOnceWith(query);
      expect(
        repository.getEmergencyTeamsWithValue,
      ).toHaveBeenCalledExactlyOnceWith(query);
      expect(repository.getCapacityByYearMonth).toHaveBeenCalledExactlyOnceWith(
        query,
      );
      expect(repository.groupByField).toHaveBeenCalledTimes(2);
      expect(repository.groupByField).toHaveBeenCalledWith('laborType', query);
      expect(repository.groupByField).toHaveBeenCalledWith('teamType', query);
    });
  });

  // ─── getDashboard: monthly capacity ────────────────────────────────

  describe('getDashboard - monthlyCapacity', () => {
    it('should multiply teams per day by 22 working days', async () => {
      arrangeDashboard({
        capacity: [
          capacity({ year: 2026, month: 11, capacity: 10, value: 5000 }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.monthlyCapacity).toEqual([
        {
          year: '2026',
          month: 11,
          capacity: 10 * WORKING_DAYS_PER_MONTH,
          value: 5000,
        },
      ]);
    });

    it('should convert the year to string and keep one entry per month', async () => {
      arrangeDashboard({
        capacity: [
          capacity({ year: 2026, month: 11, capacity: 1, value: 10 }),
          capacity({ year: 2026, month: 12, capacity: 2, value: 20 }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.monthlyCapacity).toEqual([
        { year: '2026', month: 11, capacity: 22, value: 10 },
        { year: '2026', month: 12, capacity: 44, value: 20 },
      ]);
    });

    it('should return zero capacity when there are no teams per day', async () => {
      arrangeDashboard({ capacity: [capacity({ capacity: 0 })] });

      const result = await service.getDashboard();

      expect(result.monthlyCapacity[0].capacity).toBe(0);
    });
  });

  // ─── getDashboard: allocated percentage ────────────────────────────

  describe('getDashboard - allocatedPercentage', () => {
    it('should divide the month impact by the month capacity (teams × 22 days)', async () => {
      arrangeDashboard({
        capacity: [capacity({ capacity: 10 })], // 220
        emergencyTeams: [team({ quantity: 44 })],
      });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBe(20);
    });

    it('should sum impact and capacity across all months of the period', async () => {
      arrangeDashboard({
        capacity: [
          capacity({ month: 11, capacity: 10 }), // 220
          capacity({ month: 12, capacity: 5 }), // 110
        ],
        emergencyTeams: [
          team({ month: 11, quantity: 33 }),
          team({ month: 12, quantity: 33 }),
        ],
      });

      const result = await service.getDashboard();

      // 66 / 330 = 20%
      expect(result.allocatedPercentage).toBe(20);
    });

    it('should round the percentage to the nearest integer', async () => {
      arrangeDashboard({
        capacity: [capacity({ capacity: 3 })], // 66
        emergencyTeams: [team({ quantity: 1 })], // 1.515...%
      });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBe(2);
    });

    it('should allow values above 100% when impact exceeds capacity', async () => {
      arrangeDashboard({
        capacity: [capacity({ capacity: 1 })], // 22
        emergencyTeams: [team({ quantity: 44 })],
      });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBe(200);
    });

    it('should return 0 when there are no emergency teams', async () => {
      arrangeDashboard({ capacity: [capacity({ capacity: 10 })] });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBe(0);
    });

    it('should return null when there is no capacity data', async () => {
      arrangeDashboard({ emergencyTeams: [team({ quantity: 10 })] });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBeNull();
    });

    it('should return null when total capacity is zero', async () => {
      arrangeDashboard({
        capacity: [capacity({ capacity: 0 })],
        emergencyTeams: [team({ quantity: 10 })],
      });

      const result = await service.getDashboard();

      expect(result.allocatedPercentage).toBeNull();
    });
  });

  // ─── getDashboard: emergency teams ─────────────────────────────────

  describe('getDashboard - emergencyTeams', () => {
    it('should aggregate quantity and value by year and month', async () => {
      arrangeDashboard({
        emergencyTeams: [
          team({ month: 11, quantity: 2, value: 100 }),
          team({ month: 11, quantity: 3, value: 200 }),
          team({ month: 12, quantity: 1, value: 50 }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.emergencyTeams).toEqual([
        team({ month: 11, quantity: 5, value: 300 }),
        team({ month: 12, quantity: 1, value: 50 }),
      ]);
    });

    it('should keep the same month of different years separate', async () => {
      arrangeDashboard({
        emergencyTeams: [
          team({ year: 2025, month: 11, quantity: 1 }),
          team({ year: 2026, month: 11, quantity: 2 }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.emergencyTeams).toHaveLength(2);
    });

    it('should preserve the order of first appearance', async () => {
      arrangeDashboard({
        emergencyTeams: [
          team({ month: 12 }),
          team({ month: 11 }),
          team({ month: 12 }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.emergencyTeams.map((t) => t.month)).toEqual([12, 11]);
    });

    it('should not mutate the rows returned by the repository', async () => {
      const rows = [
        team({ month: 11, quantity: 2, value: 100 }),
        team({ month: 11, quantity: 3, value: 200 }),
      ];
      arrangeDashboard({ emergencyTeams: rows });

      await service.getDashboard();

      expect(rows[0]).toEqual(team({ month: 11, quantity: 2, value: 100 }));
    });

    it('should return an empty list when there are no emergency teams', async () => {
      const result = await service.getDashboard();

      expect(result.emergencyTeams).toEqual([]);
    });
  });

  // ─── getDashboard: recent answers ──────────────────────────────────

  describe('getDashboard - recentAnswers', () => {
    it('should map recent contingencies to the response format', async () => {
      arrangeDashboard({ recent: [recent()] });

      const result = await service.getDashboard();

      expect(result.recentAnswers).toEqual([
        { id: 1, date: '2026-11-20', name: 'Ana Silva', partner: 'ENGELMIG' },
      ]);
    });

    it('should format the date in UTC regardless of the time of day', async () => {
      arrangeDashboard({
        recent: [
          recent({ availabilityDate: new Date('2026-11-20T23:59:59.000Z') }),
        ],
      });

      const result = await service.getDashboard();

      expect(result.recentAnswers[0].date).toBe('2026-11-20');
    });

    it('should keep the order returned by the repository', async () => {
      arrangeDashboard({ recent: [recent({ id: 2 }), recent({ id: 1 })] });

      const result = await service.getDashboard();

      expect(result.recentAnswers.map((r) => r.id)).toEqual([2, 1]);
    });
  });

  // ─── getDashboard: grouped data ────────────────────────────────────

  describe('getDashboard - grouped data', () => {
    it('should sum laborQuantity by name for laborTypes', async () => {
      arrangeDashboard({
        laborGroups: [
          group('Eletricista', 2, 1),
          group('Eletricista', 3, 9),
          group('Ajudante', 1, 0),
        ],
      });

      const result = await service.getDashboard();

      expect(result.laborTypes).toEqual([
        { name: 'Eletricista', value: 5 },
        { name: 'Ajudante', value: 1 },
      ]);
    });

    it('should sum teamsQuantity by name for teamTypes', async () => {
      arrangeDashboard({
        teamGroups: [group('LM', 99, 2), group('LM', 99, 1), group('LV', 0, 4)],
      });

      const result = await service.getDashboard();

      expect(result.teamTypes).toEqual([
        { name: 'LM', value: 3 },
        { name: 'LV', value: 4 },
      ]);
    });

    it('should return partners and csds exactly as provided by the repository', async () => {
      const partners = [{ name: 'ENGELMIG', value: 3 }];
      const csds = [{ name: 'CSD Norte', value: 2 }];
      arrangeDashboard({ partners, csds });

      const result = await service.getDashboard();

      expect(result.partners).toBe(partners);
      expect(result.csds).toBe(csds);
    });
  });

  // ─── getDashboard: general ─────────────────────────────────────────

  describe('getDashboard - general behaviour', () => {
    it('should return an empty dashboard when there is no data', async () => {
      const result = await service.getDashboard();

      expect(result).toEqual({
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

    it('should build the full dashboard from all repository data', async () => {
      arrangeDashboard({
        recent: [recent()],
        partners: [{ name: 'ENGELMIG', value: 1 }],
        laborGroups: [group('Eletricista', 4, 0)],
        teamGroups: [group('LM', 0, 2)],
        csds: [{ name: 'CSD Norte', value: 1 }],
        emergencyTeams: [team({ quantity: 11, value: 1000 })],
        capacity: [capacity({ capacity: 5, value: 9000 })],
      });

      const result = await service.getDashboard();

      expect(result).toEqual({
        allocatedPercentage: 10, // 11 / (5 × 22)
        monthlyCapacity: [
          { year: '2026', month: 11, capacity: 110, value: 9000 },
        ],
        emergencyTeams: [team({ quantity: 11, value: 1000 })],
        recentAnswers: [
          { id: 1, date: '2026-11-20', name: 'Ana Silva', partner: 'ENGELMIG' },
        ],
        partners: [{ name: 'ENGELMIG', value: 1 }],
        laborTypes: [{ name: 'Eletricista', value: 4 }],
        teamTypes: [{ name: 'LM', value: 2 }],
        csds: [{ name: 'CSD Norte', value: 1 }],
      });
    });

    it('should propagate errors from any repository call', async () => {
      repository.getCapacityByYearMonth.mockRejectedValue(
        new Error('query failed'),
      );

      await expect(service.getDashboard()).rejects.toThrow('query failed');
    });
  });
});
