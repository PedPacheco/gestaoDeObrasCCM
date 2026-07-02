// contingency.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';

import { DashboardFilter } from 'src/domain/repositories/IContingencyRepository';
import { Prisma } from '@prisma/client';
import { ContingencyRepository } from 'src/infra/repositories/contingencyRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeFilter = (
  overrides: Partial<DashboardFilter> = {},
): DashboardFilter => ({
  dataInicial: '2025-06-01',
  dataFinal: '2025-06-30',
  idParceira: [1, 2],
  maoObra: ['ELETRICISTA'],
  equipe: ['EQUIPE_A'],
  csd: ['SIM'],
  ...overrides,
});

const makeCreateInput = (
  overrides: Partial<Prisma.recursos_contingenciaUncheckedCreateInput> = {},
): Prisma.recursos_contingenciaUncheckedCreateInput =>
  ({
    dia_disponibilidade: new Date('2025-06-10'),
    id_parceira: 1,
    tipo_recurso_mao_obra: 'ELETRICISTA',
    quantidade_mao_obra: 5,
    tipo_recurso_equipe: 'EQUIPE_A',
    quantidade_equipe: 3,
    disponibilizado_csd: 'SIM',
    id_usuario: 42,
    ...overrides,
  }) as Prisma.recursos_contingenciaUncheckedCreateInput;

const makeAggregateResult = (overrides = {}) => ({
  _sum: { quantidade_mao_obra: 20, quantidade_equipe: 10 },
  _min: { dia_disponibilidade: new Date('2025-06-01') },
  _max: { dia_disponibilidade: new Date('2025-06-30') },
  ...overrides,
});

const makeRecentRow = (dateStr: string, nome: string | null = 'João') => ({
  dia_disponibilidade: new Date(dateStr),
  usuario: nome !== null ? { nome } : null,
  turmas: { turma: 'Turma A' },
});

const makeGroupByRow = (field: string, value: string, count: number) => ({
  [field]: value,
  _count: { _all: count },
});

const makeGroupByParceiraRow = (idParceira: number, count: number) => ({
  id_parceira: idParceira,
  _count: { _all: count },
});

