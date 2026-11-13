import { Test, TestingModule } from '@nestjs/testing';
import { ContingencyInput } from 'src/application/types';
import { ContingencyGroupField } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ContingencyRepository } from 'src/infra/repositories/contingencyRepository';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeFilter = (
  overrides: Partial<ContingencyInput> = {},
): ContingencyInput => ({
  mesInicial: '2025-06', // formato YYYY-MM
  mesFinal: '2025-06',
  idParceira: [1, 2],
  maoObra: ['ELETRICISTA'],
  equipe: ['EQUIPE_A'],
  csd: ['SIM'],
  ...overrides,
});

const makeRecentRow = (
  dateStr: string,
  id = 1,
  nome: string | null = 'João',
) => ({
  id,
  dia_disponibilidade: new Date(dateStr),
  novo_tabela_usuarios: nome !== null ? { nome } : null,
  turmas: { turma: 'Turma A' },
});

const makeCreateInput = (
  overrides: Partial<Prisma.recursos_contingenciaUncheckedCreateInput> = {},
): Prisma.recursos_contingenciaUncheckedCreateInput => ({
  dia_disponibilidade: new Date('2025-06-10T00:00:00.000Z'),
  id_parceira: 1,
  tipo_recurso_mao_obra: 'ELETRICISTA',
  quantidade_mao_obra: 5,
  tipo_recurso_equipe: 'EQUIPE_A',
  quantidade_equipe: 3,
  disponibilizado_csd: 'SIM',
  id_usuario: 42,
  ...overrides,
});

/** Linha devolvida por `findMany` dentro de `groupByField`. */
type GroupByFieldFindManyRow = {
  tipo_recurso_mao_obra?: string | null;
  tipo_recurso_equipe?: string | null;
  quantidade_mao_obra: number | null;
  quantidade_equipe: number | null;
};

const makeGroupByFieldFindManyRow = (
  overrides: Partial<GroupByFieldFindManyRow> = {},
): GroupByFieldFindManyRow => ({
  quantidade_mao_obra: 0,
  quantidade_equipe: 0,
  ...overrides,
});

const makeCsdGroupRow = (value: string | null, count: number) => ({
  disponibilizado_csd: value,
  _count: { _all: count },
});

const makeGroupByParceiraRow = (idParceira: number, count: number) => ({
  id_parceira: idParceira,
  _count: { _all: count },
});

const makeTurmaRow = (id: number, turma: string) => ({ id, turma });

type EmergencyTeamRawRow = {
  ano: number;
  mes: number;
  tipo: string;
  quantidade: number;
  valor: number;
};

const makeEmergencyTeamRawRow = (
  overrides: Partial<EmergencyTeamRawRow> = {},
): EmergencyTeamRawRow => ({
  ano: 2025,
  mes: 6,
  tipo: 'EQUIPE_A',
  quantidade: 3,
  valor: 450,
  ...overrides,
});

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const makePrismaMock = () => ({
  recursos_contingencia: {
    count: vi.fn().mockResolvedValue(15),
    create: vi.fn().mockResolvedValue(undefined),
    findMany: vi.fn().mockResolvedValue([makeRecentRow('2025-06-10')]),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  turmas: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  $queryRaw: vi.fn().mockResolvedValue([]),
});

type PrismaMock = ReturnType<typeof makePrismaMock>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai o `where` passado ao Prisma numa chamada específica de um mock. */
const extractWhere = (mock: Mock, callIndex = 0) =>
  mock.mock.calls[callIndex]?.[0]?.where;

/** Extrai o Prisma.Sql passado ao $queryRaw, com parâmetros como '?' e espaços normalizados. */
const extractRawQuery = (mock: Mock, callIndex = 0) => {
  const arg = mock.mock.calls[callIndex][0] as Prisma.Sql;
  return {
    arg,
    sql: arg.strings.join('?').replace(/\s+/g, ' ').trim(),
    values: arg.values,
  };
};

/**
 * Primeiro dia (UTC) de um mês YYYY-MM, com deslocamento opcional.
 * Implementação independente do repository (sem moment).
 */
const monthStart = (value?: string, offset = 0): Date | null => {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)); // Date.UTC trata a virada do ano
};

