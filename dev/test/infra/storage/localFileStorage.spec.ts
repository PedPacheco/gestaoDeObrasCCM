import {
  access,
  mkdir,
  mkdtemp,
  open,
  rm,
  unlink,
  writeFile,
  type FileHandle,
} from 'fs/promises';
import { once } from 'node:events';
import { text } from 'node:stream/consumers';
import { tmpdir } from 'os';
import { dirname, join } from 'path';

import { LocalFileStorage } from 'src/infra/storage/localFileStorage';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  MockInstance,
  vi,
} from 'vitest';

import { Logger } from '@nestjs/common';

import type { ConfigService } from '@nestjs/config';
import { StorageKind } from 'src/domain/types';
// Wraps the real `unlink` in a vi.fn so specific failures can be simulated,
// while keeping the real behaviour in all other tests.
// The specifier must match the one used in the source ('fs/promises').
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    unlink: vi.fn(actual.unlink),
    open: vi.fn(actual.open),
  };
});

const unlinkMock = vi.mocked(unlink);
const openMock = vi.mocked(open);

const fakeHandle = (overrides: {
  stat?: () => Promise<unknown>;
  close?: () => Promise<void>;
}) =>
  ({
    stat: vi.fn(
      overrides.stat ??
        (() => Promise.resolve({ isFile: () => true, size: 0 })),
    ),
    close: vi.fn(overrides.close ?? (() => Promise.resolve())),
  }) as unknown as FileHandle & { stat: Mock; close: Mock };

// ─── Helpers ────────────────────────────────────────────────────────
const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

const errnoError = (message: string, code?: string): NodeJS.ErrnoException =>
  Object.assign(new Error(message), code ? { code } : {});

/** Fake ConfigService that mimics getOrThrow for the given env. */
const makeConfig = (env: Record<string, string>) => ({
  getOrThrow: vi.fn((key: string) => {
    if (!(key in env)) {
      throw new TypeError(`Configuration key "${key}" does not exist`);
    }
    return env[key];
  }),
});

/** Creates a file (and its parent folders) with dummy content. */
const touch = async (path: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'x');
  return path;
};

