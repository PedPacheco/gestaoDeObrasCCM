import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type {
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/types';
import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';

// Defensive mocks: they avoid loading the real dependencies (database, logger
// config, etc.) if the constructor types are emitted as runtime metadata
// (e.g. with SWC + emitDecoratorMetadata).
// Use the alias, not './capexProcessing.service': relative paths in vi.mock
// are resolved from this spec file, not from the service.
vi.mock(
  'src/application/usecases/auxiliaryBase/capex/capexProcessing.service',
  () => ({ CapexProcessingService: class CapexProcessingService {} }),
);
vi.mock(
  'src/application/usecases/works/management/updateCapex.service',
  () => ({ UpdateCapexService: class UpdateCapexService {} }),
);
vi.mock('src/core/logger/logger.service', () => ({
  AppLogger: class AppLogger {},
}));

// ─── Helpers ────────────────────────────────────────────────────────
const FILE = '/tmp/uploads/capex.xlsx';
const JOB = 'job-1';
const LOG_MESSAGE = `Erro no pipeline completo de CAPEX (job ${JOB})`;

const progress = (
  phase: string,
  percentage: number,
  extra: Record<string, unknown> = {},
) =>
  ({
    phase,
    processed: 0,
    percentage,
    ...extra,
  }) as unknown as CapexProgressPayload;

/** A promise that the test resolves or rejects manually. */
const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// ─── Suite ──────────────────────────────────────────────────────────
describe('CapexFullPipelineService', () => {
  let processing: { process: Mock };
  let updater: { update: Mock };
  let logger: { error: Mock };
  let target: Mock;
  let service: CapexFullPipelineService;

  const run = () =>
    service.run(FILE, JOB, target as unknown as ProgressEmitter);

  /** Runs the pipeline and returns the emitter given to the import stage. */
  const importEmitter = async () => {
    await run();
    return processing.process.mock.calls[0][2] as ProgressEmitter;
  };

  /** Runs the pipeline and returns the emitter given to the update stage. */
  const updateEmitter = async () => {
    await run();
    return updater.update.mock.calls[0][0] as ProgressEmitter;
  };

  const lastEmitted = () => target.mock.calls.at(-1)?.[0];

  beforeEach(() => {
    processing = { process: vi.fn().mockResolvedValue(undefined) };
    updater = { update: vi.fn().mockResolvedValue(undefined) };
    logger = { error: vi.fn() };
    target = vi.fn();

    service = new CapexFullPipelineService(
      processing as never,
      updater as never,
      logger as never,
    );
  });

  // ───────────────────────────────────────────────────────────────────
  describe('isRunning', () => {
    it('is false before any run', () => {
      expect(service.isRunning).toBe(false);
    });

    it('becomes true synchronously, before the first await', async () => {
      const importStage = deferred();
      processing.process.mockReturnValue(importStage.promise);

      const pipeline = run();

      expect(service.isRunning).toBe(true);

      importStage.resolve();
      await pipeline;
      expect(service.isRunning).toBe(false);
    });

    it('stays true during the update stage', async () => {
      const updateStage = deferred();
      updater.update.mockReturnValue(updateStage.promise);

      const pipeline = run();
      await vi.waitFor(() => expect(updater.update).toHaveBeenCalled());

      expect(service.isRunning).toBe(true);

      updateStage.resolve();
      await pipeline;
      expect(service.isRunning).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('run (success)', () => {
    it('resolves after running the import and then the update', async () => {
      await expect(run()).resolves.toBeUndefined();

      expect(processing.process).toHaveBeenCalledTimes(1);
      expect(processing.process).toHaveBeenCalledWith(
        FILE,
        JOB,
        expect.any(Function),
      );
      expect(updater.update).toHaveBeenCalledTimes(1);
      expect(updater.update).toHaveBeenCalledWith(expect.any(Function));
      expect(processing.process.mock.invocationCallOrder[0]).toBeLessThan(
        updater.update.mock.invocationCallOrder[0],
      );
    });

    it('waits for the import to finish before starting the update', async () => {
      const importStage = deferred();
      processing.process.mockReturnValue(importStage.promise);

      const pipeline = run();
      await Promise.resolve();

      expect(updater.update).not.toHaveBeenCalled();

      importStage.resolve();
      await pipeline;
      expect(updater.update).toHaveBeenCalledTimes(1);
    });

    it('gives each stage a wrapped emitter, never the original one', async () => {
      await run();

      const importEmit = processing.process.mock.calls[0][2];
      const updateEmit = updater.update.mock.calls[0][0];

      expect(importEmit).not.toBe(target);
      expect(updateEmit).not.toBe(target);
      expect(importEmit).not.toBe(updateEmit);
    });

    it('does not emit or log anything by itself', async () => {
      await run();

      expect(target).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('concurrency', () => {
    it('rejects a second run with 409 while the first one is in progress', async () => {
      const importStage = deferred();
      processing.process.mockReturnValue(importStage.promise);
      const first = run();

      const second = service.run('/tmp/other.xlsx', 'job-2', vi.fn());

      await expect(second).rejects.toBeInstanceOf(ConflictException);
      await expect(second).rejects.toThrow(
        'Já existe uma atualização de CAPEX em andamento.',
      );
      expect(processing.process).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();

      importStage.resolve();
      await first;
    });

    it('keeps the flag of the first run when the second one is rejected', async () => {
      const importStage = deferred();
      processing.process.mockReturnValue(importStage.promise);
      const first = run();

      await service.run(FILE, 'job-2', vi.fn()).catch(() => undefined);

      expect(service.isRunning).toBe(true);

      importStage.resolve();
      await first;
      expect(service.isRunning).toBe(false);
    });

    it('allows a new run after the previous one succeeds', async () => {
      await run();
      await run();

      expect(processing.process).toHaveBeenCalledTimes(2);
      expect(updater.update).toHaveBeenCalledTimes(2);
    });

    it('allows a new run after the previous one fails', async () => {
      processing.process.mockRejectedValueOnce(new Error('invalid sheet'));

      await expect(run()).rejects.toThrow('invalid sheet');
      await expect(run()).resolves.toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('run (failures)', () => {
    it('logs and rethrows when the import fails, without running the update', async () => {
      const error = new Error('invalid sheet');
      processing.process.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);

      expect(updater.update).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(LOG_MESSAGE, error.stack);
      expect(service.isRunning).toBe(false);
    });

    it('logs and rethrows when the update fails', async () => {
      const error = new Error('database down');
      updater.update.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);

      expect(processing.process).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(LOG_MESSAGE, error.stack);
      expect(service.isRunning).toBe(false);
    });

    it.each([
      ['undefined', undefined],
      ['a string', 'boom'],
      ['an object without stack', { code: 'X' }],
    ])(
      'logs an undefined stack when the rejection is %s',
      async (_, reason) => {
        processing.process.mockRejectedValue(reason);

        await expect(run()).rejects.toBe(reason);

        expect(logger.error).toHaveBeenCalledWith(LOG_MESSAGE, undefined);
        expect(service.isRunning).toBe(false);
      },
    );

    it('does not emit an error event itself (the stages already do)', async () => {
      processing.process.mockRejectedValue(new Error('invalid sheet'));

      await run().catch(() => undefined);

      expect(target).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('progress remapping – import stage (0% → 45%)', () => {
    it.each([
      ['reading', 0, 0],
      ['reading', 33, 6],
      ['reading', 50, 10],
      ['reading', 100, 20],
      ['processing', 0, 20],
      ['processing', 50, 32],
      ['processing', 99, 44],
      ['processing', 100, 45],
      ['completed', 0, 45],
      ['completed', 100, 45],
    ])('maps %s at %i%% to %i%%', async (phase, percentage, expected) => {
      const emit = await importEmitter();

      emit(progress(phase, percentage));

      expect(target).toHaveBeenCalledTimes(1);
      expect(lastEmitted()).toMatchObject({ phase, percentage: expected });
    });

    it('caps values above 100% at the top of the range', async () => {
      const emit = await importEmitter();

      emit(progress('reading', 150));

      expect(lastEmitted().percentage).toBe(20);
    });

    it('clamps negative values to the bottom of the range', async () => {
      const emit = await importEmitter();

      emit(progress('processing', -10));

      expect(lastEmitted().percentage).toBe(20);
    });

    it('never lets "completed" leak as 100% in the middle of the pipeline', async () => {
      const emit = await importEmitter();

      emit(progress('completed', 100));

      expect(lastEmitted().percentage).toBe(45);
    });

    it('passes update phases through unchanged (ranges are per stage)', async () => {
      const emit = await importEmitter();
      const payload = progress('loading', 50);

      emit(payload);

      expect(lastEmitted()).toBe(payload);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('progress remapping – update stage (45% → 100%)', () => {
    it.each([
      ['loading', 0, 45],
      ['loading', 50, 55],
      ['loading', 100, 65],
      ['calculating', 0, 65],
      ['calculating', 50, 67],
      ['calculating', 100, 70],
      ['updating', 0, 70],
      ['updating', 50, 84],
      ['updating', 99, 98],
      ['updating', 100, 99],
      ['done', 0, 100],
      ['done', 100, 100],
    ])('maps %s at %i%% to %i%%', async (phase, percentage, expected) => {
      const emit = await updateEmitter();

      emit(progress(phase, percentage));

      expect(target).toHaveBeenCalledTimes(1);
      expect(lastEmitted()).toMatchObject({ phase, percentage: expected });
    });

    it('passes import phases through unchanged (ranges are per stage)', async () => {
      const emit = await updateEmitter();
      const payload = progress('reading', 50);

      emit(payload);

      expect(lastEmitted()).toBe(payload);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('progress remapping – payload handling', () => {
    it.each([
      ['import', importEmitter],
      ['update', updateEmitter],
    ])(
      'passes the error phase through unchanged in the %s stage',
      async (_, getEmitter) => {
        const emit = await getEmitter();
        const payload = progress('error', 37, { message: 'Falha' });

        emit(payload);

        expect(lastEmitted()).toBe(payload);
        expect(lastEmitted().percentage).toBe(37);
      },
    );

    it('keeps the other payload fields', async () => {
      const emit = await importEmitter();

      emit(
        progress('processing', 50, { processed: 120, message: 'A importar' }),
      );

      expect(lastEmitted()).toEqual({
        phase: 'processing',
        processed: 120,
        percentage: 32,
        message: 'A importar',
      });
    });

    it('emits a new object without mutating the original payload', async () => {
      const emit = await importEmitter();
      const payload = progress('processing', 50);

      emit(payload);

      expect(lastEmitted()).not.toBe(payload);
      expect(payload.percentage).toBe(50);
    });

    it('produces NaN when the percentage is not a number (current behaviour)', async () => {
      const emit = await importEmitter();

      emit(progress('processing', Number.NaN));

      expect(lastEmitted().percentage).toBeNaN();
    });
  });
});
