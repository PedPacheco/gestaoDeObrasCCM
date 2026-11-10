import { access, mkdir, mkdtemp, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';

import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
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

import { StorageKind } from 'src/domain/contracts/storage/IFileStorage';
import { LocalFileStorage } from 'src/infra/storage/localFileStorage';

// Wraps the real `unlink` in a vi.fn so specific failures can be simulated,
// while keeping the real behaviour in all other tests.
// The specifier must match the one used in the source ('fs/promises').
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, unlink: vi.fn(actual.unlink) };
});

const unlinkMock = vi.mocked(unlink);

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
    await rm(root, { recursive: true, force: true });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('base directory configuration', () => {
    it.each([
      [StorageKind.VIABILIDADE, 'UPLOAD_DEST'],
      [StorageKind.AS_BUILD, 'UPLOAD_AS_BUILD'],
    ])('reads the base dir of kind %s from %s', (kind, envKey) => {
      const expectedBase =
        kind === StorageKind.AS_BUILD ? asBuildDir : uploadsDir;

      expect(storage.resolve(kind, 'a.pdf')).toBe(join(expectedBase, 'a.pdf'));
      expect(config.getOrThrow).toHaveBeenCalledWith(envKey);
    });

    it('throws synchronously when the env variable is missing', () => {
      const bare = new LocalFileStorage(
        makeConfig({}) as unknown as ConfigService,
      );

      expect(() => bare.resolve(StorageKind.VIABILIDADE, 'a.pdf')).toThrow(
        'UPLOAD_DEST',
      );
      expect(() => bare.deleteStored(StorageKind.AS_BUILD, ['a.pdf'])).toThrow(
        'UPLOAD_AS_BUILD',
      );
      expect(() => bare.deleteUploaded(StorageKind.VIABILIDADE, [])).toThrow(
        'UPLOAD_DEST',
      );
      expect(unlinkMock).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('resolve', () => {
    it('joins the name with the base dir', () => {
      expect(storage.resolve(StorageKind.VIABILIDADE, 'a.pdf')).toBe(
        join(uploadsDir, 'a.pdf'),
      );
    });

    it('supports nested names', () => {
      expect(storage.resolve(StorageKind.AS_BUILD, 'sub/a.pdf')).toBe(
        join(asBuildDir, 'sub', 'a.pdf'),
      );
    });

    it('does not guard against traversal (current behaviour)', () => {
      expect(storage.resolve(StorageKind.VIABILIDADE, '../outside/a.pdf')).toBe(
        join(outsideDir, 'a.pdf'),
      );
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

    it('refuses names starting with ".." even inside the base dir (current behaviour)', async () => {
      const file = await touch(join(uploadsDir, '..hidden.pdf'));

      await storage.deleteStored(StorageKind.VIABILIDADE, ['..hidden.pdf']);

      expect(await exists(file)).toBe(true);
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
});
