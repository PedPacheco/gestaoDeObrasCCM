import { unlink as unlinkCallback } from 'fs';
import { access, mkdtemp, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

import {
  BadRequestException,
  Logger,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  defer,
  lastValueFrom,
  of,
  throwError,
  toArray,
  type Observable,
} from 'rxjs';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import {
  CleanupUploadsOnErrorInterceptor,
  collectUploadedFiles,
} from 'src/core/interceptors/cleanupUploadsOnError.interceptor';

// The specifier must match the source import ('fs/promises').
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, unlink: vi.fn() };
});

/** Real deletion, independent of the mocked 'fs/promises' module. */
const realUnlink = promisify(unlinkCallback);
const unlinkMock = vi.mocked(unlink);

// ─── Helpers ────────────────────────────────────────────────────────
type UploadParts = { file?: unknown; files?: unknown };

const multerFile = (path?: string, fieldname = 'file'): Express.Multer.File =>
  ({
    fieldname,
    originalname: 'upload.xlsx',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 1,
    path,
  }) as Express.Multer.File;

const makeReq = (parts: UploadParts = {}) => parts as unknown as Request;

const context = (req: Request) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
  }) as unknown as ExecutionContext;

const handler = (source: Observable<unknown>): CallHandler => ({
  handle: () => source,
});

const errnoError = (code?: string) =>
  Object.assign(new Error(`unlink failed (${code})`), code ? { code } : {});

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

/** Awaits a promise that must reject and returns the rejection reason. */
const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected the promise to reject');
    },
    (reason: unknown) => reason,
  );

/** Reports whether the promise is still pending after pending callbacks run. */
const state = (promise: Promise<unknown>) =>
  Promise.race([
    promise.then(
      () => 'fulfilled',
      () => 'rejected',
    ),
    new Promise((resolve) => setTimeout(resolve, 0, 'pending')),
  ]);

// ─── Suite ──────────────────────────────────────────────────────────
describe('collectUploadedFiles', () => {
  const a = multerFile('/uploads/a.xlsx');
  const b = multerFile('/uploads/b.pdf', 'docs');
  const c = multerFile('/uploads/c.png', 'photos');

  it.each([
    ['no upload fields', {}],
    ['files is null', { files: null }],
    ['files is an empty array', { files: [] }],
    ['files is an empty object', { files: {} }],
  ])('returns [] when there are %s', (_, parts) => {
    expect(collectUploadedFiles(makeReq(parts))).toEqual([]);
  });

  it('returns the single file of FileInterceptor', () => {
    expect(collectUploadedFiles(makeReq({ file: a }))).toEqual([a]);
  });

  it('returns the files of FilesInterceptor (array)', () => {
    expect(collectUploadedFiles(makeReq({ files: [a, b] }))).toEqual([a, b]);
  });

  it('flattens the files of FileFieldsInterceptor (object of arrays)', () => {
    expect(
      collectUploadedFiles(makeReq({ files: { docs: [a, b], photos: [c] } })),
    ).toEqual([a, b, c]);
  });

  it('combines req.file and req.files, with req.file first', () => {
    expect(collectUploadedFiles(makeReq({ file: a, files: [b, c] }))).toEqual([
      a,
      b,
      c,
    ]);
  });

  it('ignores memoryStorage files (no path) and files with an empty path', () => {
    expect(
      collectUploadedFiles(
        makeReq({
          file: multerFile(undefined),
          files: [
            multerFile(''),
            a,
            { ...multerFile(), buffer: Buffer.from('x') },
          ],
        }),
      ),
    ).toEqual([a]);
  });

  it('ignores null and undefined entries', () => {
    expect(
      collectUploadedFiles(makeReq({ files: { docs: [null, a, undefined] } })),
    ).toEqual([a]);
  });
});

