import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Logger } from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
  type MockInstance,
} from 'vitest';

import type { CapexProgressPayload } from 'src/application/types';
import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';

type Row = Record<string, unknown> & { diagrama_rede: string | null };
type Tunable = 'BATCH_SIZE' | 'MAX_CACHE' | 'CONCURRENCY' | 'DRAIN_EVERY';

const JOB = 'job-1';

// ─── Helpers ────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

const row = (
  diagrama: string | null = 'D1',
  extra: Record<string, unknown> = {},
): Row => ({
  diagrama_rede: diagrama,
  material: '12345678',
  preco: 10,
  ...extra,
});

const rows = (count: number, diagrama: string | null = 'D1') =>
  Array.from({ length: count }, () => row(diagrama));

const toNdjson = (items: Row[]) =>
  `${items.map((item) => JSON.stringify(item)).join('\n')}\n`;

/**
 * Blank lines between NDJSON rows. Each one is a loop iteration, which gives
 * the batches already dispatched time to start before the next line is read.
 */
const PADDING = '\n'.repeat(20);

// ─── Suite ──────────────────────────────────────────────────────────
describe('CapexProcessingService', () => {
  let dir: string;
  let upload: string;
  let ndjson: string;
  let obras: Map<string, number[]>;
  let repository: {
    truncateCN52N: Mock;
    getObraIdsByDiagramas: Mock;
    insertCapex: Mock;
  };
  let parser: { parse: Mock };
  let onProgress: Mock;
  let warnSpy: MockInstance;
  let errorSpy: MockInstance;
  let service: CapexProcessingService;

  /** Overrides the private tuning constants of the instance. */
  const configure = (overrides: Partial<Record<Tunable, number>>) =>
    Object.assign(service as unknown as Record<Tunable, number>, overrides);

  /** Makes the parser "produce" the given NDJSON content. */
  const parsesTo = async (
    content: Row[] | string,
    options: { totalRows?: number; rowsRead?: number[] } = {},
  ) => {
    const isRaw = typeof content === 'string';
    await writeFile(ndjson, isRaw ? content : toNdjson(content));
    const totalRows = options.totalRows ?? (isRaw ? 0 : content.length);

    parser.parse.mockImplementation(
      async (_file: string, onRowsRead: (rowsRead: number) => void) => {
        for (const rowsRead of options.rowsRead ?? []) onRowsRead(rowsRead);
        return { totalRows, ndjsonPath: ndjson };
      },
    );
  };

  const run = () => service.process(upload, JOB, onProgress);
  const events = () =>
    onProgress.mock.calls.map(([event]) => event as CapexProgressPayload);
  const ofPhase = (phase: string) => events().filter((e) => e.phase === phase);
  const inserted = () =>
    repository.insertCapex.mock.calls.flatMap(([items]) => items as Row[]);
  const warnings = () =>
    warnSpy.mock.calls.map(([message]) => message as string);

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'capex-processing-'));
    upload = join(dir, 'capex.xlsx');
    ndjson = `${upload}.ndjson`;
    await writeFile(upload, 'xlsx');

    obras = new Map([['D1', [10]]]);
    repository = {
      truncateCN52N: vi.fn().mockResolvedValue(undefined),
      getObraIdsByDiagramas: vi.fn(
        async (diagramas: string[]) =>
          new Map(
            diagramas
              .filter((d) => obras.has(d))
              .map((d) => [d, obras.get(d) as number[]]),
          ),
      ),
      insertCapex: vi.fn().mockResolvedValue(undefined),
    };
    parser = { parse: vi.fn() };
    onProgress = vi.fn();

    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    service = new CapexProcessingService(repository as never, parser as never);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it('uses the documented defaults', () => {
    expect(service).toMatchObject({
      BATCH_SIZE: 1000,
      MAX_CACHE: 50_000,
      CONCURRENCY: 5,
      DRAIN_EVERY: 20,
      ESTIMATED_ROWS_SCALE: 60_000,
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('reading phase', () => {
    it('validates the file with the parser before touching the database', async () => {
      await parsesTo([row()]);

      await run();

      expect(parser.parse).toHaveBeenCalledWith(upload, expect.any(Function));
      expect(parser.parse.mock.invocationCallOrder[0]).toBeLessThan(
        repository.truncateCN52N.mock.invocationCallOrder[0],
      );
    });

    it('emits the start, the parser progress and the validated events', async () => {
      await parsesTo(rows(3), { rowsRead: [30_000] });

      await run();

      expect(ofPhase('reading')).toEqual([
        {
          phase: 'reading',
          processed: 0,
          percentage: 0,
          message: 'Validando planilha...',
        },
        {
          phase: 'reading',
          processed: 30_000,
          percentage: 39,
          message: 'Validando linha 30000...',
        },
        {
          phase: 'reading',
          processed: 3,
          percentage: 100,
          message: 'Planilha validada: 3 linhas',
        },
      ]);
    });

    it.each([
      [0, 0],
      [6_000, 9],
      [60_000, 63],
      [300_000, 99],
      [1e9, 99], // the curve saturates and is capped at 99
    ])('estimates %i rows read as %i%%', async (rowsRead, expected) => {
      await parsesTo([row()], { rowsRead: [rowsRead] });

      await run();

      expect(ofPhase('reading')[1]).toMatchObject({
        processed: rowsRead,
        percentage: expected,
      });
    });

    it('does not change the database when the parser rejects the file', async () => {
      const error = new Error('Planilha inválida');
      parser.parse.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);

      expect(repository.truncateCN52N).not.toHaveBeenCalled();
      expect(repository.insertCapex).not.toHaveBeenCalled();
      expect(ofPhase('completed')).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('loading phase', () => {
    it('truncates cn52n before inserting', async () => {
      await parsesTo([row()]);

      await run();

      expect(repository.truncateCN52N).toHaveBeenCalledTimes(1);
      expect(repository.truncateCN52N.mock.invocationCallOrder[0]).toBeLessThan(
        repository.insertCapex.mock.invocationCallOrder[0],
      );
    });

    it('links each row to its single obra', async () => {
      await parsesTo([row('D1', { material: 'A' })]);

      await run();

      expect(repository.insertCapex).toHaveBeenCalledWith([
        { ...row('D1', { material: 'A' }), id_obra: 10 },
      ]);
    });

    it('skips rows without obra, without diagrama or with an ambiguous diagrama', async () => {
      obras.set('AMB', [1, 2]);
      await parsesTo([row('D1'), row('NONE'), row(null), row(''), row('AMB')]);

      await run();

      expect(inserted()).toEqual([{ ...row('D1'), id_obra: 10 }]);
    });

    it('does not insert when a batch has no valid rows', async () => {
      await parsesTo([row('NONE'), row(null)]);

      await run();

      expect(repository.insertCapex).not.toHaveBeenCalled();
    });

    it('queries each missing diagrama once per batch, ignoring empty ones', async () => {
      await parsesTo([row('D1'), row('D1'), row('X'), row(null), row('')]);

      await run();

      expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(1);
      expect(repository.getObraIdsByDiagramas).toHaveBeenCalledWith([
        'D1',
        'X',
      ]);
    });

    it('does not query the repository when no row has a diagrama', async () => {
      await parsesTo([row(null), row('')]);

      await run();

      expect(repository.getObraIdsByDiagramas).not.toHaveBeenCalled();
    });

    it('ignores blank lines in the NDJSON', async () => {
      await parsesTo(
        `\n${JSON.stringify(row())}\n\n${JSON.stringify(row())}\n\n`,
        {
          totalRows: 2,
        },
      );

      await run();

      expect(inserted()).toHaveLength(2);
    });

    describe('batching', () => {
      it('inserts in batches of 1000 rows', async () => {
        await parsesTo(rows(2_500));

        await run();

        const sizes = repository.insertCapex.mock.calls
          .map(([items]) => (items as Row[]).length)
          .sort((a, b) => b - a);
        expect(sizes).toEqual([1000, 1000, 500]);
      });

      it('does not dispatch an empty last batch when the total is a multiple of the batch size', async () => {
        await parsesTo(rows(2_000));

        await run();

        expect(repository.insertCapex).toHaveBeenCalledTimes(2);
      });

      it('emits exact processing progress after each full batch', async () => {
        await parsesTo(rows(2_500));

        await run();

        expect(ofPhase('processing')).toEqual([
          {
            phase: 'processing',
            processed: 1000,
            percentage: 40,
            message: '1000 registros processados (0 ignorados)',
          },
          {
            phase: 'processing',
            processed: 2000,
            percentage: 80,
            message: '2000 registros processados (0 ignorados)',
          },
        ]);
      });

      it('caps the processing progress at 99%', async () => {
        await parsesTo(rows(2_000));

        await run();

        expect(ofPhase('processing').at(-1)?.percentage).toBe(99);
      });

      it('does not emit processing events for loads smaller than a batch', async () => {
        await parsesTo(rows(10));

        await run();

        expect(ofPhase('processing')).toEqual([]);
      });

      it('runs at most CONCURRENCY batches at the same time', async () => {
        configure({ BATCH_SIZE: 1 });
        let active = 0;
        let maxActive = 0;
        repository.getObraIdsByDiagramas.mockImplementation(async () => {
          active++;
          maxActive = Math.max(maxActive, active);
          await delay(5);
          active--;
          return new Map();
        });
        await parsesTo(Array.from({ length: 12 }, (_, i) => row(`N${i}`)));

        await run();

        expect(maxActive).toBeGreaterThan(1);
        expect(maxActive).toBeLessThanOrEqual(5);
      });

      it('waits for the dispatched batches every DRAIN_EVERY batches', async () => {
        configure({ BATCH_SIZE: 1, DRAIN_EVERY: 3 });
        let done = 0;
        repository.insertCapex.mockImplementation(async () => {
          await delay(5);
          done++;
        });
        const doneWhenEmitted = new Map<number, number>();
        onProgress.mockImplementation((event: CapexProgressPayload) => {
          if (event.phase === 'processing') {
            doneWhenEmitted.set(event.processed, done);
          }
        });
        await parsesTo(rows(5));

        await run();

        // Batch 4 is only read after batches 1–3 have finished.
        expect(doneWhenEmitted.get(4)).toBeGreaterThanOrEqual(3);
        expect(done).toBe(5);
      });
    });

    describe('obra cache', () => {
      it('reuses the cache across batches, including diagramas without obra', async () => {
        configure({ BATCH_SIZE: 2, CONCURRENCY: 1 });
        await parsesTo([row('D1'), row('X'), row('D1'), row('X')]);

        await run();

        expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(1);
        expect(inserted()).toHaveLength(2);
      });

      it('evicts the oldest entry when the cache exceeds MAX_CACHE', async () => {
        configure({ BATCH_SIZE: 3, CONCURRENCY: 1, MAX_CACHE: 2 });
        obras.set('A', [1]).set('B', [2]).set('C', [3]);
        await parsesTo([row('A'), row('B'), row('C'), row('A')]);

        await run();

        expect(repository.getObraIdsByDiagramas.mock.calls).toEqual([
          [['A', 'B', 'C']],
          [['A']], // 'A' was evicted, so it is queried again
        ]);
        expect(inserted()).toHaveLength(3);
      });

      it('ignores rows whose diagrama is evicted within the same batch (current behaviour)', async () => {
        configure({ MAX_CACHE: 1 });
        obras.set('A', [1]).set('B', [2]);
        await parsesTo([row('A'), row('B')]);

        await run();

        expect(inserted()).toEqual([{ ...row('B'), id_obra: 2 }]);
        expect(ofPhase('completed')[0].message).toBe(
          'Importação concluída: 2 registros (1 ignorados)',
        );
      });

      it('does not share the cache between runs', async () => {
        await parsesTo([row('D1')]);

        await run();
        await writeFile(upload, 'xlsx');
        await parsesTo([row('D1')]);
        await run();

        expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(2);
      });
    });

    describe('failures', () => {
      it('rejects with the batch error and does not emit completed', async () => {
        const error = new Error('insert failed');
        repository.insertCapex.mockRejectedValue(error);
        await parsesTo(rows(3));

        await expect(run()).rejects.toBe(error);

        expect(ofPhase('completed')).toEqual([]);
        expect(ofPhase('error')).toHaveLength(1);
      });

      it('keeps a single error when concurrent batches fail', async () => {
        configure({ BATCH_SIZE: 1 });
        const rejecters: Array<(error: Error) => void> = [];
        repository.getObraIdsByDiagramas.mockImplementation(
          () =>
            new Promise((_, reject) => {
              rejecters.push(reject);
              // Both batches are in flight before either of them fails.
              if (rejecters.length === 2) {
                rejecters.forEach((r, i) =>
                  r(new Error(`batch ${i + 1} failed`)),
                );
              }
            }),
        );
        await parsesTo([row('A'), row('B')]);

        await expect(run()).rejects.toThrow(/^batch [12] failed$/);

        expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(2);
        expect(ofPhase('error')).toHaveLength(1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
      });

      it('waits for the batches already running before rejecting on an invalid line', async () => {
        configure({ BATCH_SIZE: 1 });
        let finished = false;
        repository.insertCapex.mockImplementation(async () => {
          await delay(10);
          finished = true;
        });
        await parsesTo(`${JSON.stringify(row())}\n${PADDING}{invalid\n`, {
          totalRows: 2,
        });

        await expect(run()).rejects.toBeInstanceOf(SyntaxError);

        expect(finished).toBe(true);
      });

      it('turns queued batches into no-ops after a failure', async () => {
        configure({ BATCH_SIZE: 1, CONCURRENCY: 1 });
        obras.set('D2', [20]);
        repository.getObraIdsByDiagramas.mockImplementation(
          async (diagramas: string[]) => {
            await delay(10);
            return new Map(diagramas.map((d) => [d, obras.get(d) ?? []]));
          },
        );
        await parsesTo(
          `${JSON.stringify(row('D1'))}\n${PADDING}${JSON.stringify(row('D2'))}\n{invalid\n`,
          { totalRows: 3 },
        );

        await expect(run()).rejects.toBeInstanceOf(SyntaxError);

        expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(1);
        expect(inserted()).toEqual([{ ...row('D1'), id_obra: 10 }]);
      });

      it('rejects without inserting when truncate fails', async () => {
        const error = new Error('lock timeout');
        repository.truncateCN52N.mockRejectedValue(error);
        await parsesTo(rows(3));

        await expect(run()).rejects.toBe(error);

        expect(repository.insertCapex).not.toHaveBeenCalled();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('completion', () => {
    it('emits completed as the last event', async () => {
      await parsesTo(rows(3));

      await run();

      expect(events().at(-1)).toEqual({
        phase: 'completed',
        processed: 3,
        percentage: 100,
        message: 'Importação concluída: 3 registros (0 ignorados)',
      });
    });

    it('reports ignored and ambiguous rows in the completed message', async () => {
      obras.set('AMB', [1, 2]);
      await parsesTo([row('D1'), row('NONE'), row(null), row('AMB')]);

      await run();

      expect(ofPhase('completed')[0].message).toBe(
        'Importação concluída: 4 registros (2 ignorados, 1 ambíguos)',
      );
    });

    it('logs no warnings when every row is linked', async () => {
      await parsesTo(rows(3));

      await run();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('logs the ignored rows with examples (without empty diagramas)', async () => {
      await parsesTo([row('X'), row('X'), row(null)]);

      await run();

      expect(warnings()).toEqual([
        `Job ${JOB}: 3 linhas ignoradas (diagrama sem obra). Exemplos: X`,
      ]);
    });

    it('logs the ambiguous rows with examples', async () => {
      obras.set('AMB', [1, 2]);
      await parsesTo([row('AMB'), row('AMB')]);

      await run();

      expect(warnings()).toEqual([
        `Job ${JOB}: 2 linhas ambíguas (diagrama em mais de uma obra). Exemplos: AMB`,
      ]);
    });

    it('limits the examples to 20 distinct diagramas', async () => {
      const diagramas = Array.from({ length: 25 }, (_, i) => `N${i + 1}`);
      await parsesTo([...diagramas, ...diagramas].map((d) => row(d)));

      await run();

      const examples = warnings()[0].split('Exemplos: ')[1].split(', ');
      expect(warnings()[0]).toMatch(/^Job job-1: 50 linhas ignoradas/);
      expect(examples).toEqual(diagramas.slice(0, 20));
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('error handling', () => {
    it('logs, emits a safe error event and rethrows', async () => {
      const error = new Error('lock timeout');
      repository.truncateCN52N.mockRejectedValue(error);
      await parsesTo(rows(1));

      await expect(run()).rejects.toBe(error);

      expect(errorSpy).toHaveBeenCalledWith(
        `Erro no processamento do job ${JOB}`,
        error.stack,
      );
      expect(events().at(-1)).toEqual({
        phase: 'error',
        processed: 0,
        percentage: 0,
        message: expect.any(String),
      });
    });

    it('logs an undefined stack when the rejection is not an Error', async () => {
      parser.parse.mockRejectedValue(undefined);

      await expect(run()).rejects.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        `Erro no processamento do job ${JOB}`,
        undefined,
      );
      expect(ofPhase('error')).toHaveLength(1);
    });

    it('works without an onProgress callback', async () => {
      await parsesTo(rows(2));
      await expect(service.process(upload, JOB)).resolves.toBeUndefined();

      await writeFile(upload, 'xlsx');
      parser.parse.mockRejectedValue(new Error('invalid'));
      await expect(service.process(upload, JOB)).rejects.toThrow('invalid');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('file cleanup', () => {
    it('removes the upload and the NDJSON after a successful import', async () => {
      await parsesTo(rows(2));

      await run();

      expect(await exists(upload)).toBe(false);
      expect(await exists(ndjson)).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('removes both files when the load fails', async () => {
      repository.insertCapex.mockRejectedValue(new Error('insert failed'));
      await parsesTo(rows(2));

      await run().catch(() => undefined);

      expect(await exists(upload)).toBe(false);
      expect(await exists(ndjson)).toBe(false);
    });

    it('only removes the upload when the parser fails (it does not know the NDJSON path)', async () => {
      await writeFile(ndjson, 'partial');
      parser.parse.mockRejectedValue(new Error('invalid'));

      await run().catch(() => undefined);

      expect(await exists(upload)).toBe(false);
      expect(await exists(ndjson)).toBe(true);
    });

    it('logs a warning when a file cannot be removed, without failing', async () => {
      await rm(upload);
      await parsesTo(rows(1));

      await expect(run()).resolves.toBeUndefined();

      expect(warnings()).toContain(
        `Não foi possível remover o arquivo ${upload}`,
      );
    });

    it('keeps the original error when the cleanup also fails', async () => {
      await rm(upload);
      const error = new Error('invalid');
      parser.parse.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);

      expect(warnings()).toContain(
        `Não foi possível remover o arquivo ${upload}`,
      );
    });
  });
});
