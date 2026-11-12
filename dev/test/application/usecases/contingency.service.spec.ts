// contingency.service.spec.ts
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ContingencyInput,
  CreateContingencyInput,
  GroupByFieldRow,
} from 'src/application/types';
import { ContingencyService } from 'src/application/usecases/contingency.service';
import {
  CONTINGENCY_REPOSITORY,
  IContingencyRepository,
} from 'src/domain/contracts/IContingencyRepository';
import {
  CapacityByYearMonthResponse,
  EmergencyTeamResponse,
  RecentContingencyResponse,
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

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Data fixa do sistema: o fallback de resolveFilterMonth usa o mês corrente. */
const SYSTEM_DATE = new Date('2026-11-12T12:00:00.000Z');
const CURRENT_MONTH = 11;
/** Mês do filtro por omissão (junho/2025). É diferente de CURRENT_MONTH de propósito. */
const FILTER_MONTH = 6;

// ─── Factories ────────────────────────────────────────────────────────────────

const makeCreateDTO = (
  overrides: Partial<CreateContingencyInput> = {},
): CreateContingencyInput => ({
  availabilityDate: '2025-06-10',
  partnerId: 1,
  laborType: 'ELETRICISTA',
  laborQuantity: 5,
  teamType: 'EQUIPE_A',
  teamQuantity: 3,
  allocatedCsd: 'SIM',
  userId: 42,
  ...overrides,
});

const makeDashboardFilter = (
  overrides: Partial<ContingencyInput> = {},
): ContingencyInput => ({
  dataInicial: '01/06/2025',
  dataFinal: '30/06/2025',
  idParceira: [1],
  ...overrides,
});

const makeRecentEntry = (
  date: Date | string,
  nome: string | null = 'João',
): RecentContingencyResponse =>
  ({
    dia_disponibilidade:
      date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`),
    novo_tabela_usuarios: nome !== null ? { nome } : null,
    turmas: { turma: 'Turma A' },
  }) as unknown as RecentContingencyResponse;

const makeGroupByFieldRow = (
  overrides: Partial<GroupByFieldRow> = {},
): GroupByFieldRow => ({
  name: 'X',
  laborQuantity: 0,
  teamsQuantity: 0,
  allocatedCsd: 0,
  ...overrides,
});

const makeCapacityRow = (
  overrides: Record<string, unknown> = {},
): CapacityByYearMonthResponse =>
  ({
    ano: 2025,
    mes: FILTER_MONTH,
    capacidade: 40,
    valor: 1000,
    ...overrides,
  }) as unknown as CapacityByYearMonthResponse;

const makeEmergencyTeamRow = (
  overrides: Partial<EmergencyTeamResponse> = {},
): EmergencyTeamResponse => ({
  ano: 2025,
  mes: FILTER_MONTH,
  quantidade: 10,
  valor: 500,
  tipo: 'B4',
  ...overrides,
});

// ─── Mock do Repository ───────────────────────────────────────────────────────

type RepositoryMock = {
  [K in keyof IContingencyRepository]: Mock<IContingencyRepository[K]>;
};

const makeRepositoryMock = (): RepositoryMock => ({
  create: vi.fn().mockResolvedValue(undefined),
  findRecent: vi.fn().mockResolvedValue([]),
  groupByPartner: vi.fn().mockResolvedValue([]),
  groupByField: vi.fn().mockResolvedValue([]),
  groupByCsd: vi.fn().mockResolvedValue([]),
  getEmergencyTeamsWithValue: vi.fn().mockResolvedValue([]),
  getCapacityByYearMonth: vi.fn().mockResolvedValue([]),
});

// ─── Suíte ────────────────────────────────────────────────────────────────────

describe('ContingencyService', () => {
  let service: ContingencyService;
  let repository: RepositoryMock;

  beforeEach(async () => {
    // Só o Date é simulado; Promises e setTimeout continuam reais.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SYSTEM_DATE);

    repository = makeRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingencyService,
        { provide: CONTINGENCY_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(ContingencyService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should map DTO fields to repository entity and call create', async () => {
      const dto = makeCreateDTO();

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        dia_disponibilidade: new Date('2025-06-10T00:00:00.000Z'),
        id_parceira: dto.partnerId,
        tipo_recurso_mao_obra: dto.laborType,
        quantidade_mao_obra: dto.laborQuantity,
        tipo_recurso_equipe: dto.teamType,
        quantidade_equipe: dto.teamQuantity,
        disponibilizado_csd: dto.allocatedCsd,
        id_usuario: dto.userId,
      });
    });

    it('should convert availabilityDate to a Date at UTC midnight', async () => {
      await service.create(makeCreateDTO({ availabilityDate: '2025-12-25' }));

      const arg = repository.create.mock.calls[0][0];
      expect(arg.dia_disponibilidade).toBeInstanceOf(Date);
      // toISOString é sempre UTC, independentemente do fuso da máquina
      expect((arg.dia_disponibilidade as Date).toISOString()).toBe(
        '2025-12-25T00:00:00.000Z',
      );
    });

    it.each([
      ['wrong format', '25/12/2025'],
      ['impossible date', '2025-02-30'],
      ['non-date text', 'SIM'],
      ['empty string', ''],
    ])(
      'should reject %s ("%s") without calling the repository',
      async (_, availabilityDate) => {
        await expect(
          service.create(makeCreateDTO({ availabilityDate })),
        ).rejects.toThrow(BadRequestException);

        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('should return void (no return value)', async () => {
      const result = await service.create(makeCreateDTO());

      expect(result).toBeUndefined();
    });

    it('should propagate repository exceptions', async () => {
      const error = new Error('DB write failed');
      repository.create.mockRejectedValueOnce(error);

      await expect(service.create(makeCreateDTO())).rejects.toBe(error);
    });
  });

  describe('getDashboard', () => {
    /** Encaminha as linhas de groupByField conforme o campo pedido. */
    const mockGroupByField = (
      labor: GroupByFieldRow[],
      team: GroupByFieldRow[],
    ) =>
      repository.groupByField.mockImplementation(async (field) =>
        field === 'tipo_recurso_mao_obra' ? labor : team,
      );

    // ── Chamadas ao repository ──────────────────────────────────────────────
    describe('repository calls', () => {
      it('should pass the query unchanged to every repository call', async () => {
        const query = makeDashboardFilter();

        await service.getDashboard(query);

        expect(repository.findRecent).toHaveBeenCalledWith(query);
        expect(repository.groupByPartner).toHaveBeenCalledWith(query);
        expect(repository.groupByField).toHaveBeenNthCalledWith(
          1,
          'tipo_recurso_mao_obra',
          query,
        );
        expect(repository.groupByField).toHaveBeenNthCalledWith(
          2,
          'tipo_recurso_equipe',
          query,
        );
        expect(repository.groupByCsd).toHaveBeenCalledWith(query);
        expect(repository.getEmergencyTeamsWithValue).toHaveBeenCalledWith(
          query,
          FILTER_MONTH,
        );
        expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(
          query,
          FILTER_MONTH,
        );

        // mesma referência: o service não clona nem transforma o filtro
        expect(repository.findRecent.mock.calls[0][0]).toBe(query);
      });

      it('should use groupByCsd (not groupByField) for csds', async () => {
        await service.getDashboard(makeDashboardFilter());

        expect(repository.groupByField).toHaveBeenCalledTimes(2);
        expect(repository.groupByField).not.toHaveBeenCalledWith(
          'disponibilizado_csd',
          expect.anything(),
        );
        expect(repository.groupByCsd).toHaveBeenCalledTimes(1);
      });

      it('should default to an empty filter when query is undefined', async () => {
        await service.getDashboard();

        expect(repository.findRecent).toHaveBeenCalledWith({});
        expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(
          {},
          CURRENT_MONTH,
        );
      });

      it('should start all 7 repository calls before any of them resolves (Promise.all)', async () => {
        // Sem await: só ficam registadas as chamadas iniciadas de forma síncrona.
        // Com awaits sequenciais, apenas a primeira estaria registada aqui.
        const pending = service.getDashboard(makeDashboardFilter());

        expect(repository.findRecent).toHaveBeenCalledTimes(1);
        expect(repository.groupByPartner).toHaveBeenCalledTimes(1);
        expect(repository.groupByField).toHaveBeenCalledTimes(2);
        expect(repository.groupByCsd).toHaveBeenCalledTimes(1);
        expect(repository.getEmergencyTeamsWithValue).toHaveBeenCalledTimes(1);
        expect(repository.getCapacityByYearMonth).toHaveBeenCalledTimes(1);

        await pending;
      });
    });

    // ── resolveFilterMonth ──────────────────────────────────────────────────
    describe('filter month resolution', () => {
      it.each<[string, ContingencyInput, number]>([
        [
          'both dates in the same month',
          { dataInicial: '02/03/2025', dataFinal: '20/03/2025' },
          3,
        ],
        ['no dates', {}, CURRENT_MONTH],
        ['only dataInicial', { dataInicial: '02/03/2025' }, CURRENT_MONTH],
        ['only dataFinal', { dataFinal: '20/03/2025' }, CURRENT_MONTH],
        [
          'dates in different months',
          { dataInicial: '01/03/2025', dataFinal: '30/04/2025' },
          CURRENT_MONTH,
        ],
        [
          'same month in different years',
          { dataInicial: '01/03/2024', dataFinal: '31/03/2025' },
          CURRENT_MONTH,
        ],
        [
          'invalid dates',
          { dataInicial: 'abc', dataFinal: 'xyz' },
          CURRENT_MONTH,
        ],
      ])(
        'should resolve the month correctly with %s',
        async (_, filter, expectedMonth) => {
          await service.getDashboard(filter);

          expect(repository.getEmergencyTeamsWithValue).toHaveBeenCalledWith(
            filter,
            expectedMonth,
          );
          expect(repository.getCapacityByYearMonth).toHaveBeenCalledWith(
            filter,
            expectedMonth,
          );
        },
      );
    });

    // ── allocatedPercentage ─────────────────────────────────────────────────
    describe('allocatedPercentage', () => {
      const run = (
        emergency: EmergencyTeamResponse[],
        capacity: CapacityByYearMonthResponse[],
        filter: ContingencyInput = makeDashboardFilter(),
      ) => {
        repository.getEmergencyTeamsWithValue.mockResolvedValueOnce(emergency);
        repository.getCapacityByYearMonth.mockResolvedValueOnce(capacity);
        return service.getDashboard(filter);
      };

      it('should be round(emergency / capacity * 100) for the filter month', async () => {
        const result = await run(
          [makeEmergencyTeamRow({ quantidade: 10 })],
          [makeCapacityRow({ capacidade: 40 })],
        );

        expect(result.allocatedPercentage).toBe(25);
      });

      it.each([
        [1, 3, 33], // 33.33…
        [2, 3, 67], // 66.66…
        [1, 8, 13], // 12.5 → Math.round arredonda para cima
      ])(
        'should round %i / %i to %i%%',
        async (quantidade, capacidade, expected) => {
          const result = await run(
            [makeEmergencyTeamRow({ quantidade })],
            [makeCapacityRow({ capacidade })],
          );

          expect(result.allocatedPercentage).toBe(expected);
        },
      );

      it('should sum emergency quantities of the same month before calculating', async () => {
        const result = await run(
          [
            makeEmergencyTeamRow({ quantidade: 3 }),
            makeEmergencyTeamRow({ quantidade: 2 }),
          ],
          [makeCapacityRow({ capacidade: 10 })],
        );

        expect(result.allocatedPercentage).toBe(50);
      });

      it('should only consider rows of the filter month', async () => {
        const result = await run(
          [
            makeEmergencyTeamRow({ mes: 5, quantidade: 100 }),
            makeEmergencyTeamRow({ mes: FILTER_MONTH, quantidade: 5 }),
          ],
          [
            makeCapacityRow({ mes: 5, capacidade: 1 }),
            makeCapacityRow({ mes: FILTER_MONTH, capacidade: 10 }),
          ],
        );

        expect(result.allocatedPercentage).toBe(50);
      });

      it('should use the current month when the filter has no dates', async () => {
        const result = await run(
          [makeEmergencyTeamRow({ mes: CURRENT_MONTH, quantidade: 4 })],
          [makeCapacityRow({ mes: CURRENT_MONTH, capacidade: 8 })],
          {},
        );

        expect(result.allocatedPercentage).toBe(50);
      });

      it('should not cap the percentage at 100', async () => {
        const result = await run(
          [makeEmergencyTeamRow({ quantidade: 15 })],
          [makeCapacityRow({ capacidade: 10 })],
        );

        expect(result.allocatedPercentage).toBe(150);
      });

      it.each<[string, EmergencyTeamResponse[], CapacityByYearMonthResponse[]]>(
        [
          [
            'there is no capacity row for the month',
            [makeEmergencyTeamRow()],
            [makeCapacityRow({ mes: 5 })],
          ],
          [
            'there is no emergency row for the month',
            [makeEmergencyTeamRow({ mes: 5 })],
            [makeCapacityRow()],
          ],
          [
            'capacity is 0',
            [makeEmergencyTeamRow()],
            [makeCapacityRow({ capacidade: 0 })],
          ],
          ['both lists are empty', [], []],
        ],
      )('should be null when %s', async (_, emergency, capacity) => {
        const result = await run(emergency, capacity);

        expect(result.allocatedPercentage).toBeNull();
      });
    });

    // ── emergencyTeams ──────────────────────────────────────────────────────
    describe('emergencyTeams', () => {
      it('should aggregate quantidade and valor by ano/mes, keeping first-occurrence order', async () => {
        repository.getEmergencyTeamsWithValue.mockResolvedValueOnce([
          makeEmergencyTeamRow({ mes: 6, quantidade: 3, valor: 100 }),
          makeEmergencyTeamRow({ mes: 7, quantidade: 1, valor: 50 }),
          makeEmergencyTeamRow({ mes: 6, quantidade: 2, valor: 200 }),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.emergencyTeams).toStrictEqual([
          { ano: 2025, mes: 6, quantidade: 5, valor: 300 },
          { ano: 2025, mes: 7, quantidade: 1, valor: 50 },
        ]);
      });

      it('should keep the same month of different years separate', async () => {
        repository.getEmergencyTeamsWithValue.mockResolvedValueOnce([
          makeEmergencyTeamRow({ ano: 2024, mes: 6, quantidade: 1 }),
          makeEmergencyTeamRow({ ano: 2025, mes: 6, quantidade: 2 }),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.emergencyTeams).toHaveLength(2);
      });

      it('should not mutate the rows returned by the repository', async () => {
        const rows = [
          makeEmergencyTeamRow({ quantidade: 3 }),
          makeEmergencyTeamRow({ quantidade: 2 }),
        ];
        const snapshot = structuredClone(rows);
        repository.getEmergencyTeamsWithValue.mockResolvedValueOnce(rows);

        await service.getDashboard(makeDashboardFilter());

        expect(rows).toStrictEqual(snapshot);
      });
    });

    // ── monthlyCapacity ─────────────────────────────────────────────────────
    describe('monthlyCapacity', () => {
      it('should map capacity rows and convert ano to number', async () => {
        repository.getCapacityByYearMonth.mockResolvedValueOnce([
          makeCapacityRow({ ano: '2025', mes: 6, capacidade: 40, valor: 1000 }),
          makeCapacityRow({ ano: '2025', mes: 7, capacidade: 20, valor: 500 }),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.monthlyCapacity).toStrictEqual([
          { capacity: 40, month: 6, value: 1000, year: 2025 },
          { capacity: 20, month: 7, value: 500, year: 2025 },
        ]);
      });
    });

    // ── recentAnswers ───────────────────────────────────────────────────────
    describe('recentAnswers', () => {
      it('should format dates as YYYY-MM-DD and map the user name', async () => {
        repository.findRecent.mockResolvedValueOnce([
          makeRecentEntry('2025-06-10', 'Ana'),
          makeRecentEntry('2025-06-09', 'Carlos'),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.recentAnswers).toStrictEqual([
          { date: '2025-06-10', name: 'Ana' },
          { date: '2025-06-09', name: 'Carlos' },
        ]);
      });

      it('should return name as null when the user relation is null', async () => {
        repository.findRecent.mockResolvedValueOnce([
          makeRecentEntry('2025-06-10', null),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.recentAnswers).toStrictEqual([
          { date: '2025-06-10', name: null },
        ]);
      });

      it('should use the UTC date (toISOString)', async () => {
        // 23:30 em Brasília = 02:30 UTC do dia seguinte
        repository.findRecent.mockResolvedValueOnce([
          makeRecentEntry(new Date('2025-06-10T23:30:00-03:00')),
        ]);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.recentAnswers[0].date).toBe('2025-06-11');
      });
    });

    // ── laborTypes / teamTypes ──────────────────────────────────────────────
    describe('laborTypes and teamTypes', () => {
      it('should sum laborQuantity by name for laborTypes', async () => {
        mockGroupByField(
          [
            makeGroupByFieldRow({ name: 'ELETRICISTA', laborQuantity: 2 }),
            makeGroupByFieldRow({ name: 'AJUDANTE', laborQuantity: 1 }),
            makeGroupByFieldRow({ name: 'ELETRICISTA', laborQuantity: 3 }),
          ],
          [],
        );

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.laborTypes).toStrictEqual([
          { name: 'ELETRICISTA', value: 5 },
          { name: 'AJUDANTE', value: 1 },
        ]);
      });

      it('should sum teamsQuantity by name for teamTypes', async () => {
        mockGroupByField(
          [],
          [
            makeGroupByFieldRow({ name: 'EQUIPE_A', teamsQuantity: 1 }),
            makeGroupByFieldRow({ name: 'EQUIPE_A', teamsQuantity: 4 }),
            makeGroupByFieldRow({ name: 'EQUIPE_B', teamsQuantity: 2 }),
          ],
        );

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.teamTypes).toStrictEqual([
          { name: 'EQUIPE_A', value: 5 },
          { name: 'EQUIPE_B', value: 2 },
        ]);
      });

      it('should treat null quantities as 0', async () => {
        mockGroupByField(
          [
            makeGroupByFieldRow({ name: 'ELETRICISTA', laborQuantity: null }),
            makeGroupByFieldRow({ name: 'ELETRICISTA', laborQuantity: 4 }),
          ],
          [makeGroupByFieldRow({ name: 'EQUIPE_A', teamsQuantity: null })],
        );

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.laborTypes).toStrictEqual([
          { name: 'ELETRICISTA', value: 4 },
        ]);
        expect(result.teamTypes).toStrictEqual([
          { name: 'EQUIPE_A', value: 0 },
        ]);
      });
    });

    // ── Pass-through ────────────────────────────────────────────────────────
    describe('partners and csds', () => {
      it('should return repository results by reference', async () => {
        const partners = [{ name: 'Parceira 1', value: 3 }];
        const csds = [{ name: 'SIM', value: 7 }];
        repository.groupByPartner.mockResolvedValueOnce(partners as never);
        repository.groupByCsd.mockResolvedValueOnce(csds as never);

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.partners).toBe(partners);
        expect(result.csds).toBe(csds);
      });
    });

    // ── Formato da resposta ─────────────────────────────────────────────────
    describe('response shape', () => {
      it('should return an empty dashboard when the repository has no data', async () => {
        const result = await service.getDashboard(makeDashboardFilter());

        expect(result).toStrictEqual({
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

      it('should not log the dashboard to the console', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await service.getDashboard(makeDashboardFilter());

        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
      });
    });

    // ── Erros ───────────────────────────────────────────────────────────────
    describe('error propagation', () => {
      it.each([
        'findRecent',
        'groupByPartner',
        'groupByField',
        'groupByCsd',
        'getEmergencyTeamsWithValue',
        'getCapacityByYearMonth',
      ] as const)('should propagate errors from %s', async (method) => {
        const error = new Error(`${method} failed`);
        (repository[method] as Mock).mockRejectedValueOnce(error);

        await expect(
          service.getDashboard(makeDashboardFilter()),
        ).rejects.toThrow(error);
      });
    });
  });
});
