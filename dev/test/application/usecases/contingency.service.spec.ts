// contingency.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ContingencyService } from 'src/application/usecases/contingency.service';

import {
  CONTINGENCY_REPOSITORY,
  IContingencyRepository,
  ContingencyDashboard,
} from 'src/domain/repositories/IContingencyRepository';
import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from 'src/interface/dtos/contingencyDTO';

// ─── Constants (espelhando o service para legibilidade) ───────────────────────

const RECENT_DATES_LIMIT = 3;

// ─── Factories ────────────────────────────────────────────────────────────────

const makeCreateDTO = (
  overrides: Partial<CreateContingencyDTO> = {},
): CreateContingencyDTO =>
  ({
    dia_disponibilidade: '2025-06-10',
    idParceira: 1,
    tipo_recurso_mao_obra: 'ELETRICISTA',
    quantidade_mao_obra: 5,
    tipo_recurso_equipe: 'EQUIPE_A',
    quantidade_equipe: 3,
    disponibilizado_csd: 'SIM',
    idUser: 42,
    ...overrides,
  }) as CreateContingencyDTO;

const makeDashboardFilter = (
  overrides: Partial<DashboardFilterDTO> = {},
): DashboardFilterDTO =>
  ({
    dataInicial: '2025-06-01',
    dataFinal: '2025-06-30',
    idParceira: [1, 2],
    tipo_recurso_mao_obra: 'ELETRICISTA',
    tipo_recurso_equipe: 'EQUIPE_A',
    disponibilizado_csd: 'SIM',
    ...overrides,
  }) as DashboardFilterDTO;

const makeRecentEntry = (dateStr: string, nome: string | null = 'João') => ({
  dia_disponibilidade: new Date(dateStr),
  usuario: nome !== null ? { nome } : null,
});

const makeGroupByResult = () => [
  { label: 'A', count: 5 },
  { label: 'B', count: 3 },
];

const makeCapacidadeRow = (ano: number, mes: number, capacidade: number) => ({
  ano,
  mes,
  capacidade,
});

// ─── Repository Mock ──────────────────────────────────────────────────────────

type MockRepository = Record<keyof IContingencyRepository, jest.Mock>;

const makeRepositoryMock = (): MockRepository => ({
  create: jest.fn().mockResolvedValue(undefined),
  findRecent: jest
    .fn()
    .mockResolvedValue([
      makeRecentEntry('2025-06-10', 'João'),
      makeRecentEntry('2025-06-09', 'Maria'),
    ]),
  groupByParceira: jest.fn().mockResolvedValue(makeGroupByResult()),
  groupByField: jest.fn().mockResolvedValue(makeGroupByResult()),
  getCapacidadePorAnoMes: jest
    .fn()
    .mockResolvedValue([makeCapacidadeRow(2025, 6, 4)]),
  getEquipesEmergenciaComValor: jest.fn().mockResolvedValue([]),
  groupByCsd: jest.fn().mockResolvedValue(makeGroupByResult()),
});

// ─── Suíte ────────────────────────────────────────────────────────────────────