// ─── Suite ──────────────────────────────────────────────────────────
describe('LocalFileStorage', () => {
  let root: string;
  let uploadsDir: string;
  let asBuildDir: string;
  let outsideDir: string;
  let config: { getOrThrow: Mock };
  let storage: LocalFileStorage;
  let warnSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'local-file-storage-'));
    uploadsDir = join(root, 'uploads');
    asBuildDir = join(root, 'as-build');
    outsideDir = join(root, 'outside');
    await Promise.all(
      [uploadsDir, asBuildDir, outsideDir].map((d) => mkdir(d)),
    );

    config = makeConfig({
      UPLOAD_DEST: uploadsDir,
      UPLOAD_AS_BUILD: asBuildDir,
    });
    storage = new LocalFileStorage(config as unknown as ConfigService);

    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    unlinkMock.mockClear();
    openMock.mockClear();
    await rm(root, { recursive: true, force: true });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('base directory configuration', () => {
    it.each([
      [StorageKind.VIABILIDADE, 'UPLOAD_DEST', 'from-uploads'],
      [StorageKind.AS_BUILD, 'UPLOAD_AS_BUILD', 'from-as-build'],
    ])(
      'reads the base dir of kind %s from %s',
      async (kind, envKey, expected) => {
        // Same name in both folders, different content: proves which base was used
        await writeFile(join(uploadsDir, 'a.pdf'), 'from-uploads');
        await writeFile(join(asBuildDir, 'a.pdf'), 'from-as-build');

        const file = await storage.open(kind, 'a.pdf');

        expect(file).not.toBeNull();
        expect(await text(file!.stream)).toBe(expected);
        expect(config.getOrThrow).toHaveBeenCalledWith(envKey);
      },
    );

    it('throws synchronously on delete when the env variable is missing', () => {
      const bare = new LocalFileStorage(
        makeConfig({}) as unknown as ConfigService,
      );

      expect(() => bare.deleteStored(StorageKind.AS_BUILD, ['a.pdf'])).toThrow(
        'UPLOAD_AS_BUILD',
      );
      expect(() => bare.deleteUploaded(StorageKind.VIABILIDADE, [])).toThrow(
        'UPLOAD_DEST',
      );
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('rejects open() when the env variable is missing', async () => {
      const bare = new LocalFileStorage(
        makeConfig({}) as unknown as ConfigService,
      );

      await expect(bare.open(StorageKind.VIABILIDADE, 'a.pdf')).rejects.toThrow(
        'UPLOAD_DEST',
      );
      expect(openMock).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('deleteStored', () => {
    it('deletes the stored files by name inside the base dir', async () => {
      const a = await touch(join(uploadsDir, 'a.pdf'));
      const b = await touch(join(uploadsDir, 'sub', 'b.png'));

      await expect(
        storage.deleteStored(StorageKind.VIABILIDADE, ['a.pdf', 'sub/b.png']),
      ).resolves.toBeUndefined();

      expect(await exists(a)).toBe(false);
      expect(await exists(b)).toBe(false);
      expect(unlinkMock).toHaveBeenCalledWith(a);
      expect(unlinkMock).toHaveBeenCalledWith(b);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('uses the base dir of the given kind', async () => {
      const viab = await touch(join(uploadsDir, 'same.pdf'));
      const asBuild = await touch(join(asBuildDir, 'same.pdf'));

      await storage.deleteStored(StorageKind.AS_BUILD, ['same.pdf']);

      expect(await exists(asBuild)).toBe(false);
      expect(await exists(viab)).toBe(true);
    });

    it('ignores empty names', async () => {
      await storage.deleteStored(StorageKind.VIABILIDADE, ['', '']);

      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('resolves without calling unlink for an empty list', async () => {
      await expect(
        storage.deleteStored(StorageKind.VIABILIDADE, []),
      ).resolves.toBeUndefined();

      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('refuses traversal outside the base dir and logs a warning', async () => {
      const secret = await touch(join(outsideDir, 'secret.txt'));
      const name = '../outside/secret.txt';

      await storage.deleteStored(StorageKind.VIABILIDADE, [name]);

      expect(await exists(secret)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        `Exclusão recusada fora da pasta base: ${join(uploadsDir, name)}`,
      );
    });

    it('refuses deleting the base dir itself (".")', async () => {
      await storage.deleteStored(StorageKind.VIABILIDADE, ['.']);

      expect(await exists(uploadsDir)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('deletes names starting with ".." when they stay inside the base dir', async () => {
      const file = await touch(join(uploadsDir, '..hidden.pdf'));

      await storage.deleteStored(StorageKind.VIABILIDADE, ['..hidden.pdf']);

      expect(await exists(file)).toBe(false);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['parent dir itself', '..'],
      ['parent traversal', '../outside/secret.pdf'],
      ['nested traversal', 'a/../../outside/secret.pdf'],
    ])('refuses %s on delete', async (_label, name) => {
      const secret = await touch(join(outsideDir, 'secret.pdf'));

      await storage.deleteStored(StorageKind.VIABILIDADE, [name]);

      expect(await exists(secret)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('deleteUploaded', () => {
    it('deletes absolute paths inside the base dir, including subfolders', async () => {
      const a = await touch(join(uploadsDir, 'a.pdf'));
      const b = await touch(join(uploadsDir, 'tmp', 'b.png'));

      await expect(
        storage.deleteUploaded(StorageKind.VIABILIDADE, [a, b]),
      ).resolves.toBeUndefined();

      expect(await exists(a)).toBe(false);
      expect(await exists(b)).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('filters out empty paths', async () => {
      const a = await touch(join(uploadsDir, 'a.pdf'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, ['', a, '']);

      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(await exists(a)).toBe(false);
    });

    it('normalises the path before calling unlink', async () => {
      const a = await touch(join(uploadsDir, 'a.pdf'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, [
        join(uploadsDir, 'sub', '..', 'a.pdf'),
      ]);

      expect(unlinkMock).toHaveBeenCalledWith(a);
      expect(await exists(a)).toBe(false);
    });

    it('refuses an absolute path outside the base dir', async () => {
      const secret = await touch(join(outsideDir, 'secret.txt'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, [secret]);

      expect(await exists(secret)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        `Exclusão recusada fora da pasta base: ${secret}`,
      );
    });

    it('refuses a sibling dir that shares the base dir prefix', async () => {
      const evil = await touch(join(root, 'uploads-evil', 'a.pdf'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, [evil]);

      expect(await exists(evil)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('refuses a path that belongs to another kind', async () => {
      const asBuild = await touch(join(asBuildDir, 'a.pdf'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, [asBuild]);

      expect(await exists(asBuild)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('refuses relative paths (resolved against cwd, outside the base dir)', async () => {
      await storage.deleteUploaded(StorageKind.VIABILIDADE, ['a.pdf']);

      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        'Exclusão recusada fora da pasta base: a.pdf',
      );
    });

    it('refuses the base dir itself', async () => {
      await storage.deleteUploaded(StorageKind.VIABILIDADE, [uploadsDir]);

      expect(await exists(uploadsDir)).toBe(true);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it.runIf(process.platform === 'win32')(
      'refuses a path on another drive (Windows)',
      async () => {
        const otherDrive = /^z/i.test(uploadsDir) ? 'Y' : 'Z';

        await storage.deleteUploaded(StorageKind.VIABILIDADE, [
          `${otherDrive}:\\file.pdf`,
        ]);

        expect(unlinkMock).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledTimes(1);
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────
  describe('error handling (never rejects)', () => {
    it('silently ignores files that no longer exist (ENOENT)', async () => {
      const missing = join(uploadsDir, 'missing.pdf');

      await expect(
        storage.deleteUploaded(StorageKind.VIABILIDADE, [missing]),
      ).resolves.toBeUndefined();

      expect(unlinkMock).toHaveBeenCalledWith(missing);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs other unlink errors without rejecting', async () => {
      const target = join(uploadsDir, 'locked.pdf');
      unlinkMock.mockRejectedValueOnce(
        errnoError('permission denied', 'EACCES'),
      );

      await expect(
        storage.deleteUploaded(StorageKind.VIABILIDADE, [target]),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        `Falha ao apagar ${target}: permission denied`,
      );
    });

    it('logs errors that have no code', async () => {
      const target = join(uploadsDir, 'a.pdf');
      unlinkMock.mockRejectedValueOnce(errnoError('unexpected'));

      await storage.deleteUploaded(StorageKind.VIABILIDADE, [target]);

      expect(errorSpy).toHaveBeenCalledWith(
        `Falha ao apagar ${target}: unexpected`,
      );
    });

    it('processes every path even when some of them fail', async () => {
      const locked = join(uploadsDir, 'locked.pdf');
      const ok = await touch(join(uploadsDir, 'ok.pdf'));
      const missing = join(uploadsDir, 'missing.pdf');
      const outside = await touch(join(outsideDir, 'secret.txt'));

      unlinkMock.mockImplementationOnce(() =>
        Promise.reject(errnoError('permission denied', 'EACCES')),
      );

      await expect(
        storage.deleteUploaded(StorageKind.VIABILIDADE, [
          locked,
          ok,
          missing,
          outside,
        ]),
      ).resolves.toBeUndefined();

      expect(await exists(ok)).toBe(false);
      expect(await exists(outside)).toBe(true);
      expect(unlinkMock).toHaveBeenCalledTimes(3); // the outside path never reaches unlink
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('open', () => {
    it('returns the stream and size of an existing file', async () => {
      await writeFile(join(uploadsDir, 'doc.pdf'), '%PDF-1.4');

      const file = await storage.open(StorageKind.VIABILIDADE, 'doc.pdf');

      expect(file).not.toBeNull();
      expect(file!.size).toBe(8);
      expect(await text(file!.stream)).toBe('%PDF-1.4');
    });

    it('closes the file handle after the stream is consumed', async () => {
      await writeFile(join(uploadsDir, 'doc.pdf'), 'content');

      const file = await storage.open(StorageKind.VIABILIDADE, 'doc.pdf');
      const closed = once(file!.stream, 'close'); // attach before consuming

      await text(file!.stream);
      await closed;

      expect(file!.stream.destroyed).toBe(true);
    });

    it('opens files whose name starts with ".." but stay inside the base', async () => {
      await writeFile(join(uploadsDir, '..backup.pdf'), 'ok');

      const file = await storage.open(StorageKind.VIABILIDADE, '..backup.pdf');

      expect(file).not.toBeNull();
      expect(await text(file!.stream)).toBe('ok');
    });

    it('returns null for a missing file', async () => {
      await expect(
        storage.open(StorageKind.VIABILIDADE, 'missing.pdf'),
      ).resolves.toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('returns null for a directory', async () => {
      await mkdir(join(uploadsDir, 'folder.pdf'));

      await expect(
        storage.open(StorageKind.VIABILIDADE, 'folder.pdf'),
      ).resolves.toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('returns null when a path segment is a file (ENOTDIR)', async () => {
      await touch(join(uploadsDir, 'a.pdf'));

      await expect(
        storage.open(StorageKind.VIABILIDADE, 'a.pdf/b.pdf'),
      ).resolves.toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['parent traversal', () => '../outside/secret.pdf'],
      ['nested traversal', () => 'a/../../outside/secret.pdf'],
      ['absolute path', () => join(outsideDir, 'secret.pdf')],
      ['the base itself', () => ''],
    ])('refuses %s without touching the disk', async (_label, getName) => {
      await touch(join(outsideDir, 'secret.pdf'));

      await expect(
        storage.open(StorageKind.VIABILIDADE, getName()),
      ).resolves.toBeNull();

      expect(openMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Leitura recusada'),
      );
    });

    it('rethrows and logs unexpected errors (e.g. EACCES)', async () => {
      await writeFile(join(uploadsDir, 'locked.pdf'), 'x');
      openMock.mockRejectedValueOnce(errnoError('permission denied', 'EACCES'));

      await expect(
        storage.open(StorageKind.VIABILIDADE, 'locked.pdf'),
      ).rejects.toThrow('permission denied');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao abrir'),
      );
    });

    describe('open – error handling after the file is opened', () => {
      it('closes the handle and returns null when stat fails with a not-found code', async () => {
        const handle = fakeHandle({
          stat: () => Promise.reject(errnoError('gone', 'ENOENT')),
        });
        openMock.mockResolvedValueOnce(handle);

        await expect(
          storage.open(StorageKind.VIABILIDADE, 'doc.pdf'),
        ).resolves.toBeNull();

        expect(handle.close).toHaveBeenCalledTimes(1);
        expect(errorSpy).not.toHaveBeenCalled();
      });

      it('swallows a close() failure and rethrows the original error', async () => {
        const original = errnoError('io failure', 'EIO');
        const handle = fakeHandle({
          stat: () => Promise.reject(original),
          close: () => Promise.reject(new Error('close failed')),
        });
        openMock.mockResolvedValueOnce(handle);

        // The close() error must not replace the original one
        await expect(
          storage.open(StorageKind.VIABILIDADE, 'doc.pdf'),
        ).rejects.toBe(original);

        expect(handle.close).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('io failure'),
        );
      });

      it('swallows a close() failure and still returns null for not-found codes', async () => {
        const handle = fakeHandle({
          stat: () => Promise.reject(errnoError('gone', 'ENOENT')),
          close: () => Promise.reject(new Error('close failed')),
        });
        openMock.mockResolvedValueOnce(handle);

        await expect(
          storage.open(StorageKind.VIABILIDADE, 'doc.pdf'),
        ).resolves.toBeNull();
        expect(handle.close).toHaveBeenCalledTimes(1);
      });
    });

    describe('open – errors without code', () => {
      it('rethrows and logs an error that has no code (?? "" branch)', async () => {
        const error = errnoError('boom'); // no code → code ?? '' → not in NOT_FOUND_CODES
        openMock.mockRejectedValueOnce(error);

        await expect(
          storage.open(StorageKind.VIABILIDADE, 'doc.pdf'),
        ).rejects.toBe(error);

        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Falha ao abrir'),
        );
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('boom'));
      });

      it('rethrows when the handle exists and stat fails without code', async () => {
        const error = errnoError('stat exploded');
        const handle = fakeHandle({ stat: () => Promise.reject(error) });
        openMock.mockResolvedValueOnce(handle);

        await expect(
          storage.open(StorageKind.VIABILIDADE, 'doc.pdf'),
        ).rejects.toBe(error);
        expect(handle.close).toHaveBeenCalledTimes(1);
      });
    });
  });
});
