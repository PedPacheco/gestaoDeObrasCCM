import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Logger,
  RequestMethod,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import type { Request } from 'express';
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

import { UploadSignaturePipe } from 'src/core/pipes/uploadSignature.pipe';

import { CapexController } from 'src/interface/controllers/capex.controller';
import { CONSTRUCTION_AREA_ID } from 'src/shared/costants';

// ─── Shared mock state (hoisted so the vi.mock factories can use it) ──
const h = vi.hoisted(() => {
  class AreaEditGuardStub {
    canActivate() {
      return true;
    }
  }

  type AreaEditGuardOptions = {
    allowedAreas: unknown[];
    blockPartner?: boolean;
  };

  return {
    GuardStub: AreaEditGuardStub,
    areaEditGuard: vi.fn((_options: AreaEditGuardOptions) => AreaEditGuardStub),
    unlink: vi.fn(),
    safeMessage: vi.fn(),
  };
});

// The specifier must match the source import ('fs').
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const mocked = {
    ...actual,
    promises: { ...actual.promises, unlink: h.unlink },
  };
  return { ...mocked, default: mocked };
});

vi.mock('src/core/guards/newPermission.guard', () => ({
  AreaEditGuard: h.areaEditGuard,
}));

vi.mock('src/core/pipes/uploadSignature.pipe', () => ({
  UploadSignaturePipe: class UploadSignaturePipe {
    transform(value: unknown) {
      return value;
    }
  },
}));

vi.mock(
  'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service',
  () => ({ CapexFullPipelineService: class CapexFullPipelineService {} }),
);

vi.mock(
  'src/application/types/usecases/auxiliaryBase/capex-error.util',
  () => ({ toSafeCapexErrorMessage: h.safeMessage }),
);

// AreaEditGuard runs when the class is decorated (at import time),
// so its arguments are captured before any mock reset.
const guardOptions = h.areaEditGuard.mock.calls[0]?.[0];

// ─── Helpers ────────────────────────────────────────────────────────
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_PATH = '/tmp/uploads/capex.xlsx';
const SAFE_MESSAGE = 'Falha ao processar a planilha.';
const handler = CapexController.prototype.importAndUpdateCapex;

const makeFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'capex.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024,
    path: FILE_PATH,
    ...overrides,
  }) as Express.Multer.File;

const makeReq = (user: unknown = { id: 42 }) =>
  ({ user }) as Request & { user: any };

