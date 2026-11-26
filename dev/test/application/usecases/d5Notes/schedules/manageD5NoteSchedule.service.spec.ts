import { BadRequestException, NotFoundException } from '@nestjs/common';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5Notes/d5NotesScheduleMapper';
import type {
  CreateD5ScheduleInput,
  RejectD5ScheduleInput,
  UpdateD5ScheduleInput,
} from 'src/application/types';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import type { ID5NotesSchedulesRepository } from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import type { IFileStorage } from 'src/domain/contracts/storage/IFileStorage';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service';
import type { D5ScheduleDetail } from 'src/domain/types';
import { StorageKind } from 'src/domain/types';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

const { loggerError } = vi.hoisted(() => ({ loggerError: vi.fn() }));

vi.mock('src/core/logger/logger.service', () => ({
  AppLogger: class {
    error = loggerError;
  },
}));

vi.mock('src/application/mappers/d5Notes/d5NotesScheduleMapper', () => ({
  D5NoteScheduleMapper: {
    fromCreateInput: vi.fn(),
    fromUpdateInput: vi.fn(),
    toRejectionData: vi.fn(),
  },
}));

vi.mock('src/domain/entities/schedules/d5NotesSchedule.entity', () => ({
  D5NoteSchedule: { create: vi.fn() },
}));

vi.mock('src/domain/services/resolveFileDiff.service', () => ({
  resolveFileDiff: vi.fn(),
}));