/** Monta o `where` esperado para as consultas Prisma. */
const buildExpectedWhere = (filter: ContingencyInput = {}) => {
  const where: Record<string, any> = {};
  const start = monthStart(filter.mesInicial);
  const endExclusive = monthStart(filter.mesFinal, 1);

  if (start || endExclusive) {
    where.dia_disponibilidade = {
      ...(start && { gte: start }),
      ...(endExclusive && { lt: endExclusive }),
    };
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

    repository = module.get(ContingencyRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Sanity ──────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // buildWhere
  // ═══════════════════════════════════════════════════════════════════════
  describe('buildWhere (via findRecent)', () => {
    const lastWhere = () => extractWhere(prisma.recursos_contingencia.findMany);

    it('should build a complete where clause when all filter fields are present', async () => {
      const filter = makeFilter();

      await repository.findRecent(filter);

      expect(lastWhere()).toStrictEqual(buildExpectedWhere(filter));
    });

    it.each<[string, ContingencyInput | undefined]>([
      ['undefined', undefined],
      ['an empty object', {}],
    ])('should return an empty where when filter is %s', async (_, filter) => {
      await repository.findRecent(filter);

      expect(lastWhere()).toStrictEqual({});
    });

    // ── Período ───────────────────────────────────────────────────────────────
    it('should cover the whole month (gte first day, lt first day of next month)', async () => {
      await repository.findRecent({
        mesInicial: '2025-06',
        mesFinal: '2025-06',
      });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: {
          gte: new Date('2025-06-01T00:00:00.000Z'),
          lt: new Date('2025-07-01T00:00:00.000Z'),
        },
      });
    });

    it('should cover a range of several months', async () => {
      await repository.findRecent({
        mesInicial: '2026-01',
        mesFinal: '2026-03',
      });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lt: new Date('2026-04-01T00:00:00.000Z'),
        },
      });
    });

    it('should roll over the year when mesFinal is December', async () => {
      await repository.findRecent({ mesFinal: '2025-12' });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: { lt: new Date('2026-01-01T00:00:00.000Z') },
      });
    });

    it('should include only gte when only mesInicial is provided', async () => {
      await repository.findRecent({ mesInicial: '2025-06' });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: { gte: new Date('2025-06-01T00:00:00.000Z') },
      });
    });

    it('should include only lt when only mesFinal is provided', async () => {
      await repository.findRecent({ mesFinal: '2025-06' });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: { lt: new Date('2025-07-01T00:00:00.000Z') },
      });
    });

    it.each([
      ['undefined', undefined],
      ['empty string', ''],
      ['old format MM/YYYY', '06/2025'],
      ['old format DD/MM/YYYY', '01/06/2025'],
      ['invalid month', '2025-13'],
      ['single-digit month', '2025-6'],
      ['text', 'abc'],
    ])('should ignore the period when months are %s', async (_, value) => {
      await repository.findRecent(
        makeFilter({ mesInicial: value, mesFinal: value }),
      );

      expect(lastWhere()).not.toHaveProperty('dia_disponibilidade');
    });

    // ── Arrays vazios ─────────────────────────────────────────────────────────
    it.each<[keyof ContingencyInput, string]>([
      ['idParceira', 'id_parceira'],
      ['maoObra', 'tipo_recurso_mao_obra'],
      ['equipe', 'tipo_recurso_equipe'],
      ['csd', 'disponibilizado_csd'],
    ])('should skip %s when array is empty', async (filterKey, whereKey) => {
      await repository.findRecent(makeFilter({ [filterKey]: [] }));

      expect(lastWhere()).not.toHaveProperty(whereKey);
    });

    // ── Campos isolados ───────────────────────────────────────────────────────
    it.each<[ContingencyInput, Record<string, unknown>]>([
      [{ idParceira: [1, 2] }, { id_parceira: { in: [1, 2] } }],
      [
        { maoObra: ['ELETRICISTA'] },
        { tipo_recurso_mao_obra: { in: ['ELETRICISTA'] } },
      ],
      [{ equipe: ['EQUIPE_A'] }, { tipo_recurso_equipe: { in: ['EQUIPE_A'] } }],
      [
        { csd: ['SIM', 'NAO'] },
        { disponibilizado_csd: { in: ['SIM', 'NAO'] } },
      ],
    ])('should handle filter %o in isolation', async (filter, expected) => {
      await repository.findRecent(filter);

      expect(lastWhere()).toStrictEqual(expected);
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
    it('should call findMany with correct where, orderBy and select', async () => {
      const filter = makeFilter();

      await repository.findRecent(filter);

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: buildExpectedWhere(filter),
        orderBy: { criado_em: 'desc' },
        select: {
          id: true,
          dia_disponibilidade: true,
          novo_tabela_usuarios: { select: { nome: true } },
          turmas: { select: { turma: true } },
        },
      });
    });

    it('should not limit the number of results (no take)', async () => {
      await repository.findRecent(makeFilter());

      const args = prisma.recursos_contingencia.findMany.mock.calls[0][0];
      expect(args).not.toHaveProperty('take');
    });

    it('should return the rows from prisma unchanged', async () => {
      const rows = [
        makeRecentRow('2025-06-10', 2, 'Ana'),
        makeRecentRow('2025-06-09', null),
      ];
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findRecent(makeFilter());

      expect(result).toBe(rows); // mesma referência
    });

    it('should handle undefined filter', async () => {
      await repository.findRecent(undefined);

      expect(extractWhere(prisma.recursos_contingencia.findMany)).toStrictEqual(
        {},
      );
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('findMany failed');
      prisma.recursos_contingencia.findMany.mockRejectedValueOnce(error);

      await expect(repository.findRecent(makeFilter())).rejects.toThrow(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByCsd
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByCsd', () => {
    it('should call groupBy by disponibilizado_csd with the built where and _count', async () => {
      const filter = makeFilter();

      await repository.groupByCsd(filter);

      expect(prisma.recursos_contingencia.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.recursos_contingencia.groupBy).toHaveBeenCalledWith({
        by: ['disponibilizado_csd'],
        where: buildExpectedWhere(filter),
        _count: { _all: true },
      });
    });

    it('should use an empty where when no filter is provided', async () => {
      await repository.groupByCsd();

      expect(extractWhere(prisma.recursos_contingencia.groupBy)).toStrictEqual(
        {},
      );
    });

    it('should map groupBy rows to { name, value }', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeCsdGroupRow('SIM', 10),
        makeCsdGroupRow('NAO', 4),
      ]);

      const result = await repository.groupByCsd(makeFilter());

      expect(result).toStrictEqual([
        { name: 'SIM', value: 10 },
        { name: 'NAO', value: 4 },
      ]);
    });

    it('should keep the order returned by prisma', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeCsdGroupRow('NAO', 1),
        makeCsdGroupRow('SIM', 99),
      ]);

      const result = await repository.groupByCsd(makeFilter());

      expect(result.map((r) => r.name)).toStrictEqual(['NAO', 'SIM']);
    });

    it('should return empty array when there are no groups', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);

      const result = await repository.groupByCsd(makeFilter());

      expect(result).toStrictEqual([]);
    });

    it('should not use count or findMany', async () => {
      await repository.groupByCsd(makeFilter());

      expect(prisma.recursos_contingencia.count).not.toHaveBeenCalled();
      expect(prisma.recursos_contingencia.findMany).not.toHaveBeenCalled();
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('groupBy failed');
      prisma.recursos_contingencia.groupBy.mockRejectedValueOnce(error);

      await expect(repository.groupByCsd(makeFilter())).rejects.toBe(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByField
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByField', () => {
    const baseSelect = {
      quantidade_mao_obra: true,
      quantidade_equipe: true,
    };

    const fields: readonly ContingencyGroupField[] = [
      'tipo_recurso_mao_obra',
      'tipo_recurso_equipe',
    ];

    // ── Query ───────────────────────────────────────────────────────────────
    it.each(fields)(
      'should call findMany with the correct where and select for "%s"',
      async (field) => {
        const filter = makeFilter();

        await repository.groupByField(field, filter);

        expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
          where: buildExpectedWhere(filter),
          select: { ...baseSelect, [field]: true },
        });
      },
    );

    it('should not use groupBy anymore', async () => {
      await repository.groupByField('tipo_recurso_mao_obra', makeFilter());

      expect(prisma.recursos_contingencia.groupBy).not.toHaveBeenCalled();
    });

    it('should build where from a partial filter', async () => {
      const filter = makeFilter({
        idParceira: [],
        maoObra: undefined,
        csd: [],
      });

      await repository.groupByField('tipo_recurso_equipe', filter);

      expect(extractWhere(prisma.recursos_contingencia.findMany)).toStrictEqual(
        buildExpectedWhere(filter),
      );
    });

    it('should use an empty where when no filter is provided', async () => {
      await repository.groupByField('tipo_recurso_mao_obra');

      expect(extractWhere(prisma.recursos_contingencia.findMany)).toStrictEqual(
        buildExpectedWhere({}),
      );
    });

    // ── Mapeamento ──────────────────────────────────────────────────────────
    it('should map rows to GroupByFieldRow[]', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          tipo_recurso_equipe: 'EQUIPE_A',
          quantidade_mao_obra: 10,
          quantidade_equipe: 2,
        }),
        makeGroupByFieldFindManyRow({
          tipo_recurso_equipe: 'EQUIPE_B',
          quantidade_mao_obra: 5,
          quantidade_equipe: 1,
        }),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_equipe',
        makeFilter(),
      );

      expect(result).toStrictEqual([
        {
          name: 'EQUIPE_A',
          laborQuantity: 10,
          teamsQuantity: 2,
        },
        {
          name: 'EQUIPE_B',
          laborQuantity: 5,
          teamsQuantity: 1,
        },
      ]);
    });

    it('should default null quantities to 0', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          tipo_recurso_mao_obra: 'ELETRICISTA',
          quantidade_mao_obra: null,
          quantidade_equipe: null,
        }),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_mao_obra',
        makeFilter(),
      );

      expect(result).toStrictEqual([
        {
          name: 'ELETRICISTA',
          laborQuantity: 0,
          teamsQuantity: 0,
        },
      ]);
    });

    it('should discard rows where the grouped field is null or undefined', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          tipo_recurso_mao_obra: null,
          quantidade_mao_obra: 99,
        }),
        makeGroupByFieldFindManyRow({ quantidade_mao_obra: 77 }), // campo ausente
        makeGroupByFieldFindManyRow({
          tipo_recurso_mao_obra: 'ELETRICISTA',
          quantidade_mao_obra: 3,
        }),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_mao_obra',
        makeFilter(),
      );

      expect(result).toStrictEqual([
        {
          name: 'ELETRICISTA',
          laborQuantity: 3,
          teamsQuantity: 0,
        },
      ]);
    });

    it('should return empty array when the default findMany rows lack the grouped field', async () => {
      // Usa o retorno por omissão do mock (makeRecentRow), que não tem o campo.
      const result = await repository.groupByField(
        'tipo_recurso_mao_obra',
        makeFilter(),
      );

      expect(result).toStrictEqual([]);
    });

    it('should keep falsy but non-null values (e.g. empty string)', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({ tipo_recurso_equipe: '' }),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_equipe',
        makeFilter(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('');
    });

    it('should not aggregate rows with the same name (one entry per record)', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          tipo_recurso_equipe: 'EQUIPE_A',
          quantidade_equipe: 1,
        }),
        makeGroupByFieldFindManyRow({
          tipo_recurso_equipe: 'EQUIPE_A',
          quantidade_equipe: 4,
        }),
      ]);

      const result = await repository.groupByField(
        'tipo_recurso_equipe',
        makeFilter(),
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.teamsQuantity)).toStrictEqual([1, 4]);
    });

    it('should return empty array when no rows exist', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([]);

      const result = await repository.groupByField(
        'tipo_recurso_equipe',
        makeFilter(),
      );

      expect(result).toStrictEqual([]);
    });

    // ── Erros ───────────────────────────────────────────────────────────────
    it('should propagate prisma exceptions', async () => {
      const error = new Error('findMany failed');
      prisma.recursos_contingencia.findMany.mockRejectedValueOnce(error);

      await expect(
        repository.groupByField('tipo_recurso_mao_obra', makeFilter()),
      ).rejects.toThrow(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByPartner
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByPartner', () => {
    it('should groupBy id_parceira and resolve turma names', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(1, 10),
        makeGroupByParceiraRow(2, 5),
      ]);
      prisma.turmas.findMany.mockResolvedValueOnce([
        makeTurmaRow(1, 'Turma Alpha'),
        makeTurmaRow(2, 'Turma Beta'),
      ]);

      const result = await repository.groupByPartner(makeFilter());

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

      await repository.groupByPartner(makeFilter());

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

      const result = await repository.groupByPartner(makeFilter());

      expect(result).toStrictEqual([{ name: '99', value: 3 }]);
    });

    it('should return empty array when no groups exist', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);
      prisma.turmas.findMany.mockResolvedValueOnce([]);

      const result = await repository.groupByPartner(makeFilter());

      expect(result).toStrictEqual([]);
    });

    it('should not call query turmas with empty array when groupBy ', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);

      await repository.groupByPartner(makeFilter());

      expect(prisma.turmas.findMany).not.toHaveBeenCalled();
    });

    it('should propagate prisma exceptions from groupBy', async () => {
      const error = new Error('groupBy parceira failed');
      prisma.recursos_contingencia.groupBy.mockRejectedValueOnce(error);

      await expect(repository.groupByPartner(makeFilter())).rejects.toThrow(
        error,
      );
    });

    it('should propagate prisma exceptions from turmas.findMany', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([
        makeGroupByParceiraRow(1, 1),
      ]);
      const error = new Error('turmas query failed');
      prisma.turmas.findMany.mockRejectedValueOnce(error);

      await expect(repository.groupByPartner(makeFilter())).rejects.toThrow(
        error,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getCapacityByYearMonth
  // ═══════════════════════════════════════════════════════════════════════

  describe('getCapacityByYearMonth', () => {
    const lastRawQuery = () => extractRawQuery(prisma.$queryRaw);

    it('should call $queryRaw once and return its result unchanged', async () => {
      const rows = [{ ano: '2025', mes: 6, capacidade: 10, valor: 1500 }];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getCapacityByYearMonth(makeFilter());

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBe(rows);
    });

    it('should build the base query', async () => {
      await repository.getCapacityByYearMonth(makeFilter());

      const { arg, sql } = lastRawQuery();
      expect(arg).toBeInstanceOf(Prisma.Sql);
      expect(sql).toContain('FROM public.capacidade_execucao ce');
      expect(sql).toContain('JOIN public.turmas t ON t.id = ce.id_turma');
      expect(sql).toContain('SUM(COALESCE(m.valor, 0))::int AS capacidade');
      expect(sql).toContain('::float8 AS valor');
      expect(sql).toMatch(/GROUP BY ce\.ano, m\.mes ORDER BY ce\.ano, m\.mes$/);
    });

    it('should filter months overlapping the period and partners', async () => {
      await repository.getCapacityByYearMonth(
        makeFilter({ mesInicial: '2026-01', mesFinal: '2026-03' }),
      );

      const { sql, values } = lastRawQuery();
      expect(sql).toContain(
        'WHERE make_date(ce.ano::int, m.mes, 1) >= ?::date AND make_date(ce.ano::int, m.mes, 1) < ?::date AND t.id IN (?,?)',
      );
      expect(values).toStrictEqual(['2026-01-01', '2026-04-01', 1, 2]);
    });

    it('should ignore labor, team and csd filters', async () => {
      await repository.getCapacityByYearMonth(makeFilter());

      const { sql, values } = lastRawQuery();
      expect(values).toStrictEqual(['2025-06-01', '2025-07-01', 1, 2]);
      expect(sql).not.toMatch(/tipo_recurso|disponibilizado_csd/);
    });

    it('should not generate a WHERE without period and partners', async () => {
      await repository.getCapacityByYearMonth({});

      const { sql, values } = lastRawQuery();
      expect(sql).not.toContain('WHERE');
      expect(values).toStrictEqual([]);
    });

    it('should parameterize all values', async () => {
      await repository.getCapacityByYearMonth(
        makeFilter({
          mesInicial: '2031-06',
          mesFinal: '2031-06',
          idParceira: [7771],
        }),
      );

      const { sql } = lastRawQuery();
      expect(sql).not.toContain('2031');
      expect(sql).not.toContain('7771');
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('raw query failed');
      prisma.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getCapacityByYearMonth(makeFilter()),
      ).rejects.toBe(error);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getEmergencyTeamsWithValue
  // ═══════════════════════════════════════════════════════════════════════

  describe('getEmergencyTeamsWithValue', () => {
    const lastRawQuery = () => extractRawQuery(prisma.$queryRaw);

    it('should call $queryRaw once and return its result unchanged', async () => {
      const rows = [
        makeEmergencyTeamRawRow(),
        makeEmergencyTeamRawRow({ tipo: 'EQUIPE_B' }),
      ];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getEmergencyTeamsWithValue(makeFilter());

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBe(rows);
    });

    it('should build the CTEs, the LEFT JOIN and the final grouping', async () => {
      await repository.getEmergencyTeamsWithValue(makeFilter());

      const { sql } = lastRawQuery();
      expect(sql).toContain('WITH equipes AS (');
      expect(sql).toContain('FROM public.recursos_contingencia rc');
      expect(sql).toContain('FROM public.capacidade_execucao');
      expect(sql).toContain('should_cost / 22 AS valor_diario');
      expect(sql).toContain(
        'LEFT JOIN valores v ON v.ano = e.ano AND v.tipo = e.tipo AND v.id_parceira = e.id_parceira',
      );
      expect(sql).toContain(
        'COALESCE(SUM(e.quantidade * v.valor_diario), 0)::float8 AS valor',
      );
      expect(sql).toMatch(
        /GROUP BY e\.ano, e\.mes, e\.tipo ORDER BY e\.ano, e\.mes, e\.tipo$/,
      );
    });

    it('should filter teams by date range and values by year range', async () => {
      await repository.getEmergencyTeamsWithValue(
        makeFilter({ mesInicial: '2025-11', mesFinal: '2026-02' }),
      );

      const { sql, values } = lastRawQuery();
      expect(sql).toContain(
        'WHERE rc.dia_disponibilidade >= ?::date AND rc.dia_disponibilidade < ?::date AND rc.id_parceira IN (?,?)',
      );
      expect(sql).toContain(
        'WHERE ano::int >= ? AND ano::int <= ? AND id_turma IN (?,?)',
      );
      // equipes: início, fim exclusivo, parceiras | valores: ano inicial, ano final, parceiras
      expect(values).toStrictEqual([
        '2025-11-01',
        '2026-03-01',
        1,
        2,
        2025,
        2026,
        1,
        2,
      ]);
    });

    it('should filter only by partners when no period is given', async () => {
      await repository.getEmergencyTeamsWithValue({ idParceira: [1, 2] });

      const { sql, values } = lastRawQuery();
      expect(sql).not.toContain('rc.dia_disponibilidade >=');
      expect(sql).not.toContain('ano::int >=');
      expect(values).toStrictEqual([1, 2, 1, 2]);
    });

    it('should not generate any WHERE without filters', async () => {
      await repository.getEmergencyTeamsWithValue();

      const { sql, values } = lastRawQuery();
      expect(sql).not.toContain('WHERE');
      expect(values).toStrictEqual([]);
    });

    it('should ignore invalid months', async () => {
      await repository.getEmergencyTeamsWithValue({
        mesInicial: '06/2025',
        mesFinal: 'abc',
      });

      expect(lastRawQuery().values).toStrictEqual([]);
    });

    it('should propagate prisma exceptions', async () => {
      const error = new Error('raw query failed');
      prisma.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getEmergencyTeamsWithValue(makeFilter()),
      ).rejects.toBe(error);
    });
  });
});
