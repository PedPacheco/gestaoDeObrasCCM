import { Test } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { DownloadFileService } from 'src/application/usecases/downloadFile.service';
import {
  FILE_STORAGE,
  IFileStorage,
} from 'src/domain/contracts/storage/IFileStorage';
import { StorageKind, StoredFile } from 'src/domain/types';

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// ─── Helpers ────────────────────────────────────────────────────────

/** Mock that implements every method of the port. */
const makeStorage = () =>
  ({
    open: vi.fn(),
    deleteStored: vi.fn(),
    deleteUploaded: vi.fn(),
  }) satisfies Record<keyof IFileStorage, Mock>;

const makeStoredFile = (content = '%PDF-1.4'): StoredFile => ({
  stream: Readable.from([content]),
  size: Buffer.byteLength(content),
});

// ─── Suite ──────────────────────────────────────────────────────────

describe('DownloadFileService', () => {
  let storage: ReturnType<typeof makeStorage>;
  let service: DownloadFileService;

  beforeEach(() => {
    storage = makeStorage();
    service = new DownloadFileService(storage as unknown as IFileStorage);
  });

  describe('execute', () => {
    it.each([StorageKind.VIABILIDADE, StorageKind.AS_BUILD])(
      'delegates to storage.open with kind %s and the given name',
      async (kind) => {
        storage.open.mockResolvedValue(null);

        await service.execute(kind, 'abc.pdf');

        expect(storage.open).toHaveBeenCalledTimes(1);
        expect(storage.open).toHaveBeenCalledWith(kind, 'abc.pdf');
      },
    );

    it('returns the exact StoredFile provided by the storage', async () => {
      const file = makeStoredFile();
      storage.open.mockResolvedValue(file);

      const result = await service.execute(StorageKind.VIABILIDADE, 'abc.pdf');

      expect(result).toBe(file); // same reference: no copy, no wrapping
      expect(result?.size).toBe(8);
    });

    it('returns null when the file is not available', async () => {
      storage.open.mockResolvedValue(null);

      await expect(
        service.execute(StorageKind.AS_BUILD, 'missing.pdf'),
      ).resolves.toBeNull();
    });

    it('propagates storage errors without swallowing them', async () => {
      const error = Object.assign(new Error('permission denied'), {
        code: 'EACCES',
      });
      storage.open.mockRejectedValue(error);

      await expect(
        service.execute(StorageKind.VIABILIDADE, 'locked.pdf'),
      ).rejects.toBe(error);
    });

    it('never calls delete methods of the storage', async () => {
      storage.open.mockResolvedValue(makeStoredFile());

      await service.execute(StorageKind.VIABILIDADE, 'abc.pdf');

      expect(storage.deleteStored).not.toHaveBeenCalled();
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('passes the name through unchanged (validation belongs to the caller)', async () => {
      storage.open.mockResolvedValue(null);

      await service.execute(StorageKind.VIABILIDADE, '../x.pdf');

      expect(storage.open).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        '../x.pdf',
      );
    });
  });

  describe('dependency injection', () => {
    it('resolves the storage through the FILE_STORAGE token', async () => {
      const injected = makeStorage();
      const file = makeStoredFile();
      injected.open.mockResolvedValue(file);

      const moduleRef = await Test.createTestingModule({
        providers: [
          DownloadFileService,
          { provide: FILE_STORAGE, useValue: injected },
        ],
      }).compile();

      const resolved = moduleRef.get(DownloadFileService);

      await expect(
        resolved.execute(StorageKind.AS_BUILD, 'abc.pdf'),
      ).resolves.toBe(file);
      expect(injected.open).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        'abc.pdf',
      );
    });
  });
});
