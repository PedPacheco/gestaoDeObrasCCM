import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ───────────────────────────────────────────────────────────
// Prisma.sql / Prisma.join are replaced by tiny fakes so we can inspect the
// SQL fragments and values the repository builds. Everything else
// (PrismaClient, error classes, enums…) comes from the real generated client.
vi.mock('src/infra/generated/prisma/client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('src/infra/generated/prisma/client')>();
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
        strings,
        values,
      }),
      join: (items: unknown[]) => ({ joined: items }),
    },
  };
});

vi.mock('src/domain/entities/works.entity', () => ({
  MarketWork: {
    create: vi.fn((props: Record<string, unknown>) => ({
      ...props,
      __isMarketWork: true,
    })),
  },
}));

import { MarketWork } from 'src/domain/entities/works.entity';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';

// ─── Test helpers ───────────────────────────────────────────────────────────

const createPrismaMock = () => ({
  base_auxiliar: {
    findMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  base_auxiliar_ov: {
    findMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  municipios: { findMany: vi.fn() },
  tipos: { findMany: vi.fn() },
  circuitos: { findMany: vi.fn() },
  cn52n: { createMany: vi.fn() },
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
});

const createLoggerMock = () => ({
  warn: vi.fn(),
  error: vi.fn(),
});

/**
 * Awaits a promise while draining any pending fake timers, and returns the
 * outcome without letting a rejection escape as an unhandled rejection.
 */
const settle = async <T>(promise: Promise<T>) => {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  return outcome;
};

describe('AuxiliaryBaseRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let logger: ReturnType<typeof createLoggerMock>;
  let repository: AuxiliaryBaseRepository;

  const withRetry = <T>(operation: () => Promise<T>): Promise<T> =>
    (repository as any).withRetry(operation);

  beforeEach(() => {
    prisma = createPrismaMock();
    logger = createLoggerMock();
    repository = new AuxiliaryBaseRepository(prisma as never, logger as never);
    vi.mocked(MarketWork.create).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ─── withRetry ────────────────────────────────────────────────────────────

  describe('withRetry (private helper)', () => {
    it('returns the result immediately when the operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue('ok');

      await expect(withRetry(operation)).resolves.toBe('ok');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it.each(['P1001', 'P1002', 'P1008', 'P1017'])(
      'retries when the Prisma connection error code is %s',
      async (code) => {
        vi.useFakeTimers();
        const operation = vi
          .fn()
          .mockRejectedValueOnce({ code, message: 'boom' })
          .mockResolvedValue('recovered');

        const result = await settle(withRetry(operation));

        expect(result).toEqual({ ok: true, value: 'recovered' });
        expect(operation).toHaveBeenCalledTimes(2);
        expect(logger.warn).toHaveBeenCalledTimes(1);
      },
    );

    it.each([
      'Server has closed the connection',
      'Connection refused',
      'connection timed out',
      'ECONNRESET',
      'socket hang up',
    ])(
      'retries (case-insensitively) when the message contains "%s"',
      async (message) => {
        vi.useFakeTimers();
        const operation = vi
          .fn()
          .mockRejectedValueOnce({ message })
          .mockResolvedValue('recovered');

        const result = await settle(withRetry(operation));

        expect(result).toEqual({ ok: true, value: 'recovered' });
        expect(operation).toHaveBeenCalledTimes(2);
      },
    );

    it('uses exponential backoff (300ms, then 600ms) between attempts', async () => {
      vi.useFakeTimers();
      const operation = vi
        .fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'first' })
        .mockRejectedValueOnce({ code: 'P1001', message: 'second' })
        .mockResolvedValue('ok');

      const promise = withRetry(operation);

      await vi.advanceTimersByTimeAsync(299);
      expect(operation).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(operation).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(599);
      expect(operation).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toBe('ok');
      expect(operation).toHaveBeenCalledTimes(3);

      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Tentativa 1/3'),
      );
      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('300ms'),
      );
      expect(logger.warn).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Tentativa 2/3'),
      );
      expect(logger.warn).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('600ms'),
      );
    });

    it('rethrows the last error once every attempt has failed', async () => {
      vi.useFakeTimers();
      const error = { code: 'P1017', message: 'server has closed' };
      const operation = vi.fn().mockRejectedValue(error);

      const result = await settle(withRetry(operation));

      expect(result).toEqual({ ok: false, error });
      expect(operation).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on errors that are not connection related', async () => {
      const error = { code: 'P2002', message: 'Unique constraint failed' };
      const operation = vi.fn().mockRejectedValue(error);

      await expect(withRetry(operation)).rejects.toBe(error);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('treats an error without message and code as non-retryable', async () => {
      const error = {};
      const operation = vi.fn().mockRejectedValue(error);

      await expect(withRetry(operation)).rejects.toBe(error);

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('treats an error with only a code (no message) as retryable when the code matches', async () => {
      vi.useFakeTimers();
      const operation = vi
        .fn()
        .mockRejectedValueOnce({ code: 'P1002' })
        .mockResolvedValue('ok');

      const result = await settle(withRetry(operation));

      expect(result).toEqual({ ok: true, value: 'ok' });
    });
  });

  // ─── getAuxiliaryBaseNotes ────────────────────────────────────────────────

  describe('getAuxiliaryBaseNotes', () => {
    it('filters by regional id when it is provided', async () => {
      const rows = [{ id: 1, obra: 'A' }];
      prisma.base_auxiliar.findMany.mockResolvedValue(rows);

      const result = await repository.getAuxiliaryBaseNotes(5);

      expect(result).toBe(rows);
      expect(prisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 5 } },
          select: expect.objectContaining({
            id: true,
            obra: true,
            pep: true,
            eh_rda: true,
          }),
        }),
      );
    });

    it('does not filter by regional when the id is undefined', async () => {
      prisma.base_auxiliar.findMany.mockResolvedValue([]);

      await repository.getAuxiliaryBaseNotes();

      expect(prisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: undefined } },
        }),
      );
    });

    it('treats a regional id of 0 as "no filter"', async () => {
      prisma.base_auxiliar.findMany.mockResolvedValue([]);

      await repository.getAuxiliaryBaseNotes(0);

      expect(prisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: undefined } },
        }),
      );
    });
  });

  // ─── getAuxiliaryBaseMarket ───────────────────────────────────────────────

  describe('getAuxiliaryBaseMarket', () => {
    const dbRow = {
      id: BigInt(10),
      obra: 'OBRA-1',
      pep: 'PEP-1',
      diagrama: 'D-1',
      prazo_texto: '30 days',
      entrada: new Date('2026-01-01T00:00:00Z'),
      status_ov: 1,
      status_diagrama: 'OK',
      status_pep: 'OK',
      mo_cliente: 100,
      mo_empresa: 200,
      aux_circuito: 3,
      aux_municipio: 4,
      aux_turma: 5,
      aux_tipo_obra: 6,
      equip_num_pedido: 'PED-1',
      observacao: 'note',
    };

    it('maps database rows into MarketWork entities (filtering by regional)', async () => {
      prisma.base_auxiliar_ov.findMany.mockResolvedValue([dbRow]);

      const result = await repository.getAuxiliaryBaseMarket(2);

      expect(prisma.base_auxiliar_ov.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 2 } },
        }),
      );
      expect(MarketWork.create).toHaveBeenCalledTimes(1);
      expect(MarketWork.create).toHaveBeenCalledWith({
        obra: 'OBRA-1',
        pep: 'PEP-1',
        entrada: dbRow.entrada,
        prazoTexto: '30 days',
        equipeNumPedido: 'PED-1',
        idMunicipio: 4,
        idTipo: 6,
        idParceira: 5,
        idCircuito: 3,
        diagrama: 'D-1',
        observacao: 'note',
        statusOv: 1,
        statusDiagrama: 'OK',
        statusPep: 'OK',
        moCliente: 100,
        moEmpresa: 200,
        id: 10,
      });
      expect(result).toEqual([
        expect.objectContaining({ __isMarketWork: true, id: 10 }),
      ]);
    });

    it('queries without a regional filter when no id is given', async () => {
      prisma.base_auxiliar_ov.findMany.mockResolvedValue([]);

      const result = await repository.getAuxiliaryBaseMarket();

      expect(result).toEqual([]);
      expect(prisma.base_auxiliar_ov.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: undefined } },
        }),
      );
      expect(MarketWork.create).not.toHaveBeenCalled();
    });
  });

  // ─── getAuxiliaryBaseCN52N ────────────────────────────────────────────────

  describe('getAuxiliaryBaseCN52N', () => {
    it('returns the rows produced by the raw query', async () => {
      const rows = [{ id_obra: 1, ovnota: 'N1' }];
      prisma.$queryRaw.mockResolvedValue(rows);

      const result = await repository.getAuxiliaryBaseCN52N();

      expect(result).toBe(rows);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const [strings] = prisma.$queryRaw.mock.calls[0];
      expect(strings.join('')).toContain('FROM cn52n');
      expect(strings.join('')).toContain('INNER JOIN obras');
    });
  });

  // ─── getFator ─────────────────────────────────────────────────────────────

  describe('getFator', () => {
    it('returns an empty map without querying when the input is empty', async () => {
      const result = await repository.getFator([]);

      expect(result.size).toBe(0);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('ignores definitions with a null/undefined material or pep_ref', async () => {
      const result = await repository.getFator([
        { material: null as any, pep_ref: 'P1' },
        { material: 'M1', pep_ref: undefined as any },
        { material: undefined as any, pep_ref: null as any },
      ]);

      expect(result.size).toBe(0);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('queries by (material, pep_ref) pairs, de-duplicating them', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { material: 'M1', pep_ref: 'P1', fator: 2 },
        { material: 'M2', pep_ref: 'P2', fator: '1.5' },
        { material: 'M3', pep_ref: 'P3', fator: null },
      ]);

      const result = await repository.getFator([
        { material: 'M1', pep_ref: 'P1' },
        { material: 'M1', pep_ref: 'P1' }, // duplicate
        { material: 'M2', pep_ref: 'P2' },
        { material: 'M3', pep_ref: 'P3' },
      ]);

      const [, materials, pepRefs] = prisma.$queryRaw.mock.calls[0];
      expect(materials).toEqual(['M1', 'M2', 'M3']);
      expect(pepRefs).toEqual(['P1', 'P2', 'P3']);

      expect(result.get('M1|P1')).toBe(2);
      expect(result.get('M2|P2')).toBe(1.5); // coerced with Number()
      expect(result.has('M3|P3')).toBe(false); // null factor is skipped
      expect(result.size).toBe(2);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes a single baseOv record when an id is provided', async () => {
      prisma.base_auxiliar_ov.delete.mockResolvedValue({ id: 7 });

      const result = await repository.delete('baseOv', 7);

      expect(result).toEqual({ id: 7 });
      expect(prisma.base_auxiliar_ov.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(prisma.base_auxiliar_ov.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes every baseOv record when no id is provided', async () => {
      prisma.base_auxiliar_ov.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repository.delete('baseOv');

      expect(result).toEqual({ count: 3 });
      expect(prisma.base_auxiliar_ov.deleteMany).toHaveBeenCalledWith();
      expect(prisma.base_auxiliar_ov.delete).not.toHaveBeenCalled();
    });

    it('deletes a single base_auxiliar record for any other table when an id is provided', async () => {
      prisma.base_auxiliar.delete.mockResolvedValue({ id: 9 });

      const result = await repository.delete('baseNotes', 9);

      expect(result).toEqual({ id: 9 });
      expect(prisma.base_auxiliar.delete).toHaveBeenCalledWith({
        where: { id: 9 },
      });
      expect(prisma.base_auxiliar.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes every base_auxiliar record for any other table when no id is provided', async () => {
      prisma.base_auxiliar.deleteMany.mockResolvedValue({ count: 12 });

      const result = await repository.delete('baseNotes');

      expect(result).toEqual({ count: 12 });
      expect(prisma.base_auxiliar.deleteMany).toHaveBeenCalledWith();
      expect(prisma.base_auxiliar.delete).not.toHaveBeenCalled();
    });

    it('logs the error stack and rethrows when the deletion fails', async () => {
      const error = Object.assign(new Error('delete failed'), {
        stack: 'fake-stack',
      });
      prisma.base_auxiliar.deleteMany.mockRejectedValue(error);

      await expect(repository.delete('baseNotes')).rejects.toBe(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao excluir obra: ',
        'fake-stack',
      );
    });
  });

  // ─── insertMarket ─────────────────────────────────────────────────────────

  describe('insertMarket', () => {
    const baseItem = {
      obra: 'OBRA-1',
      pep: 'PEP-1',
      diagrama: 'D-1',
      gpm: 'Campinas',
      tipo: 'Expansion',
      circuito: 'CIR-1',
      prazoTexto: '30 days',
      statusOv: '2',
      statusDiagrama: 'OK',
      statusPep: 'OK',
      equipeNumPedido: 'PED-1',
      moCliente: 10,
      moEmpresa: 20,
      entrada: '2026-03-15T00:00:00.000Z',
    };

    it('resolves foreign keys from lookup tables and inserts the rows', async () => {
      prisma.municipios.findMany.mockResolvedValue([
        { id: 11, mun: 'Campinas' },
      ]);
      prisma.tipos.findMany.mockResolvedValue([
        { id: 22, descricao_sap: 'Expansion' },
      ]);
      prisma.circuitos.findMany.mockResolvedValue([
        { id: 33, circuito: 'CIR-1' },
      ]);
      prisma.base_auxiliar_ov.createMany = vi.fn().mockResolvedValue({});

      await repository.insertMarket([baseItem as any]);

      expect(prisma.base_auxiliar_ov.createMany).toHaveBeenCalledWith({
        data: [
          {
            obra: 'OBRA-1',
            pep: 'PEP-1',
            diagrama: 'D-1',
            gpm: 'Campinas',
            tipo: 'Expansion',
            circuito: 'CIR-1',
            prazo_texto: '30 days',
            status_ov: 2,
            status_diagrama: 'OK',
            status_pep: 'OK',
            equip_num_pedido: 'PED-1',
            mo_cliente: 10,
            mo_empresa: 20,
            entrada: new Date('2026-03-15T00:00:00.000Z'),
            aux_municipio: 11,
            aux_tipo_obra: 22,
            aux_circuito: 33,
            aux_turma: 1,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('falls back to id 1 when municipality, type or circuit are not found', async () => {
      prisma.municipios.findMany.mockResolvedValue([]);
      prisma.tipos.findMany.mockResolvedValue([]);
      prisma.circuitos.findMany.mockResolvedValue([]);
      prisma.base_auxiliar_ov.createMany = vi.fn().mockResolvedValue({});

      await repository.insertMarket([baseItem as any]);

      const [{ data }] = (prisma.base_auxiliar_ov.createMany as any).mock
        .calls[0];
      expect(data[0]).toMatchObject({
        aux_municipio: 1,
        aux_tipo_obra: 1,
        aux_circuito: 1,
        aux_turma: 1,
      });
    });

    it('logs and throws a friendly error when something fails', async () => {
      const error = Object.assign(new Error('db down'), { stack: 'stk' });
      prisma.municipios.findMany.mockRejectedValue(error);
      prisma.tipos.findMany.mockResolvedValue([]);
      prisma.circuitos.findMany.mockResolvedValue([]);

      await expect(repository.insertMarket([baseItem as any])).rejects.toThrow(
        'Falha ao inserir dados da base auxiliar OV',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao inserir dados da base auxiliar OV:',
        'stk',
      );
    });
  });

  // ─── insertNotes ──────────────────────────────────────────────────────────

  describe('insertNotes', () => {
    const makeNote = (n: number) => ({
      campo_ordenacao: `ORD-${n}`,
      pep: `PEP-${n}`,
      ordem_dci: `DCI-${n}`,
      ordem_dcd: `DCD-${n}`,
      ordem_dca: `DCA-${n}`,
      ordem_dcim: `DCIM-${n}`,
      ordem_dcdm: `DCDM-${n}`,
      conjunto: `CONJ-${n}`,
      grp_plnj_pm: `GRP-${n}`,
      texto_breve: `TXT-${n}`,
      denominacao: `DEN-${n}`,
      ehRda: n % 2 === 0,
    });

    it('builds one ROW per note and runs the bulk-insert function', async () => {
      prisma.$executeRaw.mockResolvedValue(2);

      const result = await repository.insertNotes([
        makeNote(1),
        makeNote(2),
      ] as any);

      expect(result).toEqual({ message: 'Dados inseridos com sucesso' });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);

      const query = prisma.$executeRaw.mock.calls[0][0];
      expect(query.strings.join('')).toContain('insert_base_auxiliar_bulk');

      const joined = query.values[0].joined;
      expect(joined).toHaveLength(2);
      expect(joined[0].values).toEqual([
        'ORD-1',
        'PEP-1',
        'DCI-1',
        'DCD-1',
        'DCA-1',
        'DCIM-1',
        'CONJ-1',
        'GRP-1',
        'TXT-1',
        'DEN-1',
        false,
        'DCDM-1',
      ]);
      expect(joined[1].values[10]).toBe(true);
    });

    it('wraps database errors in a domain error keeping the original as cause', async () => {
      const dbError = new Error('connection refused');
      prisma.$executeRaw.mockRejectedValueOnce(dbError);

      const error = await repository
        .insertNotes([makeNote(1)] as any)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBe(dbError);
      expect((error as Error).message).toBe(
        'Falha ao inserir dados da base auxiliar',
      );
      expect((error as Error).cause).toBe(dbError);
    });

    it('logs the original error stack before rethrowing', async () => {
      const loggerSpy = vi
        .spyOn(repository['logger'], 'error')
        .mockImplementation(() => {});
      const dbError = new Error('connection refused');
      prisma.$executeRaw.mockRejectedValueOnce(dbError);

      await expect(
        repository.insertNotes([makeNote(1)] as any),
      ).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Erro ao inserir dados da base auxiliar',
        dbError.stack,
      );
    });
  });

  // ─── insertCapex ──────────────────────────────────────────────────────────

  describe('insertCapex', () => {
    const makeItems = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id_obra: i }));

    it('does nothing when there is no data', async () => {
      await repository.insertCapex([]);

      expect(prisma.cn52n.createMany).not.toHaveBeenCalled();
    });

    it('inserts a small payload in a single batch', async () => {
      prisma.cn52n.createMany.mockResolvedValue({ count: 3 });
      const items = makeItems(3);

      await repository.insertCapex(items as any);

      expect(prisma.cn52n.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.cn52n.createMany).toHaveBeenCalledWith({ data: items });
    });

    it('splits the payload into batches of 200 records', async () => {
      prisma.cn52n.createMany.mockResolvedValue({ count: 0 });

      await repository.insertCapex(makeItems(450) as any);

      const sizes = prisma.cn52n.createMany.mock.calls.map(
        ([args]) => args.data.length,
      );
      expect(sizes).toEqual([200, 200, 50]);
    });

    it('retries a batch after a transient connection failure', async () => {
      vi.useFakeTimers();
      prisma.cn52n.createMany
        .mockRejectedValueOnce({ code: 'P1001', message: 'connection refused' })
        .mockResolvedValue({ count: 1 });

      const result = await settle(repository.insertCapex(makeItems(5) as any));

      expect(result.ok).toBe(true);
      expect(prisma.cn52n.createMany).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('propagates non-retryable errors and stops processing further batches', async () => {
      const error = { code: 'P2002', message: 'Unique constraint failed' };
      prisma.cn52n.createMany.mockRejectedValue(error);

      await expect(repository.insertCapex(makeItems(450) as any)).rejects.toBe(
        error,
      );

      expect(prisma.cn52n.createMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── truncateCN52N ────────────────────────────────────────────────────────

  describe('truncateCN52N', () => {
    it('truncates the cn52n table', async () => {
      prisma.$executeRaw.mockResolvedValue(0);

      await expect(repository.truncateCN52N()).resolves.toBeUndefined();

      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
      const [strings] = prisma.$executeRaw.mock.calls[0];
      expect(strings.join('')).toContain('TRUNCATE TABLE cn52n');
    });
  });

  // ─── getObraIdsByDiagramas ────────────────────────────────────────────────

  describe('getObraIdsByDiagramas', () => {
    it('returns an empty map without querying when no diagrams are given', async () => {
      const result = await repository.getObraIdsByDiagramas([]);

      expect(result.size).toBe(0);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('groups work ids by diagram and converts them to numbers', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { diagrama_ref: 'D1', ids: ['1', '2'] },
        { diagrama_ref: 'D2', ids: [3] },
      ]);

      const result = await repository.getObraIdsByDiagramas(['D1', 'D2']);

      expect(result).toEqual(
        new Map([
          ['D1', [1, 2]],
          ['D2', [3]],
        ]),
      );

      const [strings, ...values] = prisma.$queryRaw.mock.calls[0];
      expect(strings.join('')).toContain('UNION ALL');
      // The diagram list is bound once per UNION branch (5 branches).
      expect(values).toHaveLength(5);
      values.forEach((value: unknown) => expect(value).toEqual(['D1', 'D2']));
    });

    it('returns an empty map when no work matches the diagrams', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.getObraIdsByDiagramas(['UNKNOWN']);

      expect(result.size).toBe(0);
    });
  });
});
