import type {
  ContingencyInput,
  CreateContingencyInput,
} from 'src/application/types';
import { ContingencyService } from 'src/application/usecases/contingency.service';
import type { IContingencyRepository } from 'src/domain/contracts/IContingencyRepository';
import { ValidationError } from 'src/domain/errors/domain.error';
import type {
  CapacityByYearMonth,
  ContingencyGroupItem,
  ContingencyResourceDispatches,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds loosely-typed fixtures (allows undefined/partial fields on purpose). */
const fixture = <T>(data: Record<string, unknown>): T => data as unknown as T;

const FIXED_NOW = new Date('2026-11-26T12:00:00.000Z');
const CURRENT_MONTH = '2026-11';
const DEFAULT_FILTER: ContingencyInput = {
  mesInicial: CURRENT_MONTH,
  mesFinal: CURRENT_MONTH,
};

const createRepositoryMock = () => ({
  create: vi.fn(),
  findRecent: vi.fn(),
  groupByPartner: vi.fn(),
  groupByField: vi.fn(),
  groupByCsd: vi.fn(),
  getEmergencyTeamsWithValue: vi.fn(),
  getCapacityByYearMonth: vi.fn(),
  findContingencyResourceDispatches: vi.fn(),
});

type RepositoryMock = ReturnType<typeof createRepositoryMock>;

interface DashboardData {
  recent: RecentContingency[];
  partners: ContingencyGroupItem[];
  laborGroups: ContingencyGroupItem[];
  teamGroups: ContingencyGroupItem[];
  csds: ContingencyGroupItem[];
  emergencyTeams: EmergencyTeam[];
  capacity: CapacityByYearMonth[];
}

const mockDashboardData = (
  repository: RepositoryMock,
  data: Partial<DashboardData> = {},
): void => {
  repository.findRecent.mockResolvedValue(data.recent ?? []);
  repository.groupByPartner.mockResolvedValue(data.partners ?? []);
  repository.groupByField.mockImplementation(async (field: string) =>
    field === 'laborType' ? (data.laborGroups ?? []) : (data.teamGroups ?? []),
  );
  repository.groupByCsd.mockResolvedValue(data.csds ?? []);
  repository.getEmergencyTeamsWithValue.mockResolvedValue(
    data.emergencyTeams ?? [],
  );
  repository.getCapacityByYearMonth.mockResolvedValue(data.capacity ?? []);
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ContingencyService', () => {
  let repository: RepositoryMock;
  let service: ContingencyService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);

    repository = createRepositoryMock();
    mockDashboardData(repository);
    service = new ContingencyService(
      repository as unknown as IContingencyRepository,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should persist the contingency with the availability date parsed as a UTC Date', async () => {
      const input = fixture<CreateContingencyInput>({
        partnerId: 2,
        laborQuantity: 3,
        availabilityDate: '2026-11-26',
      });

      await service.create(input);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...input,
        availabilityDate: new Date('2026-11-26T00:00:00.000Z'),
      });
    });

    it('should not mutate the original input', async () => {
      const input = fixture<CreateContingencyInput>({
        availabilityDate: '2026-11-26',
      });

      await service.create(input);

      expect(input.availabilityDate).toBe('2026-11-26');
    });

    it.each([
      ['a date in a different format', '26/11/2026'],
      ['a non-existent calendar date', '2026-02-30'],
      ['a date with a time component', '2026-11-26T10:00:00'],
      ['an empty string', ''],
      ['a non-date string', 'invalid-date'],
    ])(
      'should throw a ValidationError when availabilityDate is %s',
      async (_, value) => {
        const input = fixture<CreateContingencyInput>({
          availabilityDate: value,
        });

        const promise = service.create(input);

        await expect(promise).rejects.toBeInstanceOf(ValidationError);
        await expect(promise).rejects.toThrow(
          `Data de disponibilidade inválida: "${value}". Formato esperado: YYYY-MM-DD`,
        );
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('should propagate repository errors', async () => {
      const error = new Error('database failure');
      repository.create.mockRejectedValue(error);

      await expect(
        service.create(
          fixture<CreateContingencyInput>({ availabilityDate: '2026-11-26' }),
        ),
      ).rejects.toBe(error);
    });
  });

  // ─── getDashboard ──────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    describe('period filter', () => {
      const expectAllQueriesCalledWith = (filter: ContingencyInput) => {
        expect(repository.findRecent).toHaveBeenCalledWith(filter);
        expect(repository.groupByPartner).toHaveBeenCalledWith(filter);
        expect(repository.groupByField).toHaveBeenCalledWith(
          'laborType',
          filter,
        );
        expect(repository.groupByField).toHaveBeenCalledWith(
          'teamType',
          filter,
        );
        expect(repository.groupByField).toHaveBeenCalledTimes(2);
        expect(repository.groupByCsd).toHaveBeenCalledWith(filter);
        expect(repository.getEmergencyTeamsWithValue).toHaveBeenCalledWith(
          filter,
        );
        expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(filter);
      };

      it('should default to the current UTC month when called without arguments', async () => {
        await service.getDashboard();

        expectAllQueriesCalledWith(DEFAULT_FILTER);
      });

      it('should default to the current UTC month when the query has no period', async () => {
        await service.getDashboard({});

        expectAllQueriesCalledWith(DEFAULT_FILTER);
      });

      it('should default to the current UTC month when the period fields are empty strings', async () => {
        const query: ContingencyInput = { mesInicial: '', mesFinal: '' };

        await service.getDashboard(query);

        expectAllQueriesCalledWith(DEFAULT_FILTER);
        expect(query).toEqual({ mesInicial: '', mesFinal: '' });
      });

      it.each<[string, ContingencyInput]>([
        ['only mesInicial is provided', { mesInicial: '2026-01' }],
        ['only mesFinal is provided', { mesFinal: '2026-03' }],
        [
          'both period fields are provided',
          { mesInicial: '2026-01', mesFinal: '2026-03' },
        ],
      ])('should keep the query untouched when %s', async (_, query) => {
        await service.getDashboard(query);

        expectAllQueriesCalledWith(query);
        expect(repository.findRecent.mock.calls[0][0]).toBe(query);
      });
    });

    it('should build the full dashboard from the repository data', async () => {
      mockDashboardData(repository, {
        recent: [
          fixture<RecentContingency>({
            id: 1,
            availabilityDate: new Date('2026-11-05T00:00:00.000Z'),
            userName: 'Ana',
            partner: 'Parceira A',
          }),
        ],
        partners: [
          fixture<ContingencyGroupItem>({
            name: 'Parceira A',
            laborQuantity: 2,
            teamsQuantity: 3,
          }),
          fixture<ContingencyGroupItem>({
            name: 'Parceira B',
            laborQuantity: 1,
          }),
          fixture<ContingencyGroupItem>({
            name: 'Parceira A',
            teamsQuantity: 4,
          }),
        ],
        laborGroups: [
          fixture<ContingencyGroupItem>({
            name: 'Eletricista',
            laborQuantity: 3,
            teamsQuantity: 99,
          }),
          fixture<ContingencyGroupItem>({
            name: 'Eletricista',
            laborQuantity: 2,
          }),
          fixture<ContingencyGroupItem>({ name: 'Ajudante' }),
        ],
        teamGroups: [
          fixture<ContingencyGroupItem>({
            name: 'Pesada',
            teamsQuantity: 4,
            laborQuantity: 50,
          }),
        ],
        csds: [
          fixture<ContingencyGroupItem>({
            name: 'CSD Norte',
            laborQuantity: 1,
            teamsQuantity: 1,
          }),
        ],
        emergencyTeams: [
          fixture<EmergencyTeam>({
            year: 2026,
            month: 11,
            quantity: 10,
            value: 1000,
          }),
          fixture<EmergencyTeam>({
            year: 2026,
            month: 11,
            quantity: 12,
            value: 500,
          }),
          fixture<EmergencyTeam>({
            year: 2026,
            month: 10,
            quantity: 5,
            value: 200,
          }),
        ],
        capacity: [
          fixture<CapacityByYearMonth>({
            year: 2026,
            month: 11,
            capacity: 2,
            value: 300,
          }),
          fixture<CapacityByYearMonth>({
            year: 2026,
            month: 10,
            capacity: 3,
            value: 100,
          }),
        ],
      });

      const result = await service.getDashboard();

      expect(result).toEqual({
        // impact 27 / capacity (2*22 + 3*22 = 110) = 24.54% → 25
        allocatedPercentage: 25,
        monthlyCapacity: [
          { year: '2026', month: 11, capacity: 44, value: 300 },
          { year: '2026', month: 10, capacity: 66, value: 100 },
        ],
        emergencyTeams: [
          { year: 2026, month: 11, quantity: 22, value: 1500 },
          { year: 2026, month: 10, quantity: 5, value: 200 },
        ],
        recentAnswers: [
          { id: 1, date: '2026-11-05', name: 'Ana', partner: 'Parceira A' },
        ],
        partners: [
          { name: 'Parceira A', value: 9 },
          { name: 'Parceira B', value: 1 },
        ],
        laborTypes: [
          { name: 'Eletricista', value: 5 },
          { name: 'Ajudante', value: 0 },
        ],
        teamTypes: [{ name: 'Pesada', value: 4 }],
        csds: [{ name: 'CSD Norte', value: 2 }],
      });
    });

    it('should return empty collections and a null percentage when there is no data', async () => {
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

    describe('emergency teams aggregation', () => {
      it('should not mutate the rows returned by the repository', async () => {
        const first = fixture<EmergencyTeam>({
          year: 2026,
          month: 11,
          quantity: 10,
          value: 100,
        });
        const second = fixture<EmergencyTeam>({
          year: 2026,
          month: 11,
          quantity: 5,
          value: 50,
        });
        mockDashboardData(repository, { emergencyTeams: [first, second] });

        const result = await service.getDashboard();

        expect(result.emergencyTeams).toEqual([
          { year: 2026, month: 11, quantity: 15, value: 150 },
        ]);
        expect(first).toEqual({
          year: 2026,
          month: 11,
          quantity: 10,
          value: 100,
        });
        expect(result.emergencyTeams[0]).not.toBe(first);
      });

      it('should keep the same month of different years as separate entries', async () => {
        mockDashboardData(repository, {
          emergencyTeams: [
            fixture<EmergencyTeam>({
              year: 2025,
              month: 11,
              quantity: 1,
              value: 10,
            }),
            fixture<EmergencyTeam>({
              year: 2026,
              month: 11,
              quantity: 2,
              value: 20,
            }),
          ],
        });

        const result = await service.getDashboard();

        expect(result.emergencyTeams).toHaveLength(2);
      });
    });

    describe('allocated percentage', () => {
      it('should return null when total capacity is zero', async () => {
        mockDashboardData(repository, {
          emergencyTeams: [
            fixture<EmergencyTeam>({
              year: 2026,
              month: 11,
              quantity: 10,
              value: 0,
            }),
          ],
          capacity: [
            fixture<CapacityByYearMonth>({
              year: 2026,
              month: 11,
              capacity: 0,
              value: 0,
            }),
          ],
        });

        const result = await service.getDashboard();

        expect(result.allocatedPercentage).toBeNull();
      });

      it('should return 0 when there is capacity but no emergency teams', async () => {
        mockDashboardData(repository, {
          capacity: [
            fixture<CapacityByYearMonth>({
              year: 2026,
              month: 11,
              capacity: 5,
              value: 0,
            }),
          ],
        });

        const result = await service.getDashboard();

        expect(result.allocatedPercentage).toBe(0);
      });

      it('should round the percentage to the nearest integer', async () => {
        mockDashboardData(repository, {
          // 1 / 22 = 4.54% → 5
          emergencyTeams: [
            fixture<EmergencyTeam>({
              year: 2026,
              month: 11,
              quantity: 1,
              value: 0,
            }),
          ],
          capacity: [
            fixture<CapacityByYearMonth>({
              year: 2026,
              month: 11,
              capacity: 1,
              value: 0,
            }),
          ],
        });

        const result = await service.getDashboard();

        expect(result.allocatedPercentage).toBe(5);
      });

      it('should allow percentages above 100 when impact exceeds capacity', async () => {
        mockDashboardData(repository, {
          emergencyTeams: [
            fixture<EmergencyTeam>({
              year: 2026,
              month: 11,
              quantity: 44,
              value: 0,
            }),
          ],
          capacity: [
            fixture<CapacityByYearMonth>({
              year: 2026,
              month: 11,
              capacity: 1,
              value: 0,
            }),
          ],
        });

        const result = await service.getDashboard();

        expect(result.allocatedPercentage).toBe(200);
      });
    });

    it('should propagate errors thrown by any repository query', async () => {
      const error = new Error('database failure');
      repository.groupByCsd.mockRejectedValue(error);

      await expect(service.getDashboard()).rejects.toBe(error);
    });
  });

  // ─── findContingencyResourceDispatches ─────────────────────────────────────

  describe('findContingencyResourceDispatches', () => {
    const dispatches = [
      fixture<ContingencyResourceDispatches>({ id: 1 }),
      fixture<ContingencyResourceDispatches>({ id: 2 }),
    ];

    beforeEach(() => {
      repository.findContingencyResourceDispatches.mockResolvedValue(
        dispatches,
      );
    });

    it('should default to the current UTC month when called without arguments', async () => {
      const result = await service.findContingencyResourceDispatches();

      expect(repository.findContingencyResourceDispatches).toHaveBeenCalledWith(
        DEFAULT_FILTER,
      );
      expect(result).toBe(dispatches);
    });

    it('should default to the current UTC month when the query has no period', async () => {
      await service.findContingencyResourceDispatches({
        mesInicial: '',
        mesFinal: '',
      });

      expect(repository.findContingencyResourceDispatches).toHaveBeenCalledWith(
        DEFAULT_FILTER,
      );
    });

    it('should forward the query untouched when a period is provided', async () => {
      const query: ContingencyInput = {
        mesInicial: '2026-01',
        mesFinal: '2026-06',
      };

      const result = await service.findContingencyResourceDispatches(query);

      expect(
        repository.findContingencyResourceDispatches,
      ).toHaveBeenCalledTimes(1);
      expect(
        repository.findContingencyResourceDispatches.mock.calls[0][0],
      ).toBe(query);
      expect(result).toBe(dispatches);
    });

    it('should return an empty list when the repository finds nothing', async () => {
      repository.findContingencyResourceDispatches.mockResolvedValue([]);

      await expect(
        service.findContingencyResourceDispatches(),
      ).resolves.toEqual([]);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('database failure');
      repository.findContingencyResourceDispatches.mockRejectedValue(error);

      await expect(service.findContingencyResourceDispatches()).rejects.toBe(
        error,
      );
    });
  });
});
