import type { EventEmitter } from 'node:events';

import { BadRequestException, Logger } from '@nestjs/common';
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

import type { CapexWorkerMessage } from 'src/infra/spreadsheet/capex/capexFileParser.worker';
import { WorkerCapexFileParser } from 'src/infra/spreadsheet/capex/workerCapexFileParser';

type FakeWorker = EventEmitter & {
  file: string;
  options: { workerData: unknown };
  terminate: Mock;
};

// ─── Shared mock state (hoisted so the vi.mock factories can use it) ──
const h = vi.hoisted(() => ({
  workers: [] as unknown[],
  existsSync: vi.fn(),
  unlink: vi.fn(),
}));

// The specifiers must match the source imports ('fs' and 'worker_threads').
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const mocked = {
    ...actual,
    existsSync: h.existsSync,
    promises: { ...actual.promises, unlink: h.unlink },
  };
  return { ...mocked, default: mocked };
});

vi.mock('worker_threads', async () => {
  const { EventEmitter } = await import('node:events');

  class Worker extends EventEmitter {
    readonly terminate = vi.fn(() => Promise.resolve(1));

    constructor(
      readonly file: string,
      readonly options: { workerData: unknown },
    ) {
      super();
      h.workers.push(this);
    }
  }

  return { Worker, default: { Worker } };
});

// Mirror the module constants (they are not exported).
const MAX_REPORTED_ERRORS = 10;
const DEFAULT_MAX_ROWS = 500_000;

const FILE = '/tmp/uploads/capex.xlsx';
const OUTPUT = `${FILE}.ndjson`;
const WORKER_FILE = /[\\/]capexFileParser\.worker\.js$/;
const PREFIX = 'Planilha inválida, nenhum dado foi alterado. ';

// ─── Helpers ────────────────────────────────────────────────────────
const lastWorker = () => h.workers.at(-1) as FakeWorker;

/** Reports whether the promise is still pending after pending callbacks run. */
const state = (promise: Promise<unknown>) =>
  Promise.race([
    promise.then(
      () => 'fulfilled',
      () => 'rejected',
    ),
    new Promise((resolve) => setTimeout(resolve, 0, 'pending')),
  ]);

/** Awaits a promise that must reject and returns the rejection reason. */
const rejection = async (promise: Promise<unknown>) => {
  const reason = await promise.then(
    () => {
      throw new Error('Expected the promise to reject');
    },
    (error: unknown) => error,
  );
  return reason as Error;
};