const makeTurmaRow = (id: number, turma: string) => ({ id, turma });

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const makePrismaMock = () => ({
  recursos_contingencia: {
    create: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(15),
    aggregate: jest.fn().mockResolvedValue(makeAggregateResult()),
    findMany: jest.fn().mockResolvedValue([makeRecentRow('2025-06-10')]),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  turmas: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $queryRaw: jest.fn().mockResolvedValue([]),
});

type PrismaMock = ReturnType<typeof makePrismaMock>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrai o `where` passado ao Prisma na última chamada de um mock.
 */
const extractWhere = (mock: jest.Mock, callIndex = 0) =>
  mock.mock.calls[callIndex]?.[0]?.where;

/**
 * Monta o `where` esperado para um filtro completo — espelha a lógica
 * de `buildWhere` para validação independente.
 */
const buildExpectedWhere = (filter: DashboardFilter) => {
  const where: Record<string, any> = {};

  if (filter.dataInicial || filter.dataFinal) {
    where.dia_disponibilidade = {};
    if (filter.dataInicial)
      where.dia_disponibilidade.gte = new Date(filter.dataInicial);
    if (filter.dataFinal)
      where.dia_disponibilidade.lte = new Date(filter.dataFinal);
  }
  if (filter.idParceira?.length) where.id_parceira = { in: filter.idParceira };
  if (filter.maoObra?.length)
    where.tipo_recurso_mao_obra = { in: filter.maoObra };
  if (filter.equipe?.length) where.tipo_recurso_equipe = { in: filter.equipe };
  if (filter.csd?.length) where.disponibilizado_csd = { in: filter.csd };

  return where;
};

// ─── Suíte ────────────────────────────────────────────────────────────────────

describe('ContingencyRepository', () => {
  let repository: ContingencyRepository;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingencyRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<ContingencyRepository>(ContingencyRepository);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Sanity ──────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // buildWhere (testado indiretamente via count — método mais simples)
  // ═══════════════════════════════════════════════════════════════════════

  describe('buildWhere (via count)', () => {
    it('should build a complete where clause when all filter fields are present', async () => {
      const filter = makeFilter();
      await repository.groupByCsd(filter);

      expect(extractWhere(prisma.recursos_contingencia.count)).toStrictEqual(
        buildExpectedWhere(filter),
      );
    });

    it('should return empty where when filter is undefined', async () => {
      await repository.groupByCsd(undefined);
      expect(extractWhere(prisma.recursos_contingencia.count)).toStrictEqual(
        {},
      );
    });

    it('should return empty where when filter is empty object', async () => {
      await repository.groupByCsd({});
      expect(extractWhere(prisma.recursos_contingencia.count)).toStrictEqual(
        {},
      );
    });

    it('should include only gte when only dataInicial is provided', async () => {
      const filter = makeFilter({
        dataFinal: undefined,
        idParceira: undefined,
        maoObra: undefined,
        equipe: undefined,
        csd: undefined,
      });

      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where.dia_disponibilidade).toStrictEqual({
        gte: new Date(filter.dataInicial!),
      });
      expect(where).not.toHaveProperty('id_parceira');
    });

    it('should include only lte when only dataFinal is provided', async () => {
      const filter = makeFilter({
        dataInicial: undefined,
        idParceira: undefined,
        maoObra: undefined,
        equipe: undefined,
        csd: undefined,
      });

      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where.dia_disponibilidade).toStrictEqual({
        lte: new Date(filter.dataFinal!),
      });
    });

    it('should include both gte and lte when both dates are provided', async () => {
      const filter = makeFilter({
        idParceira: undefined,
        maoObra: undefined,
        equipe: undefined,
        csd: undefined,
      });

      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where.dia_disponibilidade).toStrictEqual({
        gte: new Date(filter.dataInicial!),
        lte: new Date(filter.dataFinal!),
      });
    });

    it('should not include dia_disponibilidade when both dates are undefined', async () => {
      const filter = makeFilter({
        dataInicial: undefined,
        dataFinal: undefined,
      });

      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).not.toHaveProperty('dia_disponibilidade');
    });

    it('should skip idParceira when array is empty', async () => {
      const filter = makeFilter({ idParceira: [] });
      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).not.toHaveProperty('id_parceira');
    });

    it('should skip maoObra when array is empty', async () => {
      const filter = makeFilter({ maoObra: [] });
      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).not.toHaveProperty('tipo_recurso_mao_obra');
    });

    it('should skip equipe when array is empty', async () => {
      const filter = makeFilter({ equipe: [] });
      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).not.toHaveProperty('tipo_recurso_equipe');
    });

    it('should skip csd when array is empty', async () => {
      const filter = makeFilter({ csd: [] });
      await repository.groupByCsd(filter);

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).not.toHaveProperty('disponibilizado_csd');
    });

    it('should handle individual filter fields in isolation', async () => {
      // Apenas idParceira
      await repository.groupByCsd(
        makeFilter({
          dataInicial: undefined,
          dataFinal: undefined,
          maoObra: undefined,
          equipe: undefined,
          csd: undefined,
        }),
      );

      const where = extractWhere(prisma.recursos_contingencia.count);
      expect(where).toStrictEqual({ id_parceira: { in: [1, 2] } });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════════════

  describe('create', () => {
    it('should delegate to prisma.recursos_contingencia.create with exact data', async () => {
      const data = makeCreateInput();

      await repository.create(data);

      expect(prisma.recursos_contingencia.create).toHaveBeenCalledTimes(1);
      expect(prisma.recursos_contingencia.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('should return void', async () => {
      const result = await repository.create(makeCreateInput());
      expect(result).toBeUndefined();
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('unique constraint violation');
      prisma.recursos_contingencia.create.mockRejectedValueOnce(error);

      await expect(repository.create(makeCreateInput())).rejects.toThrow(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // findRecent
  // ═══════════════════════════════════════════════════════════════════════

  describe('findRecent', () => {
    it('should call findMany with correct where, orderBy, take and select', async () => {
      const filter = makeFilter();

      await repository.findRecent(filter);

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: buildExpectedWhere(filter),
        orderBy: { criado_em: 'desc' },

        select: {
          dia_disponibilidade: true,
          usuario: { select: { nome: true } },
          turmas: { select: { turma: true } },
        },
      });
    });

    it('should return the rows from prisma unchanged', async () => {
      const rows = [
        makeRecentRow('2025-06-10', 'Ana'),
        makeRecentRow('2025-06-09', null),
      ];
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findRecent(makeFilter(), 3);

      expect(result).toBe(rows); // mesma referência
    });

    it('should handle undefined filter', async () => {
      await repository.findRecent(undefined, 3);

      const where = extractWhere(prisma.recursos_contingencia.findMany);
      expect(where).toStrictEqual({});
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('findMany failed');
      prisma.recursos_contingencia.findMany.mockRejectedValueOnce(error);

      await expect(repository.findRecent(makeFilter(), 3)).rejects.toThrow(
        error,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByField
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByField', () => {
    it('should call groupBy with the correct field and where', async () => {
      const filter = makeFilter();
      await repository.groupByField('tipo_recurso_mao_obra', filter);

      expect(prisma.recursos_contingencia.groupBy).toHaveBeenCalledWith({
        by: ['tipo_recurso_mao_obra'],
        where: buildExpectedWhere(filter),
        _count: { _all: true },
      });
    });

    it('should map groupBy result to NamedCount[]', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByRow('tipo_recurso_equipe', 'EQUIPE_A', 10),
        makeGroupByRow('tipo_recurso_equipe', 'EQUIPE_B', 5),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_equipe',
        makeFilter(),
      );

      expect(result).toStrictEqual([
        { name: 'EQUIPE_A', value: 10 },
        { name: 'EQUIPE_B', value: 5 },
      ]);
    });

    it('should return empty array when no groups exist', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);

      const result = await repository.groupByField(
        'disponibilizado_csd',
        makeFilter(),
      );

      expect(result).toStrictEqual([]);
    });

    it('should work with each valid ContingencyGroupField', async () => {
      const fields = [
        'tipo_recurso_mao_obra',
        'tipo_recurso_equipe',
        'disponibilizado_csd',
      ] as const;

      for (const field of fields) {
        prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
          makeGroupByRow(field, 'VALUE', 1),
        ]);

        const result = await repository.groupByField(field, makeFilter());

        expect(result).toStrictEqual([{ name: 'VALUE', value: 1 }]);
      }

      expect(prisma.recursos_contingencia.groupBy).toHaveBeenCalledTimes(3);
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('groupBy failed');
      prisma.recursos_contingencia.groupBy.mockRejectedValueOnce(error);

      await expect(
        repository.groupByField('tipo_recurso_mao_obra', makeFilter()),
      ).rejects.toThrow(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByParceira
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByParceira', () => {
    it('should groupBy id_parceira and resolve turma names', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(1, 10),
        makeGroupByParceiraRow(2, 5),
      ]);
      prisma.turmas.findMany.mockResolvedValueOnce([
        makeTurmaRow(1, 'Turma Alpha'),
        makeTurmaRow(2, 'Turma Beta'),
      ]);

      const result = await repository.groupByParceira(makeFilter());

      expect(result).toStrictEqual([
        { name: 'Turma Alpha', value: 10 },
        { name: 'Turma Beta', value: 5 },
      ]);
    });

    it('should query turmas with the ids from groupBy result', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(3, 7),
        makeGroupByParceiraRow(5, 2),
      ]);
      prisma.turmas.findMany.mockResolvedValueOnce([]);

      await repository.groupByParceira(makeFilter());

      expect(prisma.turmas.findMany).toHaveBeenCalledWith({
        where: { id: { in: [3, 5] } },
        select: { id: true, turma: true },
      });
    });

    it('should fallback to stringified id when turma name is not found', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(99, 3),
      ]);
      prisma.turmas.findMany.mockResolvedValueOnce([]); // nenhuma turma encontrada

      const result = await repository.groupByParceira(makeFilter());

      expect(result).toStrictEqual([{ name: '99', value: 3 }]);
    });

    it('should return empty array when no groups exist', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);
      prisma.turmas.findMany.mockResolvedValueOnce([]);

      const result = await repository.groupByParceira(makeFilter());

      expect(result).toStrictEqual([]);
    });

    it('should query turmas with empty array when groupBy returns no rows', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);

      await repository.groupByParceira(makeFilter());

      expect(prisma.turmas.findMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true, turma: true },
      });
    });

    it('should propagate prisma exceptions from groupBy', async () => {
      const error = new Error('groupBy parceira failed');
      prisma.recursos_contingencia.groupBy.mockRejectedValueOnce(error);

      await expect(repository.groupByParceira(makeFilter())).rejects.toThrow(
        error,
      );
    });

    it('should propagate prisma exceptions from turmas.findMany', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(1, 1),
      ]);
      const error = new Error('turmas query failed');
      prisma.turmas.findMany.mockRejectedValueOnce(error);

      await expect(repository.groupByParceira(makeFilter())).rejects.toThrow(
        error,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getCapacidadePorAnoMes
  // ═══════════════════════════════════════════════════════════════════════

  describe('getCapacidadePorAnoMes', () => {
    it('should return early with empty array when anos is empty', async () => {
      const result = await repository.getCapacidadePorAnoMes([], [1, 2]);

      expect(result).toStrictEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return early with empty array when turmas is empty', async () => {
      const result = await repository.getCapacidadePorAnoMes(['2025'], []);

      expect(result).toStrictEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return early with empty array when both are empty', async () => {
      const result = await repository.getCapacidadePorAnoMes([], []);

      expect(result).toStrictEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should call $queryRaw when both anos and turmas are non-empty', async () => {
      const rows = [{ ano: 2025, mes: 6, capacidade: 10 }];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getCapacidadePorAnoMes(['2025'], [1, 2]);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBe(rows);
    });

    it('should pass a Prisma.sql tagged template to $queryRaw', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      await repository.getCapacidadePorAnoMes(['2024', '2025'], [1, 3]);

      const rawArg = prisma.$queryRaw.mock.calls[0][0];

      // Prisma.sql retorna um objeto com `strings` e `values`
      // Verificamos que é um tagged template (não uma string crua)
      expect(rawArg).toHaveProperty('strings');
      expect(rawArg).toHaveProperty('values');
    });

    it('should return the exact result from $queryRaw (no transformation)', async () => {
      const rows = [
        { ano: 2024, mes: 12, capacidade: 5 },
        { ano: 2025, mes: 1, capacidade: 8 },
      ];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getCapacidadePorAnoMes(
        ['2024', '2025'],
        [1],
      );

      expect(result).toBe(rows); // mesma referência
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('raw query failed');
      prisma.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getCapacidadePorAnoMes(['2025'], [1]),
      ).rejects.toThrow(error);
    });
  });
});