describe('CleanupUploadsOnErrorInterceptor', () => {
  let dir: string;
  let interceptor: CleanupUploadsOnErrorInterceptor;
  let warnSpy: MockInstance;

  const run = (req: Request, source: Observable<unknown>) =>
    lastValueFrom(
      interceptor.intercept(context(req), handler(source)).pipe(toArray()),
    );

  /** Creates a real file in the temporary folder and returns its path. */
  const upload = async (name: string) => {
    const path = join(dir, name);
    await writeFile(path, 'content');
    return path;
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cleanup-uploads-'));
    unlinkMock.mockReset().mockImplementation((path) => realUnlink(path));
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    interceptor = new CleanupUploadsOnErrorInterceptor();
  });

  afterEach(async () => {
    warnSpy.mockRestore();
    await rm(dir, { recursive: true, force: true });
  });

  it('uses a real unlink that is not the mock itself (test setup)', () => {
    expect(realUnlink).not.toBe(unlinkMock);
  });

  // ───────────────────────────────────────────────────────────────────
  describe('when the request succeeds', () => {
    it('passes every emitted value through unchanged', async () => {
      await expect(run(makeReq(), of(1, 2, 3))).resolves.toEqual([1, 2, 3]);
    });

    it('keeps the uploaded files', async () => {
      const path = await upload('a.xlsx');

      await run(makeReq({ file: multerFile(path) }), of({ ok: true }));

      expect(await exists(path)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('when the request fails', () => {
    it('deletes the uploaded file and rethrows the original error', async () => {
      const path = await upload('a.xlsx');
      const error = new BadRequestException('Planilha inválida');

      const reason = await rejection(
        run(
          makeReq({ file: multerFile(path) }),
          throwError(() => error),
        ),
      );

      expect(reason).toBe(error);
      expect(await exists(path)).toBe(false);
      expect(unlinkMock).toHaveBeenCalledWith(path);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('deletes the files of every upload field', async () => {
      const single = await upload('single.xlsx');
      const doc = await upload('doc.pdf');
      const photo = await upload('photo.png');

      await rejection(
        run(
          makeReq({
            file: multerFile(single),
            files: {
              docs: [multerFile(doc, 'docs')],
              photos: [multerFile(photo, 'photos')],
            },
          }),
          throwError(() => new Error('boom')),
        ),
      );

      expect(await exists(single)).toBe(false);
      expect(await exists(doc)).toBe(false);
      expect(await exists(photo)).toBe(false);
      expect(unlinkMock).toHaveBeenCalledTimes(3);
    });

    it('rethrows non-Error values unchanged', async () => {
      await expect(
        run(
          makeReq(),
          throwError(() => 'boom'),
        ),
      ).rejects.toBe('boom');
    });

    it('does not call unlink when there are no files on disk', async () => {
      const error = new Error('boom');

      await expect(
        run(
          makeReq({ file: { ...multerFile(), buffer: Buffer.from('x') } }),
          throwError(() => error),
        ),
      ).rejects.toBe(error);

      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('collects the files at failure time, not when the request starts', async () => {
      const path = await upload('late.xlsx');
      const req = makeReq();

      await rejection(
        run(
          req,
          defer(() => {
            // e.g. the FileInterceptor runs after this interceptor
            (req as UploadParts).file = multerFile(path);
            return throwError(() => new Error('boom'));
          }),
        ),
      );

      expect(await exists(path)).toBe(false);
    });

    it('only propagates the error after the cleanup has finished', async () => {
      let release!: () => void;
      unlinkMock.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );

      const result = run(
        makeReq({ file: multerFile(join(dir, 'slow.xlsx')) }),
        throwError(() => new Error('boom')),
      );

      expect(await state(result)).toBe('pending');
      release();
      await expect(result).rejects.toThrow('boom');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('cleanup failures', () => {
    it('ignores files that no longer exist (ENOENT)', async () => {
      const error = new Error('boom');

      await expect(
        run(
          makeReq({ file: multerFile(join(dir, 'missing.xlsx')) }),
          throwError(() => error),
        ),
      ).rejects.toBe(error);

      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('logs other unlink errors and still rethrows the original error', async () => {
      const path = join(dir, 'locked.xlsx');
      const error = new Error('boom');
      unlinkMock.mockRejectedValueOnce(errnoError('EACCES'));

      await expect(
        run(
          makeReq({ file: multerFile(path) }),
          throwError(() => error),
        ),
      ).rejects.toBe(error);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        `Falha ao apagar upload órfão ${path}: EACCES`,
      );
    });

    it('keeps deleting the other files when one of them fails', async () => {
      const locked = join(dir, 'locked.xlsx');
      const ok = await upload('ok.xlsx');
      unlinkMock.mockRejectedValueOnce(errnoError('EPERM'));

      await rejection(
        run(
          makeReq({ files: [multerFile(locked), multerFile(ok)] }),
          throwError(() => new Error('boom')),
        ),
      );

      expect(await exists(ok)).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        `Falha ao apagar upload órfão ${locked}: EPERM`,
      );
    });

    it('logs the path of the file that actually failed', async () => {
      const first = join(dir, 'first.xlsx');
      const second = join(dir, 'second.xlsx');
      unlinkMock
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(errnoError('EBUSY'));

      await rejection(
        run(
          makeReq({ files: [multerFile(first), multerFile(second)] }),
          throwError(() => new Error('boom')),
        ),
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        `Falha ao apagar upload órfão ${second}: EBUSY`,
      );
    });

    it.each([
      ['an error without code', errnoError()],
      ['an undefined reason', undefined],
    ])(
      'logs "undefined" as the code for %s (current behaviour)',
      async (_, reason) => {
        const path = join(dir, 'a.xlsx');
        unlinkMock.mockRejectedValueOnce(reason);

        await rejection(
          run(
            makeReq({ file: multerFile(path) }),
            throwError(() => new Error('boom')),
          ),
        );

        expect(warnSpy).toHaveBeenCalledWith(
          `Falha ao apagar upload órfão ${path}: undefined`,
        );
      },
    );
  });
});