// ─── Suite ──────────────────────────────────────────────────────────
describe('WorkerCapexFileParser', () => {
  let parser: WorkerCapexFileParser;
  let errorSpy: MockInstance;

  /** Starts a parse; the fake worker is created synchronously. */
  const start = (onProgress?: (rowsRead: number) => void) => {
    const promise = parser.parse(FILE, onProgress);
    const worker = lastWorker();
    const send = (message: CapexWorkerMessage) =>
      worker.emit('message', message);
    return { promise, worker, send };
  };

  beforeEach(() => {
    h.workers.length = 0;
    h.existsSync.mockReset().mockReturnValue(true);
    h.unlink.mockReset().mockResolvedValue(undefined);
    vi.stubEnv('CAPEX_MAX_ROWS', '');

    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    parser = new WorkerCapexFileParser();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('worker startup', () => {
    it('rejects without starting a worker when the worker file is missing', async () => {
      h.existsSync.mockReturnValue(false);

      const error = await rejection(parser.parse(FILE));

      expect(error.message).toMatch(/^Arquivo do worker não encontrado: /);
      expect(error.message).toMatch(WORKER_FILE);
      expect(h.workers).toHaveLength(0);
      expect(h.unlink).not.toHaveBeenCalled();
    });

    it('checks and starts the compiled worker file next to the parser', () => {
      const { worker } = start();

      expect(worker.file).toMatch(WORKER_FILE);
      expect(h.existsSync).toHaveBeenCalledWith(worker.file);
    });

    it('passes the input to the worker through workerData', () => {
      const { worker } = start();

      expect(worker.options).toEqual({
        workerData: {
          filePath: FILE,
          outputPath: OUTPUT,
          maxRows: DEFAULT_MAX_ROWS,
          maxErrors: MAX_REPORTED_ERRORS,
        },
      });
    });

    it('starts a new worker for each parse', () => {
      start();
      start();

      expect(h.workers).toHaveLength(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('row limit (CAPEX_MAX_ROWS)', () => {
    const maxRowsFor = (value?: string) => {
      if (value === undefined) delete process.env.CAPEX_MAX_ROWS;
      else vi.stubEnv('CAPEX_MAX_ROWS', value);

      const custom = new WorkerCapexFileParser();
      void custom.parse(FILE);
      return (lastWorker().options.workerData as { maxRows: number }).maxRows;
    };

    it.each([
      ['1000', 1000],
      ['1e3', 1000],
      ['10.5', 10.5], // current behaviour: fractions are accepted
    ])('uses the positive value %j', (value, expected) => {
      expect(maxRowsFor(value)).toBe(expected);
    });

    it.each(['0', '-5', 'abc', ''])(
      'falls back to the default for %j',
      (value) => {
        expect(maxRowsFor(value)).toBe(DEFAULT_MAX_ROWS);
      },
    );

    it('falls back to the default when the variable is not set', () => {
      expect(maxRowsFor(undefined)).toBe(DEFAULT_MAX_ROWS);
    });

    it('reads the variable once, when the parser is created', () => {
      vi.stubEnv('CAPEX_MAX_ROWS', '1000');

      const { worker } = start(); // parser created in beforeEach with ''

      expect(worker.options.workerData).toMatchObject({
        maxRows: DEFAULT_MAX_ROWS,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('progress messages', () => {
    it('forwards rowsRead to onProgress without settling', async () => {
      const onProgress = vi.fn();
      const { promise, worker, send } = start(onProgress);

      send({ type: 'progress', rowsRead: 5000 });
      send({ type: 'progress', rowsRead: 10_000 });

      expect(onProgress.mock.calls).toEqual([[5000], [10_000]]);
      expect(await state(promise)).toBe('pending');
      expect(worker.terminate).not.toHaveBeenCalled();
    });

    it('works without an onProgress callback', async () => {
      const { promise, send } = start();

      expect(() => send({ type: 'progress', rowsRead: 5000 })).not.toThrow();
      expect(await state(promise)).toBe('pending');
    });

    it('ignores unknown message types', async () => {
      const { promise, worker, send } = start();

      send({ type: 'unknown' } as unknown as CapexWorkerMessage);

      expect(await state(promise)).toBe('pending');
      expect(worker.terminate).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('done', () => {
    it('resolves with the total rows and the ndjson path', async () => {
      const { promise, send } = start();

      send({ type: 'done', totalRows: 1234 });

      await expect(promise).resolves.toEqual({
        totalRows: 1234,
        ndjsonPath: OUTPUT,
      });
    });

    it('terminates the worker and keeps the output file', async () => {
      const { promise, worker, send } = start();

      send({ type: 'done', totalRows: 1 });
      await promise;

      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('invalid', () => {
    it('rejects with a BadRequestException listing the row errors', async () => {
      const { promise, send } = start();

      send({
        type: 'invalid',
        totalRows: 3,
        errors: [
          {
            row: 5,
            column: 'K (preco)',
            message: 'valor "abc" não é numérico',
          },
          {
            row: 8,
            column: 'D (material)',
            message: 'valor "123456789" excede 8 caracteres',
          },
        ],
      });

      const error = await rejection(promise);
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(
        `${PREFIX}linha 5, coluna K (preco): valor "abc" não é numérico; ` +
          'linha 8, coluna D (material): valor "123456789" excede 8 caracteres',
      );
    });

    it('shows only the message for general errors (row 0)', async () => {
      const { promise, send } = start();

      send({
        type: 'invalid',
        totalRows: 0,
        errors: [
          {
            row: 0,
            column: '-',
            message: 'a planilha não possui linhas de dados',
          },
        ],
      });

      expect((await rejection(promise)).message).toBe(
        `${PREFIX}a planilha não possui linhas de dados`,
      );
    });

    it('mixes row and general errors', async () => {
      const { promise, send } = start();

      send({
        type: 'invalid',
        totalRows: 1,
        errors: [
          { row: 0, column: '-', message: 'geral' },
          { row: 3, column: 'B (diagrama_rede)', message: 'erro' },
        ],
      });

      expect((await rejection(promise)).message).toBe(
        `${PREFIX}geral; linha 3, coluna B (diagrama_rede): erro`,
      );
    });

    it('keeps only the prefix when the error list is empty (current behaviour)', async () => {
      const { promise, send } = start();

      send({ type: 'invalid', totalRows: 0, errors: [] });

      expect((await rejection(promise)).message).toBe(PREFIX);
    });

    it('terminates the worker and deletes the output file', async () => {
      const { promise, worker, send } = start();

      send({ type: 'invalid', totalRows: 0, errors: [] });
      await rejection(promise);

      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).toHaveBeenCalledWith(OUTPUT);
    });

    it('only rejects after the output file has been deleted', async () => {
      let release!: () => void;
      h.unlink.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );
      const { promise, send } = start();

      send({ type: 'invalid', totalRows: 0, errors: [] });

      expect(await state(promise)).toBe('pending');
      release();
      expect(await rejection(promise)).toBeInstanceOf(BadRequestException);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('fatal', () => {
    it('logs the failure and rejects with the worker message', async () => {
      const { promise, worker, send } = start();

      send({ type: 'fatal', message: 'corrupted file' });

      const error = await rejection(promise);
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('corrupted file');
      expect(errorSpy).toHaveBeenCalledWith(
        'Falha no worker de CAPEX: corrupted file',
      );
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).toHaveBeenCalledWith(OUTPUT);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('worker events', () => {
    it('rejects with the same error on the error event', async () => {
      const { promise, worker } = start();
      const boom = new Error('boom');

      worker.emit('error', boom);

      expect(await rejection(promise)).toBe(boom);
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).toHaveBeenCalledWith(OUTPUT);
    });

    it.each([0, 1])(
      'rejects when the worker exits (code %i) without a final message',
      async (code) => {
        const { promise, worker } = start();

        worker.emit('exit', code);

        expect((await rejection(promise)).message).toBe(
          `Worker encerrou (code ${code}) sem concluir`,
        );
        expect(h.unlink).toHaveBeenCalledWith(OUTPUT);
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────
  describe('settles only once', () => {
    it('ignores the exit that follows done (caused by terminate)', async () => {
      const { promise, worker, send } = start();

      send({ type: 'done', totalRows: 2 });
      worker.emit('exit', 1);

      await expect(promise).resolves.toEqual({
        totalRows: 2,
        ndjsonPath: OUTPUT,
      });
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).not.toHaveBeenCalled();
    });

    it('keeps the first rejection and deletes the output only once', async () => {
      const { promise, worker, send } = start();

      send({ type: 'invalid', totalRows: 0, errors: [] });
      worker.emit('error', new Error('late error'));
      send({ type: 'done', totalRows: 1 });
      worker.emit('exit', 1);

      expect(await rejection(promise)).toBeInstanceOf(BadRequestException);
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(h.unlink).toHaveBeenCalledTimes(1);
    });

    it('rejects when the worker exits before sending done', async () => {
      const { promise, worker, send } = start();

      worker.emit('exit', 0);
      send({ type: 'done', totalRows: 1 });

      expect((await rejection(promise)).message).toBe(
        'Worker encerrou (code 0) sem concluir',
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('output cleanup failures', () => {
    it('ignores unlink errors and still rejects with the original error', async () => {
      h.unlink.mockRejectedValueOnce(
        Object.assign(new Error('no such file'), { code: 'ENOENT' }),
      );
      const { promise, send } = start();

      send({ type: 'fatal', message: 'corrupted file' });

      expect((await rejection(promise)).message).toBe('corrupted file');
    });
  });
});