/** Lets pending promise callbacks (the background .catch) run. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

// ─── Suite ──────────────────────────────────────────────────────────
describe('CapexController', () => {
  let service: { isRunning: boolean; run: Mock };
  let gateway: { createEmitter: Mock };
  let emit: Mock;
  let errorSpy: MockInstance;
  let controller: CapexController;

  const call = (
    file: Express.Multer.File | undefined = makeFile(),
    req = makeReq(),
  ) => controller.importAndUpdateCapex(file as Express.Multer.File, req);

  beforeEach(() => {
    h.unlink.mockReset().mockResolvedValue(undefined);
    h.safeMessage.mockReset().mockReturnValue(SAFE_MESSAGE);

    emit = vi.fn();
    service = { isRunning: false, run: vi.fn().mockResolvedValue(undefined) };
    gateway = { createEmitter: vi.fn(() => emit) };

    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    controller = new CapexController(service as never, gateway as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('route metadata', () => {
    it('is mounted under /base-auxiliar (kept for front-end compatibility)', () => {
      expect(Reflect.getMetadata(PATH_METADATA, CapexController)).toBe(
        'base-auxiliar',
      );
    });

    it('exposes POST capex/pipeline', () => {
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
        'capex/pipeline',
      );
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
        RequestMethod.POST,
      );
    });

    it('responds with 202 Accepted', () => {
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(
        HttpStatus.ACCEPTED,
      );
    });

    it('restricts the route to the construction area and blocks partners', () => {
      expect(guardOptions).toEqual({
        allowedAreas: [CONSTRUCTION_AREA_ID],
        blockPartner: true,
      });
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
        h.GuardStub,
      ]);
    });

    it('uses a file interceptor for the upload', () => {
      const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, handler);

      expect(interceptors).toHaveLength(1);
      expect(interceptors[0]).toEqual(expect.any(Function));
    });

    it('validates the uploaded file with UploadSignaturePipe', () => {
      const args = Object.values(
        Reflect.getMetadata(
          ROUTE_ARGS_METADATA,
          CapexController,
          'importAndUpdateCapex',
        ) as Record<string, { index: number; pipes: unknown[] }>,
      );

      expect(args).toContainEqual(
        expect.objectContaining({ index: 0, pipes: [UploadSignaturePipe] }),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('importAndUpdateCapex', () => {
    describe('missing file', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
      ])('rejects with 400 when the file is %s', async (_, file) => {
        const promise = controller.importAndUpdateCapex(
          file as unknown as Express.Multer.File,
          makeReq(),
        );

        await expect(promise).rejects.toBeInstanceOf(BadRequestException);
        await expect(promise).rejects.toThrow(
          'Envie a planilha de CAPEX (.xlsx).',
        );
        expect(h.unlink).not.toHaveBeenCalled();
        expect(gateway.createEmitter).not.toHaveBeenCalled();
        expect(service.run).not.toHaveBeenCalled();
      });
    });

    describe('pipeline already running', () => {
      beforeEach(() => {
        service.isRunning = true;
      });

      it('rejects with 409 and deletes the uploaded file', async () => {
        const promise = call();

        await expect(promise).rejects.toBeInstanceOf(ConflictException);
        await expect(promise).rejects.toThrow(
          'Já existe uma atualização de CAPEX em andamento.',
        );
        expect(h.unlink).toHaveBeenCalledTimes(1);
        expect(h.unlink).toHaveBeenCalledWith(FILE_PATH);
      });

      it('does not create a job nor start the pipeline', async () => {
        await call().catch(() => undefined);

        expect(gateway.createEmitter).not.toHaveBeenCalled();
        expect(service.run).not.toHaveBeenCalled();
      });

      it('still rejects with 409 when deleting the file fails', async () => {
        h.unlink.mockRejectedValueOnce(
          Object.assign(new Error('no such file'), { code: 'ENOENT' }),
        );

        await expect(call()).rejects.toBeInstanceOf(ConflictException);
      });

      it('reads isRunning on every request', async () => {
        await expect(call()).rejects.toBeInstanceOf(ConflictException);

        service.isRunning = false;

        await expect(call()).resolves.toMatchObject({
          statusCode: HttpStatus.ACCEPTED,
        });
      });
    });

    describe('starting the pipeline', () => {
      it('returns the 202 body with a UUID v4 jobId', async () => {
        const result = await call();

        expect(result).toEqual({
          statusCode: HttpStatus.ACCEPTED,
          message:
            'Pipeline de importação e atualização de CAPEX iniciado. Acompanhe via WebSocket.',
          jobId: expect.stringMatching(UUID_V4),
        });
      });

      it('registers the job in the gateway with the user id as owner', async () => {
        const { jobId } = await call(makeFile(), makeReq({ id: 42 }));

        expect(gateway.createEmitter).toHaveBeenCalledTimes(1);
        expect(gateway.createEmitter).toHaveBeenCalledWith(jobId, '42');
      });

      it('uses the JWT sub when there is no id', async () => {
        const { jobId } = await call(makeFile(), makeReq({ sub: 'user-7' }));

        expect(gateway.createEmitter).toHaveBeenCalledWith(jobId, 'user-7');
      });

      it('starts the pipeline with the file path, the jobId and the emitter', async () => {
        const { jobId } = await call();

        expect(service.run).toHaveBeenCalledTimes(1);
        expect(service.run).toHaveBeenCalledWith(FILE_PATH, jobId, emit);
      });

      it('registers the job before starting the pipeline', async () => {
        await call();

        expect(gateway.createEmitter.mock.invocationCallOrder[0]).toBeLessThan(
          service.run.mock.invocationCallOrder[0],
        );
      });

      it('responds without waiting for the pipeline to finish', async () => {
        service.run.mockReturnValue(new Promise(() => undefined)); // never settles

        await expect(call()).resolves.toMatchObject({
          jobId: expect.stringMatching(UUID_V4),
        });
      });

      it('generates a different jobId for each request', async () => {
        const first = await call();
        const second = await call();

        expect(first.jobId).not.toBe(second.jobId);
      });

      it('does not delete the file, log or emit when the pipeline succeeds', async () => {
        await call();
        await flush();

        expect(h.unlink).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
      });

      it('fails before creating the job when the JWT has no user id (current behaviour)', async () => {
        await expect(call(makeFile(), makeReq({}))).rejects.toThrow(
          'JWT sem identificador de usuário',
        );

        expect(gateway.createEmitter).not.toHaveBeenCalled();
        expect(service.run).not.toHaveBeenCalled();
        expect(h.unlink).not.toHaveBeenCalled(); // the upload stays on disk
      });
    });

    describe('background failures (safety net)', () => {
      it('logs the error and emits a safe error event', async () => {
        const failure = new Error('database down');
        service.run.mockRejectedValue(failure);

        const { jobId } = await call();
        await flush();

        expect(errorSpy).toHaveBeenCalledWith(
          `[capex/pipeline] Erro no job ${jobId}`,
          failure.stack,
        );
        expect(h.safeMessage).toHaveBeenCalledWith(failure);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith({
          phase: 'error',
          processed: 0,
          percentage: 0,
          message: SAFE_MESSAGE,
        });
      });

      it('handles rejections without a stack', async () => {
        service.run.mockRejectedValue(undefined);

        const { jobId } = await call();
        await flush();

        expect(errorSpy).toHaveBeenCalledWith(
          `[capex/pipeline] Erro no job ${jobId}`,
          undefined,
        );
        expect(h.safeMessage).toHaveBeenCalledWith(undefined);
        expect(emit).toHaveBeenCalledWith(
          expect.objectContaining({ phase: 'error', message: SAFE_MESSAGE }),
        );
      });

      it('does not affect the HTTP response', async () => {
        service.run.mockRejectedValue(new Error('boom'));

        await expect(call()).resolves.toMatchObject({
          statusCode: HttpStatus.ACCEPTED,
        });
      });

      it('never exposes the raw error message in the event', async () => {
        service.run.mockRejectedValue(new Error('password=secret'));

        await call();
        await flush();

        expect(JSON.stringify(emit.mock.calls)).not.toContain('secret');
      });
    });
  });
});
