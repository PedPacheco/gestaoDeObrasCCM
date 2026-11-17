import { toExecutionReportListItemOutput } from 'src/application/mappers/executionReport.mapper';
import {
  CreateExecutionReportInput,
  UpdateExecutionReportInput,
} from 'src/application/types';
import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import { StorageKind } from 'src/domain/types';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// test/application/executionReport/executionReport.service.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { makeExecutionReportProps } from '../../factories/executionReport.factory';

import type { IExecutionReportRepository } from 'src/domain/contracts/IExecutionReportRepository';
import type { Prisma } from 'src/infra/generated/prisma/client';

vi.mock('src/shared/upload/storedFileName', () => ({
  uploadedPaths: vi.fn(),
}));

// ⚠️ Mesmo caminho do import do mapper acima
vi.mock(
  'src/application/mappers/executionReport.mapper',
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    toExecutionReportListItemOutput: vi.fn(),
  }),
);

// ─── Dados de teste ──────────────────────────────────────────────────

const makeFile = (filename: string): Express.Multer.File =>
  ({ filename, path: `/tmp/uploads/${filename}` }) as Express.Multer.File;

const makeCreateInput = (
  overrides: Partial<CreateExecutionReportInput> = {},
): CreateExecutionReportInput => {
  const { files: _files, ...props } = makeExecutionReportProps();
  return { ...props, ...overrides } as CreateExecutionReportInput;
};

const makeUpdateInput = (
  overrides: Partial<UpdateExecutionReportInput> = {},
): UpdateExecutionReportInput => {
  const {
    files: _f,
    idWork: _w,
    idSchedule: _s,
    ...props
  } = makeExecutionReportProps();
  return { ...props, ...overrides } as UpdateExecutionReportInput;
};

const executionReport = {
  tag: 'execution-report',
} as unknown as ExecutionReport;

// ─── Mocks ───────────────────────────────────────────────────────────

