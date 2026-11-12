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
  dataInicial: '01/06/2025', // formato DD/MM/YYYY esperado pelo buildWhere
  dataFinal: '30/06/2025',
  idParceira: [1, 2],
  maoObra: ['ELETRICISTA'],
  equipe: ['EQUIPE_A'],
  csd: ['SIM'],
  ...overrides,
});

const makeRecentRow = (dateStr: string, nome: string | null = 'João') => ({
  dia_disponibilidade: new Date(dateStr),
  novo_tabela_usuarios: nome !== null ? { nome } : null,
  turmas: { turma: 'Turma A' },
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

/** Linha devolvida por `findMany` dentro de `groupByField`. */
type GroupByFieldFindManyRow = {
  tipo_recurso_mao_obra?: string | null;
  tipo_recurso_equipe?: string | null;
  quantidade_mao_obra: number | null;
  quantidade_equipe: number | null;
  disponibilizado_csd: string | null;
};

const makeGroupByFieldFindManyRow = (
  overrides: Partial<GroupByFieldFindManyRow> = {},
): GroupByFieldFindManyRow => ({
  quantidade_mao_obra: 0,
  quantidade_equipe: 0,
  disponibilizado_csd: null,
  ...overrides,
});

const makeCsdGroupRow = (value: string | null, count: number) => ({
  disponibilizado_csd: value,
  _count: { _all: count },
});

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

const makeGroupByParceiraRow = (idParceira: number, count: number) => ({
  id_parceira: idParceira,
  _count: { _all: count },
});

const makeTurmaRow = (id: number, turma: string) => ({ id, turma });

// ─── Prisma Mock ──────────────────────────────────────────────────────────────

const makePrismaMock = () => ({
  recursos_contingencia: {
    create: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(15),
    aggregate: vi.fn().mockResolvedValue(makeAggregateResult()),
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

/**
 * Extrai o Prisma.Sql passado ao $queryRaw.
 * Os parâmetros aparecem como '?' e os espaços são normalizados.
 */
const extractRawQuery = (mock: Mock, callIndex = 0) => {
  const arg = mock.mock.calls[callIndex][0] as Prisma.Sql;

  return {
    arg,
    sql: arg.strings.join('?').replace(/\s+/g, ' ').trim(),
    values: arg.values,
  };
};

/**
 * Converte 'DD/MM/YYYY' em Date à meia-noite UTC.
 * Não usa o moment, para que a validação seja independente da implementação.
 */
const parseDateBR = (value: string): Date => {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/** Monta o `where` esperado e espelha a lógica de `buildWhere`. */
const buildExpectedWhere = (filter: ContingencyInput = {}) => {
  const where: Record<string, any> = {};

  if (filter.dataInicial || filter.dataFinal) {
    where.dia_disponibilidade = {};
    if (filter.dataInicial)
      where.dia_disponibilidade.gte = parseDateBR(filter.dataInicial);
    if (filter.dataFinal)
      where.dia_disponibilidade.lte = parseDateBR(filter.dataFinal);
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
  // buildWhere (testado indiretamente via count — método mais simples)
  // ═══════════════════════════════════════════════════════════════════════

  describe('buildWhere (via findRecent)', () => {
    const lastWhere = () => extractWhere(prisma.recursos_contingencia.findMany);

    it('should build a complete where clause when all filter fields are present', async () => {
      const filter = makeFilter();

      await repository.findRecent(filter);

      expect(lastWhere()).toStrictEqual(buildExpectedWhere(filter));
    });

    it('should return empty where when filter is undefined', async () => {
      await repository.findRecent(undefined);

      expect(lastWhere()).toStrictEqual({});
    });

    it('should return empty where when filter is empty object', async () => {
      await repository.findRecent({});

      expect(lastWhere()).toStrictEqual({});
    });

    // ── Datas ─────────────────────────────────────────────────────────────────
    it('should parse dates in DD/MM/YYYY format as UTC midnight', async () => {
      await repository.findRecent({
        dataInicial: '01/06/2025',
        dataFinal: '30/06/2025',
      });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: {
          gte: new Date('2025-06-01T00:00:00.000Z'),
          lte: new Date('2025-06-30T00:00:00.000Z'),
        },
      });
    });

    it('should include only gte when only dataInicial is provided', async () => {
      await repository.findRecent({ dataInicial: '01/06/2025' });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: { gte: new Date('2025-06-01T00:00:00.000Z') },
      });
    });

    it('should include only lte when only dataFinal is provided', async () => {
      await repository.findRecent({ dataFinal: '30/06/2025' });

      expect(lastWhere()).toStrictEqual({
        dia_disponibilidade: { lte: new Date('2025-06-30T00:00:00.000Z') },
      });
    });

    it('should not include dia_disponibilidade when both dates are undefined', async () => {
      await repository.findRecent(
        makeFilter({ dataInicial: undefined, dataFinal: undefined }),
      );

      expect(lastWhere()).not.toHaveProperty('dia_disponibilidade');
    });

    it('should not include dia_disponibilidade when dates are empty strings', async () => {
      await repository.findRecent(
        makeFilter({ dataInicial: '', dataFinal: '' }),
      );

      expect(lastWhere()).not.toHaveProperty('dia_disponibilidade');
    });

    // ── Arrays vazios ─────────────────────────────────────────────────────────
    it.each([
      ['idParceira', 'id_parceira'],
      ['maoObra', 'tipo_recurso_mao_obra'],
      ['equipe', 'tipo_recurso_equipe'],
      ['csd', 'disponibilizado_csd'],
    ] as const)(
      'should skip %s when array is empty',
      async (filterKey, whereKey) => {
        await repository.findRecent(makeFilter({ [filterKey]: [] }));

        expect(lastWhere()).not.toHaveProperty(whereKey);
      },
    );

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
        makeRecentRow('2025-06-10', 'Ana'),
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
  // getEmergencyTeamsWithValue
  // ═══════════════════════════════════════════════════════════════════════

  describe('getEmergencyTeamsWithValue', () => {
    const lastRawQuery = () => extractRawQuery(prisma.$queryRaw);

    const YEAR_CONDITION =
      'EXTRACT(YEAR FROM rc.dia_disponibilidade)::text = ?';
    const MONTH_CONDITION =
      'AND EXTRACT(MONTH FROM rc.dia_disponibilidade)::int = ?';

    // ── Execução ──────────────────────────────────────────────────────────────
    it('should call $queryRaw once and return its result unchanged', async () => {
      const rows = [
        makeEmergencyTeamRawRow({ tipo: 'EQUIPE_A' }),
        makeEmergencyTeamRawRow({ tipo: 'EQUIPE_B', quantidade: 1, valor: 0 }),
      ];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getEmergencyTeamsWithValue(
        makeFilter(),
        6,
      );

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBe(rows);
    });

    it('should pass a Prisma.Sql instance to $queryRaw', async () => {
      await repository.getEmergencyTeamsWithValue(makeFilter(), 6);

      expect(lastRawQuery().arg).toBeInstanceOf(Prisma.Sql);
    });

    // ── Estrutura da query ────────────────────────────────────────────────────
    it('should build the CTEs, the LEFT JOIN and the final grouping', async () => {
      await repository.getEmergencyTeamsWithValue(makeFilter(), 6);

      const { sql } = lastRawQuery();
      expect(sql).toContain('WITH equipes AS (');
      expect(sql).toContain('FROM public.recursos_contingencia rc');
      expect(sql).toContain('valores AS (');
      expect(sql).toContain('FROM public.capacidade_execucao');
      expect(sql).toContain('should_cost / 22 AS valor_diario');
      expect(sql).toContain(
        'LEFT JOIN valores v ON v.ano = e.ano AND v.tipo = e.tipo AND v.id_parceira = e.id_parceira',
      );
      expect(sql).toContain(
        'COALESCE(SUM(e.quantidade * v.valor_diario), 0) AS valor',
      );
      expect(sql).toMatch(
        /GROUP BY e\.ano, e\.mes, e\.tipo ORDER BY e\.ano, e\.mes, e\.tipo$/,
      );
    });

    it('should parameterize all values (no interpolation into the SQL text)', async () => {
      await repository.getEmergencyTeamsWithValue(
        makeFilter({ dataFinal: '30/06/2031', idParceira: [7771, 8881] }),
        9,
      );

      const { sql } = lastRawQuery();
      expect(sql).not.toContain('2031');
      expect(sql).not.toContain('7771');
      expect(sql).not.toContain('8881');
    });

    // ── Filtros ───────────────────────────────────────────────────────────────
    it('should apply year, month and partners in both CTEs with the right parameter order', async () => {
      await repository.getEmergencyTeamsWithValue(
        makeFilter({ dataFinal: '30/06/2025', idParceira: [1, 2] }),
        6,
      );

      const { sql, values } = lastRawQuery();
      expect(sql).toContain(YEAR_CONDITION);
      expect(sql).toContain(MONTH_CONDITION);
      expect(sql).toContain('AND rc.id_parceira IN (?,?)');
      expect(sql).toContain('ano::text = ?');
      expect(sql).toContain('AND id_turma IN (?,?)');
      // equipes: ano, mês, parceiras | valores: ano, parceiras
      expect(values).toStrictEqual(['2025', 6, 1, 2, '2025', 1, 2]);
    });

    it('should extract the year from dataFinal (DD/MM/YYYY), ignoring dataInicial', async () => {
      await repository.getEmergencyTeamsWithValue(
        makeFilter({
          dataInicial: '01/01/2023',
          dataFinal: '15/03/2024',
          idParceira: undefined,
        }),
      );

      expect(lastRawQuery().values).toStrictEqual(['2024', '2024']);
    });

    it.each([undefined, 0])(
      'should not filter by month when month is %s',
      async (month) => {
        await repository.getEmergencyTeamsWithValue(
          makeFilter({ idParceira: undefined }),
          month,
        );

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain(
          'EXTRACT(MONTH FROM rc.dia_disponibilidade)::int = ?',
        );
        expect(values).toStrictEqual(['2025', '2025']);
      },
    );

    it.each<[string, number[] | undefined]>([
      ['empty', []],
      ['undefined', undefined],
    ])(
      'should not filter by partner when idParceira is %s',
      async (_, idParceira) => {
        await repository.getEmergencyTeamsWithValue(
          makeFilter({ idParceira }),
          6,
        );

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain('rc.id_parceira IN');
        expect(sql).not.toContain('id_turma IN');
        expect(values).toStrictEqual(['2025', 6, '2025']);
      },
    );

    it('should ignore filter fields not used by this query', async () => {
      await repository.getEmergencyTeamsWithValue(
        makeFilter({ idParceira: undefined }), // maoObra, equipe e csd preenchidos
      );

      const { sql, values } = lastRawQuery();
      expect(values).toStrictEqual(['2025', '2025']);
      expect(sql).not.toMatch(/tipo_recurso_mao_obra|disponibilizado_csd/);
    });

    // ── Erros ─────────────────────────────────────────────────────────────────
    it('should propagate prisma exceptions', async () => {
      const error = new Error('raw query failed');
      prisma.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getEmergencyTeamsWithValue(makeFilter(), 6),
      ).rejects.toBe(error);
    });

    // ── Requer a correção da secção 3 ─────────────────────────────────────────
    describe('without a valid dataFinal', () => {
      it('should not throw and should not filter by year when filter is undefined', async () => {
        await repository.getEmergencyTeamsWithValue(undefined, 6);

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain(YEAR_CONDITION);
        expect(sql).not.toContain('ano::text = ?');
        expect(values).toStrictEqual([6]);
      });

      it.each(['2025-06-30', 'abc', '31/02/2025'])(
        'should not filter by year when dataFinal is invalid ("%s")',
        async (dataFinal) => {
          await repository.getEmergencyTeamsWithValue({ dataFinal });

          const { sql, values } = lastRawQuery();
          expect(sql).not.toContain(YEAR_CONDITION);
          expect(values).not.toContain('NaN');
        },
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // groupByField
  // ═══════════════════════════════════════════════════════════════════════

  describe('groupByField', () => {
    const baseSelect = {
      quantidade_mao_obra: true,
      quantidade_equipe: true,
      disponibilizado_csd: true,
    };

    const fields: readonly ContingencyGroupField[] = [
      'tipo_recurso_mao_obra',
      'tipo_recurso_equipe',
      'disponibilizado_csd',
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
          allocatedCsd: 0,
        },
        {
          name: 'EQUIPE_B',
          laborQuantity: 5,
          teamsQuantity: 1,
          allocatedCsd: 0,
        },
      ]);
    });

    it('should default null quantities to 0', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          tipo_recurso_mao_obra: 'ELETRICISTA',
          quantidade_mao_obra: null,
          quantidade_equipe: null,
          disponibilizado_csd: null,
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
          allocatedCsd: 0,
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
          allocatedCsd: 0,
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

    it('should use disponibilizado_csd value as name when grouping by csd', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([
        makeGroupByFieldFindManyRow({
          disponibilizado_csd: 'SIM',
          quantidade_mao_obra: 2,
        }),
        makeGroupByFieldFindManyRow({ disponibilizado_csd: null }), // descartada
      ]);

      const result = await repository.groupByField(
        'disponibilizado_csd',
        makeFilter(),
      );

      expect(result).toHaveLength(1);
      // allocatedCsd não é validado aqui de propósito — ver nota sobre o repository.
      expect(result[0]).toMatchObject({ name: 'SIM', laborQuantity: 2 });
    });

    it('should return empty array when no rows exist', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValueOnce([]);

      const result = await repository.groupByField(
        'disponibilizado_csd',
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

    it('should query turmas with empty array when groupBy returns no rows', async () => {
      prisma.recursos_contingencia.groupBy.mockResolvedValueOnce([]);

      await repository.groupByPartner(makeFilter());

      expect(prisma.turmas.findMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true, turma: true },
      });
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

    // ── Execução ──────────────────────────────────────────────────────────────
    it('should call $queryRaw once and return its result unchanged', async () => {
      const rows = [
        { ano: 2025, mes: 6, capacidade: 10, valor: 1500 },
        { ano: 2025, mes: 7, capacidade: 8, valor: 1200 },
      ];
      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await repository.getCapacityByYearMonth(
        { dataFinal: '30/06/2025' },
        6,
      );

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBe(rows); // mesma referência, sem transformação
    });

    it('should return empty array when $queryRaw returns no rows', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await repository.getCapacityByYearMonth({
        dataFinal: '30/06/2025',
      });

      expect(result).toStrictEqual([]);
    });

    it('should pass a Prisma.Sql instance (not a raw string) to $queryRaw', async () => {
      await repository.getCapacityByYearMonth({ dataFinal: '30/06/2025' }, 6);

      expect(lastRawQuery().arg).toBeInstanceOf(Prisma.Sql);
    });

    // ── Estrutura da query ────────────────────────────────────────────────────
    it('should build the base query with WHERE 1 = 1 and GROUP BY ano, mes', async () => {
      await repository.getCapacityByYearMonth({ dataFinal: '30/06/2025' });

      const { sql } = lastRawQuery();
      expect(sql).toContain('FROM construcao_sp.capacidade_execucao ce');
      expect(sql).toContain('JOIN construcao_sp.turmas t ON t.id = id_turma');
      expect(sql).toContain('WHERE 1 = 1');
      expect(sql).toMatch(/GROUP BY ano, m\.mes$/);
    });

    it('should parameterize all values (no interpolation into the SQL text)', async () => {
      await repository.getCapacityByYearMonth(
        { dataFinal: '30/06/2025', idParceira: [77, 88] },
        9,
      );

      const { sql } = lastRawQuery();
      expect(sql).not.toContain('2025');
      expect(sql).not.toContain('77');
      expect(sql).not.toContain('88');
    });

    // ── Filtro: ano ───────────────────────────────────────────────────────────
    it('should filter by the year extracted from dataFinal (DD/MM/YYYY)', async () => {
      await repository.getCapacityByYearMonth({ dataFinal: '15/03/2024' });

      const { sql, values } = lastRawQuery();
      expect(sql).toContain('WHERE 1 = 1 AND ano = ?');
      expect(values).toStrictEqual(['2024']);
    });

    // ── Filtro: mês ───────────────────────────────────────────────────────────
    it('should filter by month when provided', async () => {
      await repository.getCapacityByYearMonth({ dataFinal: '30/06/2025' }, 4);

      const { sql, values } = lastRawQuery();
      expect(sql).toContain('AND ano = ? AND m.mes = ?');
      expect(values).toStrictEqual(['2025', 4]);
    });

    it.each([undefined, 0])(
      'should not filter by month when month is %s',
      async (month) => {
        await repository.getCapacityByYearMonth(
          { dataFinal: '30/06/2025' },
          month,
        );

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain('AND m.mes =');
        expect(values).toStrictEqual(['2025']);
      },
    );

    // ── Filtro: parceira ──────────────────────────────────────────────────────
    it('should filter by idParceira using IN with one placeholder per id', async () => {
      await repository.getCapacityByYearMonth(
        { dataFinal: '30/06/2025', idParceira: [1, 2, 3] },
        6,
      );

      const { sql, values } = lastRawQuery();
      expect(sql).toContain('AND m.mes = ? AND t.id IN (?,?,?)');
      expect(values).toStrictEqual(['2025', 6, 1, 2, 3]);
    });

    it.each<[string, number[] | undefined]>([
      ['empty', []],
      ['undefined', undefined],
    ])(
      'should not filter by idParceira when it is %s',
      async (_, idParceira) => {
        await repository.getCapacityByYearMonth({
          dataFinal: '30/06/2025',
          idParceira,
        });

        expect(lastRawQuery().sql).not.toContain('t.id IN');
      },
    );

    it('should ignore filter fields not used by this query', async () => {
      await repository.getCapacityByYearMonth(
        makeFilter({ idParceira: undefined }), // maoObra, equipe, csd, dataInicial preenchidos
      );

      const { sql, values } = lastRawQuery();
      expect(values).toStrictEqual(['2025']);
      expect(sql).not.toMatch(
        /tipo_recurso|disponibilizado_csd|dia_disponibilidade/,
      );
    });

    // ── Erros ─────────────────────────────────────────────────────────────────
    it('should propagate prisma exceptions', async () => {
      const error = new Error('raw query failed');
      prisma.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getCapacityByYearMonth({ dataFinal: '30/06/2025' }, 1),
      ).rejects.toThrow(error);
    });

    // ── Entradas inválidas / ausentes (requer a correção da secção 3) ───────
    describe('without a valid dataFinal', () => {
      it('should not throw and should not filter by year when filter is undefined', async () => {
        await repository.getCapacityByYearMonth(undefined, 6);

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain('AND ano =');
        expect(values).toStrictEqual([6]);
      });

      it('should not filter by year when dataFinal is missing', async () => {
        await repository.getCapacityByYearMonth({ idParceira: [1] });

        const { sql, values } = lastRawQuery();
        expect(sql).not.toContain('AND ano =');
        expect(values).toStrictEqual([1]);
      });

      it.each(['2025-06-30', 'abc', '31/02/2025'])(
        'should not filter by year when dataFinal is invalid ("%s")',
        async (dataFinal) => {
          await repository.getCapacityByYearMonth({ dataFinal });

          const { sql, values } = lastRawQuery();
          expect(sql).not.toContain('AND ano =');
          expect(values).not.toContain('NaN');
        },
      );
    });
  });
});
