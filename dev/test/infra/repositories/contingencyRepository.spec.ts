import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContingencyFilter } from 'src/domain/types';
import { toRepositoryError } from 'src/infra/errors/prismaError.handler';
import { RepositoryError } from 'src/infra/errors/repository.error';
import {
  toCapacityByYearMonth,
  toContingencyGroupItem,
  toContingencyResourceDispatchesRow,
  toCreateContingencyInput,
  toCsdQuantityItem,
  toEmergencyTeam,
  toPartnerQuantityItems,
  toRecentContingency,
} from 'src/infra/mappers/contingencyResources.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ContingencyRepository } from 'src/infra/repositories/contingencyRepository';

// ─── Module mocks ────────────────────────────────────────────────────────────

// Lightweight stand-in for Prisma's SQL helpers so queries can be inspected.
vi.mock('src/infra/generated/prisma/client', () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: [...strings],
      values,
    }),
    join: (values: unknown[], sep = ',') => ({ join: values, sep }),
    empty: { empty: true },
  },
}));

vi.mock('src/infra/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

vi.mock('src/infra/errors/prismaError.handler', () => ({
  toRepositoryError: vi.fn(),
}));

vi.mock('src/infra/mappers/contingencyResources.mapper', () => ({
  GROUP_FIELD_COLUMN: {
    csd: 'disponibilizado_csd',
    equipe: 'tipo_recurso_equipe',
  },
  toCapacityByYearMonth: vi.fn(),
  toContingencyGroupItem: vi.fn(),
  toContingencyResourceDispatchesRow: vi.fn(),
  toCreateContingencyInput: vi.fn(),
  toCsdQuantityItem: vi.fn(),
  toEmergencyTeam: vi.fn(),
  toPartnerQuantityItems: vi.fn(),
  toRecentContingency: vi.fn(),
}));

vi.mock('src/infra/types', () => ({
  CSD_QUANTITY_SELECT: { csd: true },
  FIND_CONTINGENCY_RESOURCE_DISPATCHES_SELECT: { dispatch: true },
  GROUP_BY_FIELD_SELECT: { group: true },
  PARTNER_NAME_SELECT: { nome: true },
  PARTNER_QUANTITY_SELECT: { partner: true },
  RECENT_CONTINGENCY_SELECT: { recent: true },
}));

// ─── SQL inspection helpers ──────────────────────────────────────────────────

const sqlText = (node: any): string => {
  if (node?.strings) {
    return node.strings
      .reduce(
        (acc: string, str: string, i: number) =>
          acc + str + (i < node.values.length ? sqlText(node.values[i]) : ''),
        '',
      )
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (node?.join) return node.join.map(sqlText).join(node.sep);
  if (node?.empty) return '';
  return '$';
};

const sqlValues = (node: any): unknown[] => {
  if (node?.strings) return node.values.flatMap(sqlValues);
  if (node?.join) return node.join.flatMap(sqlValues);
  if (node?.empty) return [];
  return [node];
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ContingencyRepository', () => {
  const prisma = {
    recursos_contingencia: { create: vi.fn(), findMany: vi.fn() },
    turmas: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  };

  let repository: ContingencyRepository;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    vi.mocked(toRepositoryError).mockImplementation((error, operation) =>
      error instanceof RepositoryError
        ? error
        : new RepositoryError(
            'database failure',
            'UNKNOWN' as never,
            operation,
          ),
    );

    repository = new ContingencyRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should persist the mapped contingency data', async () => {
      const data = { idParceira: 7, idUsuario: 3 } as never;
      vi.mocked(toCreateContingencyInput).mockReturnValue({
        mapped: true,
      } as never);
      prisma.recursos_contingencia.create.mockResolvedValue(undefined);

      await expect(repository.create(data)).resolves.toBeUndefined();

      expect(toCreateContingencyInput).toHaveBeenCalledWith(data);
      expect(prisma.recursos_contingencia.create).toHaveBeenCalledWith({
        data: { mapped: true },
      });
    });

    it('should log and rethrow a RepositoryError when the insert fails', async () => {
      prisma.recursos_contingencia.create.mockRejectedValue(
        new Error('insert failed'),
      );

      await expect(
        repository.create({ idParceira: 1, idUsuario: 2 } as never),
      ).rejects.toMatchObject({
        message: 'database failure',
      });

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[create] UNKNOWN: database failure'),
        expect.any(String),
      );
      expect(errorSpy.mock.calls[0][0]).toContain('"idParceira":1');
    });

    it('should tolerate nullish data when building the error context', async () => {
      prisma.recursos_contingencia.create.mockRejectedValue(new Error('boom'));

      await expect(
        repository.create(undefined as never),
      ).rejects.toBeInstanceOf(RepositoryError);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // ─── findRecent ────────────────────────────────────────────────────────────

  describe('findRecent', () => {
    it('should query with an empty where clause and map the rows when no filter is given', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      vi.mocked(toRecentContingency).mockImplementation(
        (row: never) => ({ mapped: row }) as never,
      );

      const result = await repository.findRecent();

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { criado_em: 'desc' },
        select: { recent: true },
      });
      expect(result).toEqual([{ mapped: { id: 1 } }, { mapped: { id: 2 } }]);
    });

    it('should build the where clause from every filter field', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await repository.findRecent({
        mesInicial: '2025-01',
        mesFinal: '2025-03',
        idParceira: [1, 2],
        maoObra: ['A'],
        equipe: ['B'],
        csd: ['C'],
      } as ContingencyFilter);

      expect(
        prisma.recursos_contingencia.findMany.mock.calls[0][0].where,
      ).toEqual({
        dia_disponibilidade: {
          gte: new Date('2025-01-01'),
          lt: new Date('2025-04-01'),
        },
        id_parceira: { in: [1, 2] },
        tipo_recurso_mao_obra: { in: ['A'] },
        tipo_recurso_equipe: { in: ['B'] },
        disponibilizado_csd: { in: ['C'] },
      });
    });

    it('should apply only the lower bound when just mesInicial is provided', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await repository.findRecent({
        mesInicial: '2025-05',
      } as ContingencyFilter);

      expect(
        prisma.recursos_contingencia.findMany.mock.calls[0][0].where,
      ).toEqual({
        dia_disponibilidade: { gte: new Date('2025-05-01') },
      });
    });

    it('should apply only the exclusive upper bound when just mesFinal is provided', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await repository.findRecent({ mesFinal: '2025-12' } as ContingencyFilter);

      expect(
        prisma.recursos_contingencia.findMany.mock.calls[0][0].where,
      ).toEqual({
        dia_disponibilidade: { lt: new Date('2026-01-01') },
      });
    });

    it('should ignore empty array filters', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await repository.findRecent({
        idParceira: [],
        maoObra: [],
        equipe: [],
        csd: [],
      } as ContingencyFilter);

      expect(
        prisma.recursos_contingencia.findMany.mock.calls[0][0].where,
      ).toEqual({});
    });

    it('should reject with INVALID_DATA and log a warning when mesInicial has an invalid format', async () => {
      await expect(
        repository.findRecent({ mesInicial: '01/2025' } as ContingencyFilter),
      ).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: expect.stringContaining('mesInicial inválido: "01/2025"'),
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[findRecent] INVALID_DATA'),
        expect.any(String),
      );
      expect(errorSpy).not.toHaveBeenCalled();
      expect(prisma.recursos_contingencia.findMany).not.toHaveBeenCalled();
    });

    it('should reject with INVALID_DATA when mesFinal has an invalid format', async () => {
      await expect(
        repository.findRecent({ mesFinal: 'not-a-date' } as ContingencyFilter),
      ).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: expect.stringContaining('mesFinal inválido'),
      });
    });

    it('should reject with INVALID_DATA when mesInicial is after mesFinal', async () => {
      await expect(
        repository.findRecent({
          mesInicial: '2025-06',
          mesFinal: '2025-01',
        } as ContingencyFilter),
      ).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: 'mesInicial não pode ser posterior a mesFinal.',
      });
    });
  });

  // ─── groupByField ──────────────────────────────────────────────────────────

  describe('groupByField', () => {
    it('should group rows by the mapped column and drop null items', async () => {
      const rows = [{ a: 1 }, { a: 2 }, { a: 3 }];
      prisma.recursos_contingencia.findMany.mockResolvedValue(rows);
      vi.mocked(toContingencyGroupItem)
        .mockReturnValueOnce({ name: 'x', value: 1 } as never)
        .mockReturnValueOnce(null as never)
        .mockReturnValueOnce({ name: 'y', value: 2 } as never);

      const result = await repository.groupByField('csd' as never);

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: {},
        select: { group: true },
      });
      expect(toContingencyGroupItem).toHaveBeenCalledWith(
        rows[0],
        'disponibilizado_csd',
      );
      expect(result).toEqual([
        { name: 'x', value: 1 },
        { name: 'y', value: 2 },
      ]);
    });

    it('should forward the filter to the where clause', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await repository.groupByField(
        'equipe' as never,
        { idParceira: [9] } as ContingencyFilter,
      );

      expect(
        prisma.recursos_contingencia.findMany.mock.calls[0][0].where,
      ).toEqual({
        id_parceira: { in: [9] },
      });
    });

    it('should throw INVALID_DATA when the group field is unknown', async () => {
      await expect(
        repository.groupByField('unknown' as never),
      ).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: 'Campo de agrupamento inválido: unknown',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"field":"unknown"'),
        expect.any(String),
      );
      expect(prisma.recursos_contingencia.findMany).not.toHaveBeenCalled();
    });
  });

  // ─── groupByPartner ────────────────────────────────────────────────────────

  describe('groupByPartner', () => {
    it('should return an empty list without querying partners when there are no rows', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([]);

      await expect(repository.groupByPartner()).resolves.toEqual([]);

      expect(prisma.turmas.findMany).not.toHaveBeenCalled();
      expect(toPartnerQuantityItems).not.toHaveBeenCalled();
    });

    it('should fetch distinct partners and map rows together with them', async () => {
      const rows = [{ id_parceira: 1 }, { id_parceira: 2 }, { id_parceira: 1 }];
      const partners = [
        { id: 1, nome: 'A' },
        { id: 2, nome: 'B' },
      ];
      const mapped = [{ name: 'A', value: 1 }];
      prisma.recursos_contingencia.findMany.mockResolvedValue(rows);
      prisma.turmas.findMany.mockResolvedValue(partners);
      vi.mocked(toPartnerQuantityItems).mockReturnValue(mapped as never);

      const result = await repository.groupByPartner();

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: {},
        select: { partner: true },
      });
      expect(prisma.turmas.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: { nome: true },
      });
      expect(toPartnerQuantityItems).toHaveBeenCalledWith(rows, partners);
      expect(result).toBe(mapped);
    });
  });

  // ─── groupByCsd ────────────────────────────────────────────────────────────

  describe('groupByCsd', () => {
    it('should map every row to a CSD quantity item', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      vi.mocked(toCsdQuantityItem).mockImplementation(
        (row: never) => ({ csd: row }) as never,
      );

      const result = await repository.groupByCsd();

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: {},
        select: { csd: true },
      });
      expect(result).toEqual([{ csd: { id: 1 } }, { csd: { id: 2 } }]);
    });

    it('should log an error and rethrow when the query fails', async () => {
      prisma.recursos_contingencia.findMany.mockRejectedValue(
        new Error('down'),
      );

      await expect(
        repository.groupByCsd({ csd: ['X'] } as ContingencyFilter),
      ).rejects.toBeInstanceOf(RepositoryError);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[groupByCsd]'),
        expect.any(String),
      );
    });
  });

  // ─── getCapacityByYearMonth ────────────────────────────────────────────────

  describe('getCapacityByYearMonth', () => {
    it('should run the raw query without a WHERE clause when no filter is given', async () => {
      prisma.$queryRaw.mockResolvedValue([{ ano: 2025 }]);
      vi.mocked(toCapacityByYearMonth).mockImplementation(
        (row: never) => ({ mapped: row }) as never,
      );

      const result = await repository.getCapacityByYearMonth();

      const query = prisma.$queryRaw.mock.calls[0][0];
      expect(sqlText(query)).not.toContain('WHERE');
      expect(sqlText(query)).toContain('GROUP BY ce.ano, m.mes');
      expect(sqlValues(query)).toEqual([]);
      expect(result).toEqual([{ mapped: { ano: 2025 } }]);
    });

    it('should add period and partner conditions when all filters are provided', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getCapacityByYearMonth({
        mesInicial: '2025-01',
        mesFinal: '2025-03',
        idParceira: [1, 2],
      } as ContingencyFilter);

      const query = prisma.$queryRaw.mock.calls[0][0];
      const text = sqlText(query);
      expect(text).toContain(
        'WHERE make_date(ce.ano::int, m.mes, 1) >= $::date AND',
      );
      expect(text).toContain(
        'make_date(ce.ano::int, m.mes, 1) < $::date AND t.id IN ($,$)',
      );
      expect(sqlValues(query)).toEqual(['2025-01-01', '2025-04-01', 1, 2]);
    });

    it('should skip the partner condition when idParceira is an empty array', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getCapacityByYearMonth({
        mesInicial: '2025-01',
        idParceira: [],
      } as ContingencyFilter);

      const query = prisma.$queryRaw.mock.calls[0][0];
      expect(sqlText(query)).not.toContain('t.id IN');
      expect(sqlValues(query)).toEqual(['2025-01-01']);
    });
  });

  // ─── getEmergencyTeamsWithValue ────────────────────────────────────────────

  describe('getEmergencyTeamsWithValue', () => {
    it('should run the query without any conditions when no filter is given', async () => {
      prisma.$queryRaw.mockResolvedValue([{ ano: 2025 }]);
      vi.mocked(toEmergencyTeam).mockImplementation(
        (row: never) => ({ team: row }) as never,
      );

      const result = await repository.getEmergencyTeamsWithValue();

      const query = prisma.$queryRaw.mock.calls[0][0];
      expect(sqlText(query)).not.toContain('WHERE');
      expect(sqlValues(query)).toEqual([]);
      expect(result).toEqual([{ team: { ano: 2025 } }]);
    });

    it('should apply every filter to both the teams and the values CTEs', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getEmergencyTeamsWithValue({
        mesInicial: '2025-01',
        mesFinal: '2025-03',
        idParceira: [1],
        equipe: ['A'],
        csd: ['X'],
      } as ContingencyFilter);

      const query = prisma.$queryRaw.mock.calls[0][0];
      const text = sqlText(query);

      expect(text).toContain('rc.dia_disponibilidade >= $::date');
      expect(text).toContain('rc.dia_disponibilidade < $::date');
      expect(text).toContain('rc.id_parceira IN ($)');
      expect(text).toContain('rc.tipo_recurso_equipe IN ($)');
      expect(text).toContain('rc.disponibilizado_csd IN ($)');
      expect(text).toContain('ano::int >= $');
      expect(text).toContain('ano::int <= $');
      expect(text).toContain('id_turma IN ($)');
      expect(text).toContain('tipo IN ($)');

      expect(sqlValues(query)).toEqual([
        '2025-01-01',
        '2025-04-01',
        1,
        'A',
        'X',
        2025,
        2025,
        1,
        'A',
      ]);
    });

    it('should treat empty array filters as absent', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getEmergencyTeamsWithValue({
        idParceira: [],
        equipe: [],
        csd: [],
      } as ContingencyFilter);

      const query = prisma.$queryRaw.mock.calls[0][0];
      expect(sqlText(query)).not.toContain('WHERE');
      expect(sqlValues(query)).toEqual([]);
    });

    it('should support a period with only the start month', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getEmergencyTeamsWithValue({
        mesInicial: '2025-02',
      } as ContingencyFilter);

      expect(sqlValues(prisma.$queryRaw.mock.calls[0][0])).toEqual([
        '2025-02-01',
        2025,
      ]);
    });

    it('should support a period with only the end month', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.getEmergencyTeamsWithValue({
        mesFinal: '2025-02',
      } as ContingencyFilter);

      expect(sqlValues(prisma.$queryRaw.mock.calls[0][0])).toEqual([
        '2025-03-01',
        2025,
      ]);
    });
  });

  // ─── findContingencyResourceDispatches ─────────────────────────────────────

  describe('findContingencyResourceDispatches', () => {
    it('should map the dispatch rows', async () => {
      prisma.recursos_contingencia.findMany.mockResolvedValue([{ id: 1 }]);
      vi.mocked(toContingencyResourceDispatchesRow).mockImplementation(
        (row: never) => ({ dispatch: row }) as never,
      );

      const result = await repository.findContingencyResourceDispatches();

      expect(prisma.recursos_contingencia.findMany).toHaveBeenCalledWith({
        where: {},
        select: { dispatch: true },
      });
      expect(result).toEqual([{ dispatch: { id: 1 } }]);
    });
  });

  // ─── Private helpers ───────────────────────────────────────────────────────

  describe('execute (error handling)', () => {
    const run = (...args: unknown[]) => (repository as any).execute(...args);

    it('should return the value produced by the operation', async () => {
      await expect(run('op', async () => 42)).resolves.toBe(42);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should omit the context suffix when no context is provided', async () => {
      await expect(
        run('op', async () => {
          throw new Error('fail');
        }),
      ).rejects.toBeInstanceOf(RepositoryError);

      expect(errorSpy).toHaveBeenCalledWith(
        '[op] UNKNOWN: database failure',
        expect.any(String),
      );
    });

    it('should log a warning for NOT_FOUND errors', async () => {
      vi.mocked(toRepositoryError).mockReturnValue(
        new RepositoryError('missing', 'NOT_FOUND' as never, 'op'),
      );

      await expect(
        run(
          'op',
          async () => {
            throw new Error('x');
          },
          { id: 1 },
        ),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });

      expect(warnSpy).toHaveBeenCalledWith(
        '[op] NOT_FOUND: missing | contexto: {"id":1}',
        expect.any(String),
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should pass an undefined stack when a non-Error value is thrown', async () => {
      await expect(
        run('op', async () => {
          throw 'plain string';
        }),
      ).rejects.toBeInstanceOf(RepositoryError);

      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), undefined);
    });

    it('should fall back to a placeholder when the context cannot be serialized', async () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      await expect(
        run(
          'op',
          async () => {
            throw new Error('x');
          },
          circular,
        ),
      ).rejects.toBeInstanceOf(RepositoryError);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('| contexto: [contexto não serializável]'),
        expect.any(String),
      );
    });
  });

  describe('buildWhere / resolvePeriod defaults', () => {
    const repo = () => repository as any;

    it('should build an empty where clause when called without arguments', () => {
      expect(repo().buildWhere()).toEqual({});
    });

    it('should resolve an all-null period when called without arguments', () => {
      expect(repo().resolvePeriod()).toEqual({
        start: null,
        endExclusive: null,
        startYear: null,
        endYear: null,
      });
    });

    it('should resolve start, exclusive end and years for a valid period', () => {
      expect(
        repo().resolvePeriod({ mesInicial: '2024-11', mesFinal: '2024-12' }),
      ).toEqual({
        start: '2024-11-01',
        endExclusive: '2025-01-01',
        startYear: 2024,
        endYear: 2024,
      });
    });

    it('should accept a period where both months are equal', () => {
      expect(
        repo().resolvePeriod({ mesInicial: '2025-04', mesFinal: '2025-04' }),
      ).toMatchObject({
        start: '2025-04-01',
        endExclusive: '2025-05-01',
      });
    });
  });

  describe('toWhere', () => {
    const toWhere = (conditions: unknown[]) =>
      (repository as any).toWhere(conditions);

    it('should return an empty fragment when there are no conditions', () => {
      expect(toWhere([])).toEqual({ empty: true });
    });

    it('should join conditions with AND when present', () => {
      const result = toWhere([
        { strings: ['a = 1'], values: [] },
        { strings: ['b = 2'], values: [] },
      ]);

      expect(sqlText(result)).toBe('WHERE a = 1 AND b = 2');
    });
  });
});