const makeMocks = () => {
  const tx = { tag: 'tx' } as unknown as Prisma.TransactionClient;

  return {
    tx,
    prisma: {
      $transaction: vi.fn(
        async (cb: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          cb(tx),
      ),
    },
    progress: { recomputeAll: vi.fn() },
    executionReportRepository: {
      findByWorkIdentifier: vi.fn(),
      findByScheduleId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findScheduleWorkMode: vi.fn(),
      findScheduledServiceIds: vi.fn(),
      resetScheduleExecution: vi.fn(),
      clearServicesReal: vi.fn(),
      sumWorkSchedulesExec: vi.fn(),
      updateWorkStatusAfterReset: vi.fn(),
      deleteReport: vi.fn(),
    } satisfies Partial<
      Record<keyof IExecutionReportRepository, ReturnType<typeof vi.fn>>
    >,
    findScheduleByIdRepository: { findById: vi.fn() },
    storage: { deleteStored: vi.fn(), deleteUploaded: vi.fn() },
    logger: { error: vi.fn(), errorWithMetadata: vi.fn() },
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────

const expectRejection = async (
  promise: Promise<unknown>,
  ErrorType: new (...args: never[]) => Error,
  message: string,
) => {
  const error = await promise.then(
    () => {
      throw new Error('Expected promise to reject, but it resolved');
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ErrorType);
  expect((error as Error).message).toBe(message);
};

const expectCalledInOrder = (
  ...fns: { mock: { invocationCallOrder: number[] } }[]
) => {
  const order = fns.map((fn) => fn.mock.invocationCallOrder[0]);
  expect(order).toStrictEqual([...order].sort((a, b) => a - b));
};

const entityCreate = () => vi.mocked(ExecutionReport.create);

// ─── Suíte ───────────────────────────────────────────────────────────

describe('ExecutionReportService', () => {
  let m: ReturnType<typeof makeMocks>;
  let service: ExecutionReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    m = makeMocks();
    service = new ExecutionReportService(
      m.prisma as never,
      m.progress as never,
      m.executionReportRepository as never,
      m.findScheduleByIdRepository as never,
      m.storage as never,
      m.logger as never,
    );

    vi.spyOn(ExecutionReport, 'create').mockReturnValue(executionReport);
    vi.mocked(uploadedPaths).mockImplementation(
      (files?: Express.Multer.File[]) => (files ?? []).map((f) => f.path),
    );
    vi.mocked(toExecutionReportListItemOutput).mockImplementation(
      (report: { id: number }) => ({ mappedId: report.id }) as never,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── findByWorkId ────────────────────────────────────────────────

  describe('findByWorkId', () => {
    it.each([0, NaN])(
      'should throw BadRequestException when idWork is falsy (%s)',
      async (idWork) => {
        await expectRejection(
          service.findByWorkId(idWork),
          BadRequestException,
          'Id da obra não enviado',
        );
        expect(
          m.executionReportRepository.findByWorkIdentifier,
        ).not.toHaveBeenCalled();
      },
    );

    it('should map every report returned by the repository', async () => {
      m.executionReportRepository.findByWorkIdentifier.mockResolvedValueOnce([
        { id: 1 },
        { id: 2 },
      ]);

      const result = await service.findByWorkId(202);

      expect(
        m.executionReportRepository.findByWorkIdentifier,
      ).toHaveBeenCalledWith(202);
      expect(toExecutionReportListItemOutput).toHaveBeenCalledTimes(2);
      expect(result).toStrictEqual([{ mappedId: 1 }, { mappedId: 2 }]);
    });

    it('should return an empty array when no reports are found', async () => {
      m.executionReportRepository.findByWorkIdentifier.mockResolvedValueOnce(
        [],
      );

      await expect(service.findByWorkId(202)).resolves.toStrictEqual([]);
      expect(toExecutionReportListItemOutput).not.toHaveBeenCalled();
    });
  });

  // ─── create ──────────────────────────────────────────────────────

  describe('create', () => {
    const scheduledFinishTime = new Date('2025-06-10T18:00:00.000Z');
    const files = [makeFile('a.jpg'), makeFile('b.jpg')];
    const uploaded = ['/tmp/uploads/a.jpg', '/tmp/uploads/b.jpg'];

    beforeEach(() => {
      m.executionReportRepository.findByScheduleId.mockResolvedValue(null);
    });

    it('should build the entity with uploaded file names and persist it within the transaction', async () => {
      const input = makeCreateInput();

      await expect(
        service.create(input, scheduledFinishTime, files, m.tx),
      ).resolves.toBeUndefined();

      expect(m.executionReportRepository.findByScheduleId).toHaveBeenCalledWith(
        input.idSchedule,
        m.tx,
      );
      expect(entityCreate()).toHaveBeenCalledWith(
        { ...input, files: ['a.jpg', 'b.jpg'] },
        scheduledFinishTime,
      );
      expect(m.executionReportRepository.create).toHaveBeenCalledWith(
        executionReport,
        m.tx,
      );
      expect(m.storage.deleteUploaded).not.toHaveBeenCalled();
      expect(m.logger.errorWithMetadata).not.toHaveBeenCalled();
    });

    it('should skip creation and discard uploaded files when a report already exists for the schedule', async () => {
      m.executionReportRepository.findByScheduleId.mockResolvedValueOnce({
        id: 99,
      });

      await expect(
        service.create(makeCreateInput(), scheduledFinishTime, files, m.tx),
      ).resolves.toBeUndefined();

      expect(entityCreate()).not.toHaveBeenCalled();
      expect(m.executionReportRepository.create).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        uploaded,
      );
      expect(m.logger.errorWithMetadata).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException and log the failure when no files are sent', async () => {
      const input = makeCreateInput();

      await expectRejection(
        service.create(input, scheduledFinishTime, undefined as never, m.tx),
        BadRequestException,
        'Arquivos não foram enviados',
      );

      expect(entityCreate()).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).not.toHaveBeenCalled();
      expect(m.logger.errorWithMetadata).toHaveBeenCalledWith(
        'Falha ao persistir relatório de execução',
        {
          method: 'create',
          idSchedule: input.idSchedule,
          error: expect.any(BadRequestException),
        },
      );
    });

    it('should discard uploaded files, log and rethrow when entity validation fails', async () => {
      const validationError = new Error(
        'Deve conter ao menos 1 equipamento aplicado.',
      );
      entityCreate().mockImplementationOnce(() => {
        throw validationError;
      });
      const input = makeCreateInput();

      await expect(
        service.create(input, scheduledFinishTime, files, m.tx),
      ).rejects.toBe(validationError);

      expect(m.executionReportRepository.create).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        uploaded,
      );
      expect(m.logger.errorWithMetadata).toHaveBeenCalledWith(
        'Falha ao persistir relatório de execução',
        {
          method: 'create',
          idSchedule: input.idSchedule,
          error: validationError,
        },
      );
    });

    it('should discard uploaded files, log and rethrow when persistence fails', async () => {
      const dbError = new Error('db down');
      m.executionReportRepository.create.mockRejectedValueOnce(dbError);

      await expect(
        service.create(makeCreateInput(), scheduledFinishTime, files, m.tx),
      ).rejects.toBe(dbError);

      expect(m.storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        uploaded,
      );
      expect(m.logger.errorWithMetadata).toHaveBeenCalledTimes(1);
    });
  });

  // ─── update ──────────────────────────────────────────────────────

  describe('update', () => {
    const id = 7;
    const existing = {
      id,
      workId: 202,
      scheduleId: 101,
      filePaths: ['old/a.jpg', 'old/b.jpg'],
    };
    const schedule = { hora_ter: new Date('2025-06-10T18:00:00.000Z') };
    const files = [makeFile('new.jpg')];

    beforeEach(() => {
      m.executionReportRepository.findById.mockResolvedValue(existing);
      m.findScheduleByIdRepository.findById.mockResolvedValue(schedule);
    });

    it('should persist the new files and then delete the previously stored ones', async () => {
      const input = makeUpdateInput();

      await expect(service.update(id, input, files)).resolves.toBeUndefined();

      expect(m.executionReportRepository.findById).toHaveBeenCalledWith(id);
      expect(m.findScheduleByIdRepository.findById).toHaveBeenCalledWith(
        existing.scheduleId,
      );
      expect(entityCreate()).toHaveBeenCalledWith(
        {
          idWork: existing.workId,
          idSchedule: existing.scheduleId,
          ...input,
          files: ['new.jpg'],
        },
        schedule.hora_ter,
      );
      expect(m.executionReportRepository.update).toHaveBeenCalledWith(
        id,
        executionReport,
      );
      expect(m.storage.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        existing.filePaths,
      );
      expectCalledInOrder(
        m.executionReportRepository.update,
        m.storage.deleteStored,
      );
      expect(m.storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', []],
    ])(
      'should keep the current files and delete nothing when files are %s',
      async (_label, noFiles) => {
        await service.update(id, makeUpdateInput(), noFiles);

        expect(entityCreate()).toHaveBeenCalledWith(
          expect.objectContaining({ files: existing.filePaths }),
          schedule.hora_ter,
        );
        expect(m.storage.deleteStored).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          [],
        );
      },
    );

    it('should not let the input data override the resolved files', async () => {
      const input = makeUpdateInput({ files: ['ignored.jpg'] } as never);

      await service.update(id, input, files);

      expect(entityCreate()).toHaveBeenCalledWith(
        expect.objectContaining({ files: ['new.jpg'] }),
        schedule.hora_ter,
      );
    });

    it('should throw BadRequestException and discard uploads when no data is provided', async () => {
      await expectRejection(
        service.update(id, undefined as never, files),
        BadRequestException,
        'Nenhum relatório fornecida para edição.',
      );

      expect(m.executionReportRepository.findById).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['/tmp/uploads/new.jpg'],
      );
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the report does not exist', async () => {
      m.executionReportRepository.findById.mockResolvedValueOnce(null);

      await expectRejection(
        service.update(id, makeUpdateInput(), files),
        NotFoundException,
        'Relatório de execução não encontrado.',
      );

      expect(m.findScheduleByIdRepository.findById).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledTimes(1);
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the schedule does not exist', async () => {
      m.findScheduleByIdRepository.findById.mockResolvedValueOnce(null);

      await expectRejection(
        service.update(id, makeUpdateInput(), files),
        NotFoundException,
        'Programação não encontrada.',
      );

      expect(entityCreate()).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledTimes(1);
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should wrap entity errors in a BadRequestException and log them', async () => {
      const validationError = new Error(
        'Deve conter ao menos 1 equipamento aplicado.',
      );
      entityCreate().mockImplementationOnce(() => {
        throw validationError;
      });

      await expectRejection(
        service.update(id, makeUpdateInput(), files),
        BadRequestException,
        'Erro ao criar relatório: Deve conter ao menos 1 equipamento aplicado.',
      );

      expect(m.logger.error).toHaveBeenCalledWith(
        'Falha ao instanciar ExecutionReport para update',
        { method: 'update', idExecutionReport: id, error: validationError },
      );
      expect(m.executionReportRepository.update).not.toHaveBeenCalled();
      expect(m.storage.deleteUploaded).toHaveBeenCalledTimes(1);
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should stringify non-Error values thrown by the entity', async () => {
      entityCreate().mockImplementationOnce(() => {
        throw 'unexpected failure';
      });

      await expectRejection(
        service.update(id, makeUpdateInput(), files),
        BadRequestException,
        'Erro ao criar relatório: unexpected failure',
      );
    });

    it('should discard uploads and keep stored files when persistence fails', async () => {
      const dbError = new Error('db down');
      m.executionReportRepository.update.mockRejectedValueOnce(dbError);

      await expect(service.update(id, makeUpdateInput(), files)).rejects.toBe(
        dbError,
      );

      expect(m.storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['/tmp/uploads/new.jpg'],
      );
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });
  });

  // ─── delete ──────────────────────────────────────────────────────

  describe('delete', () => {
    const id = 7;
    const report = { id, scheduleId: 101, filePaths: ['old/a.jpg'] };
    const serviceIds = [11, 12];
    const workId = 202;

    beforeEach(() => {
      m.executionReportRepository.findById.mockResolvedValue(report);
      m.executionReportRepository.findScheduleWorkMode.mockResolvedValue({
        workId,
        pointToPoint: false,
      });
      m.executionReportRepository.findScheduledServiceIds.mockResolvedValue(
        serviceIds,
      );
      m.executionReportRepository.sumWorkSchedulesExec.mockResolvedValue(35);
    });

    it.each([0, NaN])(
      'should throw BadRequestException when id is falsy (%s)',
      async (invalidId) => {
        await expectRejection(
          service.delete(invalidId),
          BadRequestException,
          'Relatório não enviado para exclusão',
        );
        expect(m.executionReportRepository.findById).not.toHaveBeenCalled();
      },
    );

    it('should throw NotFoundException when the report does not exist', async () => {
      m.executionReportRepository.findById.mockResolvedValueOnce(null);

      await expectRejection(
        service.delete(id),
        NotFoundException,
        'Relatório de execução não encontrado.',
      );

      expect(m.prisma.$transaction).not.toHaveBeenCalled();
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should reset a standard schedule, recalculate executed totals and delete the report', async () => {
      await expect(service.delete(id)).resolves.toBeUndefined();

      const repo = m.executionReportRepository;
      expect(m.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(repo.findScheduleWorkMode).toHaveBeenCalledWith(101, m.tx);
      expect(repo.findScheduledServiceIds).toHaveBeenCalledWith(101, m.tx);
      expect(repo.resetScheduleExecution).toHaveBeenCalledWith(
        101,
        ScheduleStatus.CONFIRMADA,
        m.tx,
      );
      expect(repo.clearServicesReal).toHaveBeenCalledWith(serviceIds, m.tx);
      expect(repo.sumWorkSchedulesExec).toHaveBeenCalledWith(workId, m.tx);
      expect(repo.updateWorkStatusAfterReset).toHaveBeenCalledWith(
        workId,
        { status: WorkStatus.CONFIRMADA, executed: 35 },
        m.tx,
      );
      expect(repo.deleteReport).toHaveBeenCalledWith(id, m.tx);
      expect(m.progress.recomputeAll).not.toHaveBeenCalled();
      expect(m.storage.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        report.filePaths,
      );
      expectCalledInOrder(
        repo.resetScheduleExecution,
        repo.clearServicesReal,
        repo.sumWorkSchedulesExec,
        repo.updateWorkStatusAfterReset,
        repo.deleteReport,
        m.storage.deleteStored,
      );
    });

    it('should recompute progress for point-to-point schedules without summing executed totals', async () => {
      m.executionReportRepository.findScheduleWorkMode.mockResolvedValueOnce({
        workId,
        pointToPoint: true,
      });

      await service.delete(id);

      const repo = m.executionReportRepository;
      expect(m.progress.recomputeAll).toHaveBeenCalledWith(
        serviceIds,
        workId,
        m.tx,
      );
      expect(repo.updateWorkStatusAfterReset).toHaveBeenCalledWith(
        workId,
        { status: WorkStatus.CONFIRMADA },
        m.tx,
      );
      expect(repo.clearServicesReal).not.toHaveBeenCalled();
      expect(repo.sumWorkSchedulesExec).not.toHaveBeenCalled();
      expectCalledInOrder(
        repo.resetScheduleExecution,
        m.progress.recomputeAll,
        repo.updateWorkStatusAfterReset,
        repo.deleteReport,
      );
    });

    it('should throw NotFoundException and keep stored files when the schedule is not found', async () => {
      m.executionReportRepository.findScheduleWorkMode.mockResolvedValueOnce(
        null,
      );

      await expectRejection(
        service.delete(id),
        NotFoundException,
        'Programação com ID 101 não encontrada',
      );

      expect(
        m.executionReportRepository.resetScheduleExecution,
      ).not.toHaveBeenCalled();
      expect(m.executionReportRepository.deleteReport).not.toHaveBeenCalled();
      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });

    it('should keep stored files when the transaction fails', async () => {
      const dbError = new Error('db down');
      m.executionReportRepository.deleteReport.mockRejectedValueOnce(dbError);

      await expect(service.delete(id)).rejects.toBe(dbError);

      expect(m.storage.deleteStored).not.toHaveBeenCalled();
    });
  });
});