describe('ContingencyService', () => {
  let service: ContingencyService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = makeRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingencyService,
        { provide: CONTINGENCY_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get<ContingencyService>(ContingencyService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Sanity ──────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════════════

  describe('create', () => {
    it('should map DTO fields to repository entity and call create', async () => {
      const dto = makeCreateDTO();

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        dia_disponibilidade: new Date(dto.dia_disponibilidade),
        id_parceira: dto.idParceira,
        tipo_recurso_mao_obra: dto.tipo_recurso_mao_obra,
        quantidade_mao_obra: dto.quantidade_mao_obra,
        tipo_recurso_equipe: dto.tipo_recurso_equipe,
        quantidade_equipe: dto.quantidade_equipe,
        disponibilizado_csd: dto.disponibilizado_csd,
        id_usuario: dto.idUser,
      });
    });

    it('should convert dia_disponibilidade string to Date', async () => {
      await service.create(
        makeCreateDTO({ dia_disponibilidade: '2025-12-25' }),
      );

      const arg = repository.create.mock.calls[0][0];
      expect(arg.dia_disponibilidade).toBeInstanceOf(Date);
      expect(arg.dia_disponibilidade.toISOString()).toContain('2025-12-25');
    });

    it('should return void (no return value)', async () => {
      const result = await service.create(makeCreateDTO());
      expect(result).toBeUndefined();
    });

    it('should propagate repository exceptions', async () => {
      const error = new Error('DB write failed');
      repository.create.mockRejectedValueOnce(error);

      await expect(service.create(makeCreateDTO())).rejects.toThrow(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getDashboard
  // ═══════════════════════════════════════════════════════════════════════

  describe('getDashboard', () => {
    // ── Filter mapping ────────────────────────────────────────────────

    describe('filter mapping', () => {
      it('should map DashboardFilterDTO to DashboardFilter for all repository calls', async () => {
        const query = makeDashboardFilter();
        await service.getDashboard(query);

        const expectedFilter = {
          dataInicial: query.dataInicial,
          dataFinal: query.dataFinal,
          idParceira: query.idParceira,
          maoObra: query.maoObra,
          equipe: query.equipe,
          csd: query.csd,
        };

        expect(repository.findRecent).toHaveBeenCalledWith(
          expectedFilter,
          RECENT_DATES_LIMIT,
        );
        expect(repository.groupByParceira).toHaveBeenCalledWith(expectedFilter);
        expect(repository.groupByField).toHaveBeenCalledWith(
          'tipo_recurso_mao_obra',
          expectedFilter,
        );
        expect(repository.groupByField).toHaveBeenCalledWith(
          'tipo_recurso_equipe',
          expectedFilter,
        );
        expect(repository.groupByField).toHaveBeenCalledWith(
          'disponibilizado_csd',
          expectedFilter,
        );
      });
    });

    // ── Parallel execution ────────────────────────────────────────────

    describe('parallel execution', () => {
      it('should call all 7 repository methods in parallel (Promise.all)', async () => {
        const callOrder: string[] = [];

        repository.findRecent.mockImplementation(async () => {
          callOrder.push('findRecent');
          return [];
        });
        repository.groupByParceira.mockImplementation(async () => {
          callOrder.push('groupByParceira');
          return [];
        });
        repository.groupByField.mockImplementation(async () => {
          callOrder.push('groupByField');
          return [];
        });

        await service.getDashboard(makeDashboardFilter());

        // Todos devem ter sido chamados (7 = count + sums + recent + parceira + 3× groupByField)
        expect(callOrder).toHaveLength(7);
      });
    });

    // ── calcularCapacidadeMes (via getDashboard) ──────────────────────

    // ── calcularPorcentagemCedida ─────────────────────────────────────

    describe('calcularPorcentagemCedida', () => {
      it('should calculate percentage as Math.round((totalEquipe / capacidadeMes) * 100)', async () => {
        const totalEquipe = 10;
        const capacidade = 4;

        // Jun 2025: 2 a 6 = 5 dias úteis → capacidadeMes = 5 * 4 = 20
        repository.getCapacidadePorAnoMes.mockResolvedValueOnce([
          makeCapacidadeRow(2025, 6, capacidade),
        ]);

        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: '2025-06-02',
            dataFinal: '2025-06-06',
            idParceira: [1],
          }),
        );

        const expectedCapacidade = 5 * capacidade; // 20
        expect(result.porcentagemCedida).toBe(
          Math.round((totalEquipe / expectedCapacidade) * 100),
        );
      });

      it('should return null when capacidadeMes is 0', async () => {
        repository.getCapacidadePorAnoMes.mockResolvedValueOnce([]);

        const result = await service.getDashboard(
          makeDashboardFilter({ idParceira: [1] }),
        );

        expect(result.porcentagemCedida).toBeNull();
      });

      it('should return null when period is null', async () => {
        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: undefined,
            dataFinal: undefined,
          }),
        );

        expect(result.porcentagemCedida).toBeNull();
      });

      it('should round correctly (e.g. 33.333... → 33)', async () => {
        // 1 dia útil × capacidade 3 = 3 → 1/3 * 100 = 33.33 → 33
        repository.getCapacidadePorAnoMes.mockResolvedValueOnce([
          makeCapacidadeRow(2025, 6, 3),
        ]);

        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: '2025-06-02', // segunda
            dataFinal: '2025-06-02',
            idParceira: [1],
          }),
        );

        expect(result.porcentagemCedida).toBe(33);
      });
    });

    // ── recentDates formatting ────────────────────────────────────────

    describe('recentDates', () => {
      it('should format dates as YYYY-MM-DD and include usuario.nome', async () => {
        repository.findRecent.mockResolvedValueOnce([
          makeRecentEntry('2025-06-10', 'Ana'),
          makeRecentEntry('2025-06-09', 'Carlos'),
        ]);

        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: undefined,
            dataFinal: undefined,
          }),
        );

        expect(result.recentDates).toStrictEqual([
          { date: '2025-06-10', nome: 'Ana' },
          { date: '2025-06-09', nome: 'Carlos' },
        ]);
      });

      it('should return nome as null when usuario is null', async () => {
        repository.findRecent.mockResolvedValueOnce([
          makeRecentEntry('2025-06-10', null),
        ]);

        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: undefined,
            dataFinal: undefined,
          }),
        );

        expect(result.recentDates[0].nome).toBeNull();
      });

      it('should return empty array when no recent entries exist', async () => {
        repository.findRecent.mockResolvedValueOnce([]);

        const result = await service.getDashboard(
          makeDashboardFilter({
            dataInicial: undefined,
            dataFinal: undefined,
          }),
        );

        expect(result.recentDates).toStrictEqual([]);
      });
    });

    // ── Full response shape ───────────────────────────────────────────

    describe('response shape', () => {
      it('should return a complete ContingencyDashboard with all expected keys', async () => {
        const result = await service.getDashboard(makeDashboardFilter());

        const expectedKeys: (keyof ContingencyDashboard)[] = [
          'porcentagemCedida',
          'capacidadeMes',
          'recentDates',
          'parceira',
          'maoObra',
          'equipe',
          'csd',
        ];

        for (const key of expectedKeys) {
          expect(result).toHaveProperty(key);
        }
      });

      it('should pass groupByField results to correct response fields', async () => {
        const maoObraData = [{ label: 'X', count: 1 }];
        const equipeData = [{ label: 'Y', count: 2 }];
        const csdData = [{ label: 'Z', count: 3 }];

        repository.groupByField
          .mockResolvedValueOnce(maoObraData) // tipo_recurso_mao_obra
          .mockResolvedValueOnce(equipeData) // tipo_recurso_equipe
          .mockResolvedValueOnce(csdData); // disponibilizado_csd

        const result = await service.getDashboard(makeDashboardFilter());

        expect(result.maoObra).toBe(maoObraData);
        expect(result.equipe).toBe(equipeData);
        expect(result.csd).toBe(csdData);
      });
    });

    // ── Error propagation ─────────────────────────────────────────────

    describe('error propagation', () => {
      it('should propagate if any parallel repository call fails', async () => {
        const error = new Error('connection lost');

        await expect(
          service.getDashboard(makeDashboardFilter()),
        ).rejects.toThrow(error);
      });

      it('should propagate if getCapacidadePorAnoMes fails', async () => {
        const error = new Error('capacity table missing');
        repository.getCapacidadePorAnoMes.mockRejectedValueOnce(error);

        await expect(
          service.getDashboard(makeDashboardFilter()),
        ).rejects.toThrow(error);
      });
    });
  });
});