vi.mock('src/shared/upload/storedFileName', () => ({
  uploadedPaths: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const makeFile = (filename: string): Express.Multer.File =>
  ({ filename, path: `/tmp/uploads/${filename}` }) as Express.Multer.File;

const makeSchedule = (
  overrides: Partial<D5NoteSchedule> = {},
): D5NoteSchedule =>
  ({
    d5NoteId: 10,
    creatorUserId: 3,
    filePaths: ['old-a.pdf', 'old-b.pdf'],
    rejected: false,
    ...overrides,
  }) as unknown as D5NoteSchedule;

const makeDetail = (id: number): D5ScheduleDetail =>
  ({ id, d5NoteId: 10 }) as unknown as D5ScheduleDetail;

const createInput = {
  d5NoteId: 10,
  scheduledDate: '2026-11-20',
  prog: 50,
  startTime: '08:00',
  endTime: '12:00',
  creatorUserId: 3,
  modifyingUserId: 3,
} as CreateD5ScheduleInput;

const updateInput: UpdateD5ScheduleInput = {
  prog: 80,
  keptFiles: ['old-a.pdf'],
};

// ─── Suite ────────────────────────────────────────────────────────────

describe('ManageD5NoteScheduleService', () => {
  let repository: Mocked<ID5NotesSchedulesRepository>;
  let storage: Mocked<IFileStorage>;
  let service: ManageD5NoteScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      get: vi.fn(),
      getTotals: vi.fn(),
      getById: vi.fn(),
      getStoredFiles: vi.fn(),
      getByD5NoteId: vi.fn(),
      findRejections: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      updateAndSyncWorkStatus: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      rejectMany: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<ID5NotesSchedulesRepository>;

    storage = {
      deleteStored: vi.fn().mockResolvedValue(undefined),
      deleteUploaded: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IFileStorage>;

    vi.mocked(uploadedPaths).mockImplementation((files) =>
      (Array.isArray(files) ? files : files ? [files] : []).map((f) => f.path),
    );
    vi.mocked(resolveFileDiff).mockReturnValue({
      finalPaths: ['old-a.pdf', 'new-1.pdf'],
      toRemove: ['old-b.pdf'],
    });

    service = new ManageD5NoteScheduleService(repository, storage);
  });

  // ═══ create ═════════════════════════════════════════════════════════

  describe('create', () => {
    it('throws BadRequestException when no data is provided', async () => {
      await expect(
        service.create(undefined as unknown as CreateD5ScheduleInput),
      ).rejects.toThrow(
        new BadRequestException('Nenhuma programação fornecida para inserção.'),
      );

      expect(D5NoteSchedule.create).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('maps the input, builds the entity and persists it', async () => {
      const props = { d5NoteId: 10 };
      const entity = makeSchedule();
      vi.mocked(D5NoteScheduleMapper.fromCreateInput).mockReturnValue(
        props as never,
      );
      vi.mocked(D5NoteSchedule.create).mockReturnValue(entity);

      await service.create(createInput);

      expect(D5NoteScheduleMapper.fromCreateInput).toHaveBeenCalledWith(
        createInput,
      );
      expect(D5NoteSchedule.create).toHaveBeenCalledWith(props);
      expect(repository.create).toHaveBeenCalledWith(entity);
    });

    it('propagates entity validation errors without persisting', async () => {
      const validationError = new Error('Data de programação inválida');
      vi.mocked(D5NoteSchedule.create).mockImplementation(() => {
        throw validationError;
      });

      await expect(service.create(createInput)).rejects.toBe(validationError);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  // ═══ update ═════════════════════════════════════════════════════════

  describe('update', () => {
    const files = [makeFile('new-1.pdf')];
    const modifyingUserId = 7;

    it('throws BadRequestException when no data is provided', async () => {
      await expect(
        service.update(
          1,
          undefined as unknown as UpdateD5ScheduleInput,
          files,
          modifyingUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException('Nenhuma programação fornecida para inserção.'),
      );

      expect(repository.getById).not.toHaveBeenCalled();
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('updates the schedule and removes the replaced files after the commit', async () => {
      const current = makeSchedule();
      const props = { id: 1 };
      const updated = makeSchedule({ rejected: true });
      repository.getById.mockResolvedValue(current);
      vi.mocked(D5NoteScheduleMapper.fromUpdateInput).mockReturnValue(
        props as never,
      );
      vi.mocked(D5NoteSchedule.create).mockReturnValue(updated);

      await service.update(1, updateInput, files, modifyingUserId);

      expect(resolveFileDiff).toHaveBeenCalledWith(
        ['old-a.pdf', 'old-b.pdf'],
        ['old-a.pdf'],
        ['new-1.pdf'],
      );
      expect(D5NoteScheduleMapper.fromUpdateInput).toHaveBeenCalledWith(
        updateInput,
        {
          id: 1,
          d5NoteId: 10,
          creatorUserId: 3,
          modifyingUserId,
          filePaths: ['old-a.pdf', 'new-1.pdf'],
          current,
        },
      );
      expect(D5NoteSchedule.create).toHaveBeenCalledWith(props);
      expect(repository.updateAndSyncWorkStatus).toHaveBeenCalledWith(
        1,
        updated,
        true,
      );
      expect(storage.deleteStored).toHaveBeenCalledWith(StorageKind.AS_BUILD, [
        'old-b.pdf',
      ]);
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('deletes the old files only after the database update', async () => {
      repository.getById.mockResolvedValue(makeSchedule());
      vi.mocked(D5NoteSchedule.create).mockReturnValue(makeSchedule());

      await service.update(1, updateInput, files, modifyingUserId);

      const updateOrder =
        repository.updateAndSyncWorkStatus.mock.invocationCallOrder[0];
      const deleteOrder = storage.deleteStored.mock.invocationCallOrder[0];
      expect(updateOrder).toBeLessThan(deleteOrder);
    });

    it('treats missing uploads and missing stored files as empty lists', async () => {
      repository.getById.mockResolvedValue(
        makeSchedule({ filePaths: undefined }),
      );
      vi.mocked(D5NoteSchedule.create).mockReturnValue(makeSchedule());

      await service.update(
        1,
        updateInput,
        undefined as unknown as Express.Multer.File[],
        modifyingUserId,
      );

      expect(resolveFileDiff).toHaveBeenCalledWith([], ['old-a.pdf'], []);
      expect(repository.updateAndSyncWorkStatus).toHaveBeenCalled();
    });

    it('throws NotFoundException and removes the new uploads when the schedule does not exist', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(
        service.update(1, updateInput, files, modifyingUserId),
      ).rejects.toThrow(new NotFoundException('Programação não encontrada.'));

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['/tmp/uploads/new-1.pdf'],
      );
      expect(repository.updateAndSyncWorkStatus).not.toHaveBeenCalled();
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('removes the new uploads when the database update fails', async () => {
      const dbError = new Error('database down');
      repository.getById.mockResolvedValue(makeSchedule());
      vi.mocked(D5NoteSchedule.create).mockReturnValue(makeSchedule());
      repository.updateAndSyncWorkStatus.mockRejectedValue(dbError);

      await expect(
        service.update(1, updateInput, files, modifyingUserId),
      ).rejects.toBe(dbError);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['/tmp/uploads/new-1.pdf'],
      );
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('keeps the new uploads when the failure happens after the commit', async () => {
      const diskError = new Error('disk error');
      repository.getById.mockResolvedValue(makeSchedule());
      vi.mocked(D5NoteSchedule.create).mockReturnValue(makeSchedule());
      storage.deleteStored.mockRejectedValue(diskError);

      await expect(
        service.update(1, updateInput, files, modifyingUserId),
      ).rejects.toBe(diskError);

      expect(repository.updateAndSyncWorkStatus).toHaveBeenCalled();
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('logs the stack and rethrows the original error when the upload cleanup fails with an Error', async () => {
      const originalError = new NotFoundException(
        'Programação não encontrada.',
      );
      const cleanupError = new Error('cannot remove file');
      repository.getById.mockResolvedValue(null);
      storage.deleteUploaded.mockRejectedValue(cleanupError);

      await expect(
        service.update(1, updateInput, files, modifyingUserId),
      ).rejects.toThrow(originalError);

      expect(loggerError).toHaveBeenCalledWith(
        'Falha ao remover uploads órfãos da programação 1',
        cleanupError.stack,
      );
    });

    it('logs the raw value when the upload cleanup fails with a non-Error', async () => {
      repository.getById.mockResolvedValue(null);
      storage.deleteUploaded.mockRejectedValue('cleanup failed');

      await expect(
        service.update(1, updateInput, files, modifyingUserId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(loggerError).toHaveBeenCalledWith(
        'Falha ao remover uploads órfãos da programação 1',
        'cleanup failed',
      );
    });
  });

  // ═══ delete ═════════════════════════════════════════════════════════

  describe('delete', () => {
    it('throws BadRequestException when no id is provided', async () => {
      await expect(service.delete(0)).rejects.toThrow(
        new BadRequestException('Programação não enviada para exclusão.'),
      );
      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the schedule does not exist', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(
        new NotFoundException('Programação não encontrada.'),
      );
      expect(repository.delete).not.toHaveBeenCalled();
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('deletes the record first and the stored files afterwards', async () => {
      repository.getById.mockResolvedValue(makeSchedule());

      await service.delete(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(storage.deleteStored).toHaveBeenCalledWith(StorageKind.AS_BUILD, [
        'old-a.pdf',
        'old-b.pdf',
      ]);
      expect(repository.delete.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteStored.mock.invocationCallOrder[0],
      );
    });

    it('uses an empty file list when the schedule has no stored files', async () => {
      repository.getById.mockResolvedValue(
        makeSchedule({ filePaths: undefined }),
      );

      await service.delete(1);

      expect(storage.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        [],
      );
    });

    it('does not touch the disk when the database delete fails', async () => {
      const dbError = new Error('foreign key violation');
      repository.getById.mockResolvedValue(makeSchedule());
      repository.delete.mockRejectedValue(dbError);

      await expect(service.delete(1)).rejects.toBe(dbError);
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });
  });

  // ═══ reject ═════════════════════════════════════════════════════════

  describe('reject', () => {
    const rejectingUserId = 9;

    it('does nothing when the rejection list is empty', async () => {
      await service.reject(10, [], rejectingUserId);

      expect(repository.getByD5NoteId).not.toHaveBeenCalled();
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException listing the schedules that do not belong to the note', async () => {
      repository.getByD5NoteId.mockResolvedValue([makeDetail(1)]);
      const data: RejectD5ScheduleInput[] = [
        { id: 1, restrictionId: 2, description: 'ok' },
        { id: 5, restrictionId: 2, description: 'missing' },
        { id: 6, restrictionId: 2, description: 'missing' },
      ];

      await expect(service.reject(10, data, rejectingUserId)).rejects.toThrow(
        new NotFoundException(
          'Programações não encontradas para esta nota D5: 5, 6',
        ),
      );
      expect(D5NoteScheduleMapper.toRejectionData).not.toHaveBeenCalled();
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    it('builds one rejection per schedule and rejects them in a single call', async () => {
      const first = makeDetail(1);
      const second = makeDetail(2);
      repository.getByD5NoteId.mockResolvedValue([first, second]);
      vi.mocked(D5NoteScheduleMapper.toRejectionData)
        .mockReturnValueOnce({ description: 'r1' } as never)
        .mockReturnValueOnce({ description: 'r2' } as never);

      const data: RejectD5ScheduleInput[] = [
        { id: 1, restrictionId: 4, description: 'r1' },
        { id: 2, restrictionId: 5, description: 'r2' },
      ];

      await service.reject(10, data, rejectingUserId);

      expect(repository.getByD5NoteId).toHaveBeenCalledWith(10);
      expect(D5NoteScheduleMapper.toRejectionData).toHaveBeenNthCalledWith(
        1,
        first,
        {
          restrictionId: 4,
          description: 'r1',
          rejectingUserId,
        },
      );
      expect(D5NoteScheduleMapper.toRejectionData).toHaveBeenNthCalledWith(
        2,
        second,
        {
          restrictionId: 5,
          description: 'r2',
          rejectingUserId,
        },
      );
      expect(repository.rejectMany).toHaveBeenCalledWith(
        [1, 2],
        [{ description: 'r1' }, { description: 'r2' }],
        10,
      );
    });
  });
});
