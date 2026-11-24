import { BadRequestException, NotFoundException } from '@nestjs/common';
import { toExecutionReportListItemOutput } from 'src/application/mappers/executionReportMapper';
import type {
  CreateExecutionReportInput,
  UpdateExecutionReportInput,
} from 'src/application/types';
import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import type { IExecutionReportRepository } from 'src/domain/contracts/IExecutionReportRepository';
import type { IFileStorage } from 'src/domain/contracts/storage/IFileStorage';
import type { IFindScheduleByIdRepository } from 'src/domain/contracts/works/schedule/IFindScheduleByIdRepository';
import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import { StorageKind } from 'src/domain/types';
// ⚠ ajuste ao import do service
import type { Prisma } from 'src/infra/generated/prisma/client';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/domain/entities/executionReport.entity', () => ({
  ExecutionReport: { create: vi.fn() },
}));

vi.mock('src/application/mappers/executionReportMapper', () => ({
  toExecutionReportListItemOutput: vi.fn((r) => ({ output: r.id })),
}));

vi.mock('src/shared/upload/storedFileName', () => ({
  uploadedPaths: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const REPORT_ID = 15;
const SCHEDULE_ID = 3;
const WORK_ID = 41;
const FINISH_TIME = new Date('2026-11-18T17:00:00Z');

const makeFile = (filename: string): Express.Multer.File =>
  ({ filename, path: `/tmp/uploads/${filename}` }) as Express.Multer.File;

const NEW_FILES = [makeFile('new-1.pdf'), makeFile('new-2.pdf')];
const NEW_PATHS = NEW_FILES.map((f) => f.path);

const createInput = {
  idSchedule: SCHEDULE_ID,
  workId: WORK_ID,
  userId: 9,
  supervisor: 'Ana',
} as unknown as CreateExecutionReportInput;

const updateInput = {
  supervisor: 'Rui',
  userId: 9,
} as unknown as UpdateExecutionReportInput;

const existingReport = {
  id: REPORT_ID,
  workId: WORK_ID,
  scheduleId: SCHEDULE_ID,
  filePaths: ['old-1.pdf', 'old-2.pdf'],
};

const builtReport = { built: true } as unknown as ExecutionReport;

// ─── Suite ────────────────────────────────────────────────────────────

describe('ExecutionReportService', () => {
  let tx: Prisma.TransactionClient;
  let prisma: { $transaction: ReturnType<typeof vi.fn> };
  let progress: { recomputeAll: ReturnType<typeof vi.fn> };
  let repository: Mocked<IExecutionReportRepository>;
  let scheduleRepository: Mocked<IFindScheduleByIdRepository>;
  let storage: Mocked<IFileStorage>;
  let logger: {
    error: ReturnType<typeof vi.fn>;
    errorWithMetadata: ReturnType<typeof vi.fn>;
  };
  let service: ExecutionReportService;

  beforeEach(() => {
    vi.clearAllMocks();

    tx = { __tx: true } as unknown as Prisma.TransactionClient;
    prisma = {
      $transaction: vi.fn(
        async (fn: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          fn(tx),
      ),
    };
    progress = { recomputeAll: vi.fn().mockResolvedValue(undefined) };

    repository = {
      findByWorkIdentifier: vi.fn().mockResolvedValue([]),
      findByScheduleId: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(existingReport),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      findScheduleWorkMode: vi
        .fn()
        .mockResolvedValue({ workId: WORK_ID, pointToPoint: false }),
      findScheduledServiceIds: vi.fn().mockResolvedValue([100, 101]),
      resetScheduleExecution: vi.fn().mockResolvedValue(undefined),
      clearServicesReal: vi.fn().mockResolvedValue(undefined),
      sumWorkSchedulesExec: vi.fn().mockResolvedValue(60),
      updateWorkStatusAfterReset: vi.fn().mockResolvedValue(undefined),
      deleteReport: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IExecutionReportRepository>;

    scheduleRepository = {
      findById: vi.fn().mockResolvedValue({
        id: SCHEDULE_ID,
        workId: WORK_ID,
        statusId: 2,
        finishTime: FINISH_TIME,
        rejected: false,
      }),
    } as unknown as Mocked<IFindScheduleByIdRepository>;

    storage = {
      deleteStored: vi.fn().mockResolvedValue(undefined),
      deleteUploaded: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IFileStorage>;

    logger = { error: vi.fn(), errorWithMetadata: vi.fn() };

    vi.mocked(uploadedPaths).mockImplementation((files) =>
      (Array.isArray(files) ? files : files ? [files] : []).map((f) => f.path),
    );
    vi.mocked(ExecutionReport.create).mockReturnValue(builtReport);

    service = new ExecutionReportService(
      prisma as never,
      progress as never,
      repository,
      scheduleRepository,
      storage,
      logger as never,
    );
  });

  // ═══ findByWorkId ═══════════════════════════════════════════════════

  describe('findByWorkId', () => {
    it('throws BadRequestException when no work id is provided', async () => {
      await expect(service.findByWorkId(0)).rejects.toThrow(
        new BadRequestException('Id da obra não enviado'),
      );
      expect(repository.findByWorkIdentifier).not.toHaveBeenCalled();
    });

    it('loads the reports by work identifier and maps each one', async () => {
      const reports = [{ id: 1 }, { id: 2 }];
      repository.findByWorkIdentifier.mockResolvedValue(reports as never);

      const result = await service.findByWorkId(WORK_ID);

      expect(repository.findByWorkIdentifier).toHaveBeenCalledWith(WORK_ID);
      // o map passa (item, index, array): só o primeiro argumento interessa
      expect(vi.mocked(toExecutionReportListItemOutput).mock.calls[0][0]).toBe(
        reports[0],
      );
      expect(result).toEqual([{ output: 1 }, { output: 2 }]);
    });
  });

  // ═══ create ═════════════════════════════════════════════════════════

  describe('create', () => {
    it('creates the report with the uploaded file names inside the given transaction', async () => {
      await service.create(createInput, FINISH_TIME, NEW_FILES, tx);

      expect(repository.findByScheduleId).toHaveBeenCalledWith(SCHEDULE_ID, tx);
      expect(ExecutionReport.create).toHaveBeenCalledWith(
        { ...createInput, files: ['new-1.pdf', 'new-2.pdf'] },
        FINISH_TIME,
      );
      expect(repository.create).toHaveBeenCalledWith(builtReport, tx);
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
      expect(logger.errorWithMetadata).not.toHaveBeenCalled();
    });

    it('discards the uploads and skips creation when a report already exists for the schedule', async () => {
      repository.findByScheduleId.mockResolvedValue({ id: 1 } as never);

      await service.create(createInput, FINISH_TIME, NEW_FILES, tx);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(ExecutionReport.create).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(logger.errorWithMetadata).not.toHaveBeenCalled();
    });

    it('does not call the storage when the report exists and there is nothing to clean', async () => {
      repository.findByScheduleId.mockResolvedValue({ id: 1 } as never);

      await service.create(createInput, FINISH_TIME, [], tx);

      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('throws BadRequestException and logs when no files are sent', async () => {
      await expect(
        service.create(createInput, FINISH_TIME, undefined as never, tx),
      ).rejects.toThrow(new BadRequestException('Arquivos não foram enviados'));

      expect(storage.deleteUploaded).not.toHaveBeenCalled();
      expect(logger.errorWithMetadata).toHaveBeenCalledWith(
        'Falha ao persistir relatório de execução',
        {
          method: 'create',
          idSchedule: SCHEDULE_ID,
          error: expect.any(BadRequestException),
        },
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('cleans the uploads, logs and rethrows when the entity validation fails', async () => {
      const validationError = new Error(
        'Deve conter ao menos 1 equipamento aplicado.',
      );
      vi.mocked(ExecutionReport.create).mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.create(createInput, FINISH_TIME, NEW_FILES, tx),
      ).rejects.toBe(validationError);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(logger.errorWithMetadata).toHaveBeenCalledWith(
        'Falha ao persistir relatório de execução',
        { method: 'create', idSchedule: SCHEDULE_ID, error: validationError },
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('cleans the uploads, logs and rethrows when the persistence fails', async () => {
      const dbError = new Error('database down');
      repository.create.mockRejectedValue(dbError);

      await expect(
        service.create(createInput, FINISH_TIME, NEW_FILES, tx),
      ).rejects.toBe(dbError);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(logger.errorWithMetadata).toHaveBeenCalledTimes(1);
    });
  });

  // ═══ update ═════════════════════════════════════════════════════════

  describe('update', () => {
    it('throws BadRequestException and cleans the uploads when no data is provided', async () => {
      await expect(
        service.update(REPORT_ID, undefined as never, NEW_FILES),
      ).rejects.toThrow(
        new BadRequestException('Nenhum relatório fornecida para edição.'),
      );

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(repository.findById).not.toHaveBeenCalled();
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('throws NotFoundException and cleans the uploads when the report does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(REPORT_ID, updateInput, NEW_FILES),
      ).rejects.toThrow(
        new NotFoundException('Relatório de execução não encontrado.'),
      );

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(scheduleRepository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException and cleans the uploads when the schedule does not exist', async () => {
      scheduleRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(REPORT_ID, updateInput, NEW_FILES),
      ).rejects.toThrow(new NotFoundException('Programação não encontrada.'));

      expect(scheduleRepository.findById).toHaveBeenCalledWith(SCHEDULE_ID);
      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('replaces the files and deletes the old ones after the database update', async () => {
      await service.update(REPORT_ID, updateInput, NEW_FILES);

      expect(ExecutionReport.create).toHaveBeenCalledWith(
        {
          workId: WORK_ID,
          idSchedule: SCHEDULE_ID,
          ...updateInput,
          files: ['new-1.pdf', 'new-2.pdf'],
        },
        FINISH_TIME,
      );
      expect(repository.update).toHaveBeenCalledWith(REPORT_ID, builtReport);
      expect(storage.deleteStored).toHaveBeenCalledWith(StorageKind.AS_BUILD, [
        'old-1.pdf',
        'old-2.pdf',
      ]);
      expect(repository.update.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteStored.mock.invocationCallOrder[0],
      );
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it.each([
      ['undefined', undefined],
      ['an empty list', [] as Express.Multer.File[]],
    ])(
      'keeps the current files when the uploads are %s',
      async (_label, files) => {
        await service.update(REPORT_ID, updateInput, files);

        expect(ExecutionReport.create).toHaveBeenCalledWith(
          expect.objectContaining({ files: ['old-1.pdf', 'old-2.pdf'] }),
          FINISH_TIME,
        );
        expect(storage.deleteStored).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          [],
        );
      },
    );

    it('does not let the input override the current files', async () => {
      const inputWithFiles = {
        ...updateInput,
        files: ['injected.pdf'],
      } as never;

      await service.update(REPORT_ID, inputWithFiles, undefined);

      expect(ExecutionReport.create).toHaveBeenCalledWith(
        expect.objectContaining({ files: ['old-1.pdf', 'old-2.pdf'] }),
        FINISH_TIME,
      );
    });

    it('wraps an entity Error into BadRequestException, logs it and cleans the uploads', async () => {
      const validationError = new Error(
        'Referência da chave provisória é obrigatória.',
      );
      vi.mocked(ExecutionReport.create).mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.update(REPORT_ID, updateInput, NEW_FILES),
      ).rejects.toThrow(
        new BadRequestException(
          'Erro ao criar relatório: Referência da chave provisória é obrigatória.',
        ),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Falha ao instanciar ExecutionReport para update',
        {
          method: 'update',
          idExecutionReport: REPORT_ID,
          error: validationError,
        },
      );
      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('wraps a non-Error thrown by the entity using its string value', async () => {
      vi.mocked(ExecutionReport.create).mockImplementation(() => {
        throw 'invalid payload';
      });

      await expect(
        service.update(REPORT_ID, updateInput, undefined),
      ).rejects.toThrow(
        new BadRequestException('Erro ao criar relatório: invalid payload'),
      );
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('cleans the uploads and keeps the old files when the database update fails', async () => {
      const dbError = new Error('database down');
      repository.update.mockRejectedValue(dbError);

      await expect(
        service.update(REPORT_ID, updateInput, NEW_FILES),
      ).rejects.toBe(dbError);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        NEW_PATHS,
      );
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });
  });

  // ═══ delete ═════════════════════════════════════════════════════════

  describe('delete', () => {
    it('throws BadRequestException when no id is provided', async () => {
      await expect(service.delete(0)).rejects.toThrow(
        new BadRequestException('Relatório não enviado para exclusão'),
      );
      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the report does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(REPORT_ID)).rejects.toThrow(
        new NotFoundException('Relatório de execução não encontrado.'),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('throws NotFoundException inside the transaction when the schedule does not exist', async () => {
      repository.findScheduleWorkMode.mockResolvedValue(null);

      await expect(service.delete(REPORT_ID)).rejects.toThrow(
        new NotFoundException(
          `Programação com ID ${SCHEDULE_ID} não encontrada`,
        ),
      );

      expect(repository.findScheduleWorkMode).toHaveBeenCalledWith(
        SCHEDULE_ID,
        tx,
      );
      expect(repository.resetScheduleExecution).not.toHaveBeenCalled();
      expect(repository.deleteReport).not.toHaveBeenCalled();
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('resets a regular schedule, recalculates the executed total and deletes the report', async () => {
      await service.delete(REPORT_ID);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(repository.findScheduledServiceIds).toHaveBeenCalledWith(
        SCHEDULE_ID,
        tx,
      );
      expect(repository.resetScheduleExecution).toHaveBeenCalledWith(
        SCHEDULE_ID,
        ScheduleStatus.CONFIRMADA,
        tx,
      );
      expect(repository.clearServicesReal).toHaveBeenCalledWith([100, 101], tx);
      expect(repository.sumWorkSchedulesExec).toHaveBeenCalledWith(WORK_ID, tx);
      expect(repository.updateWorkStatusAfterReset).toHaveBeenCalledWith(
        WORK_ID,
        { status: WorkStatus.CONFIRMADA, executed: 60 },
        tx,
      );
      expect(progress.recomputeAll).not.toHaveBeenCalled();
      expect(repository.deleteReport).toHaveBeenCalledWith(REPORT_ID, tx);
    });

    it('resets a point-to-point schedule by recomputing the progress without the executed total', async () => {
      repository.findScheduleWorkMode.mockResolvedValue({
        workId: WORK_ID,
        pointToPoint: true,
      });

      await service.delete(REPORT_ID);

      expect(progress.recomputeAll).toHaveBeenCalledWith(
        [100, 101],
        WORK_ID,
        tx,
      );
      expect(repository.updateWorkStatusAfterReset).toHaveBeenCalledWith(
        WORK_ID,
        { status: WorkStatus.CONFIRMADA },
        tx,
      );
      expect(repository.clearServicesReal).not.toHaveBeenCalled();
      expect(repository.sumWorkSchedulesExec).not.toHaveBeenCalled();
      expect(repository.deleteReport).toHaveBeenCalledWith(REPORT_ID, tx);
    });

    it('resets the schedule before touching the services and deletes the report last', async () => {
      await service.delete(REPORT_ID);

      const order = (fn: { mock: { invocationCallOrder: number[] } }) =>
        fn.mock.invocationCallOrder[0];
      expect(order(repository.resetScheduleExecution)).toBeLessThan(
        order(repository.clearServicesReal),
      );
      expect(order(repository.updateWorkStatusAfterReset)).toBeLessThan(
        order(repository.deleteReport),
      );
    });

    it('deletes the stored files only after the transaction commits', async () => {
      await service.delete(REPORT_ID);

      expect(storage.deleteStored).toHaveBeenCalledWith(StorageKind.AS_BUILD, [
        'old-1.pdf',
        'old-2.pdf',
      ]);
      expect(repository.deleteReport.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteStored.mock.invocationCallOrder[0],
      );
    });

    it('keeps the stored files when the transaction fails', async () => {
      const dbError = new Error('fk violation');
      repository.deleteReport.mockRejectedValue(dbError);

      await expect(service.delete(REPORT_ID)).rejects.toBe(dbError);
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });
  });
});
