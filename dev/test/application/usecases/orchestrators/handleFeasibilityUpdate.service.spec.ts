import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FeasibleItemInput,
  RejectFeasibilityInput,
  StatusFeasibility,
} from 'src/application/types';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import { type IFeasibilityRepository } from 'src/domain/contracts/IFeasibilityRepository';
import { type IStatusFlowRepository } from 'src/domain/contracts/IStatusFlowRepository';
import { type IFileStorage } from 'src/domain/contracts/storage/IFileStorage';
import { StorageKind } from 'src/domain/types';
import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import { countBusinessDays } from 'src/utils/parseTimeToDate';
// ajuste ao import real do service

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/utils/parseTimeToDate', () => ({
  countBusinessDays: vi.fn(),
}));

vi.mock('src/shared/upload/storedFileName', () => ({
  uploadedPaths: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const WORK_ID = 41;
const USER_ID = 9;
const PROJECT_DATE = new Date('2026-11-01T00:00:00.000Z');

const makeFile = (filename: string): Express.Multer.File =>
  ({
    filename,
    path: `/tmp/uploads/${filename}`,
  }) as Express.Multer.File;

const uploadedFile = makeFile('new-file.pdf');

const existingTechnicalFiles = ['technical-old.pdf'];
const existingComplementaryFiles = ['complementary-old.pdf'];

const makeClient = () => ({
  $executeRaw: vi.fn().mockResolvedValue(1),
  relatorio_viabilidade: {
    upsert: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  },
});

type Client = ReturnType<typeof makeClient>;

// ─── Suite ────────────────────────────────────────────────────────────

describe('HandleFeasibilityService', () => {
  let prisma: Client & { $transaction: ReturnType<typeof vi.fn> };
  let tx: Client;
  let feasibilityRepository: Pick<
    IFeasibilityRepository,
    | 'getProjectDate'
    | 'findFiles'
    | 'saveFiles'
    | 'updateFiles'
    | 'makeItemsFeasible'
    | 'reject'
    | 'approve'
  >;
  let statusFlowRepository: Pick<IStatusFlowRepository, 'updateStatusWorks'>;
  let storage: Pick<IFileStorage, 'deleteStored' | 'deleteUploaded'>;
  let service: HandleFeasibilityService;

  beforeEach(() => {
    vi.clearAllMocks();

    tx = makeClient();
    prisma = {
      ...makeClient(),
      $transaction: vi.fn(
        async (callback: (client: Client) => Promise<unknown>) => callback(tx),
      ),
    };

    feasibilityRepository = {
      getProjectDate: vi.fn().mockResolvedValue(PROJECT_DATE),
      findFiles: vi.fn().mockResolvedValue({
        id: 1,
        technicalFiles: existingTechnicalFiles,
        complementaryFiles: existingComplementaryFiles,
      }),
      saveFiles: vi.fn().mockResolvedValue(undefined),
      updateFiles: vi.fn().mockResolvedValue(undefined),
      makeItemsFeasible: vi.fn().mockResolvedValue(undefined),
      reject: vi.fn().mockResolvedValue(undefined),
      approve: vi.fn().mockResolvedValue(undefined),
    };

    statusFlowRepository = {
      updateStatusWorks: vi.fn().mockResolvedValue(undefined),
    };

    storage = {
      deleteStored: vi.fn().mockResolvedValue(undefined),
      deleteUploaded: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(countBusinessDays).mockReturnValue(0);
    vi.mocked(uploadedPaths).mockImplementation((files) =>
      (Array.isArray(files) ? files : files ? [files] : []).map(
        (file) => file.path,
      ),
    );

    service = new HandleFeasibilityService(
      statusFlowRepository as IStatusFlowRepository,
      feasibilityRepository as IFeasibilityRepository,
      storage as IFileStorage,
      prisma as unknown as PrismaService,
    );
  });

  // ═══ upload ═════════════════════════════════════════════════════════

  describe('upload', () => {
    it('rejects a missing work id and cleans up uploaded files', async () => {
      await expect(
        service.upload(0, USER_ID, false, [uploadedFile], [], []),
      ).rejects.toThrow(new BadGatewayException('Obra não foi encontrada'));

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
      expect(feasibilityRepository.getProjectDate).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects point-by-point uploads without service items and cleans up files', async () => {
      await expect(
        service.upload(WORK_ID, USER_ID, true, [uploadedFile], [], []),
      ).rejects.toThrow(new BadRequestException('Nenhum item foi enviado.'));

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
      expect(feasibilityRepository.getProjectDate).not.toHaveBeenCalled();
    });

    it('rejects a work without an inception date and cleans up files', async () => {
      vi.mocked(feasibilityRepository.getProjectDate).mockResolvedValue(null);

      await expect(
        service.upload(WORK_ID, USER_ID, false, [uploadedFile], [], []),
      ).rejects.toThrow(
        new BadRequestException('Obra sem data de empreitamento'),
      );

      expect(feasibilityRepository.getProjectDate).toHaveBeenCalledWith(
        WORK_ID,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
    });

    it.each([
      [0, 'DENTRO DO PRAZO'],
      [6, 'FORA DO PRAZO'],
    ] as const)(
      'saves the technical files with status %s when business-day count is %i',
      async (businessDays, expectedStatus) => {
        vi.mocked(countBusinessDays).mockReturnValue(businessDays);

        const items: FeasibleItemInput[] = [
          { id: 101, viabilizado: 6 },
          { id: 102, viabilizado: 4 },
        ];

        await service.upload(
          WORK_ID,
          USER_ID,
          true,
          [uploadedFile],
          ['technical-old.pdf', 'foreign.pdf'],
          items,
        );

        expect(countBusinessDays).toHaveBeenCalledWith(
          PROJECT_DATE,
          expect.any(Date),
        );
        expect(feasibilityRepository.findFiles).toHaveBeenCalledWith(WORK_ID);
        expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
          WORK_ID,
          USER_ID,
          expectedStatus satisfies StatusFeasibility,
          ['technical-old.pdf', 'new-file.pdf'],
          tx,
        );
        expect(feasibilityRepository.makeItemsFeasible).toHaveBeenCalledWith(
          [
            { id: 101, feasibleQuantity: 6 },
            { id: 102, feasibleQuantity: 4 },
          ],
          tx,
        );
        expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
          46,
          WORK_ID,
          tx,
        );
        expect(storage.deleteStored).toHaveBeenCalledWith(
          StorageKind.VIABILIDADE,
          [],
        );
        expect(storage.deleteUploaded).not.toHaveBeenCalled();
      },
    );

    it('skips updating feasible items when the upload is not point-by-point', async () => {
      await service.upload(
        WORK_ID,
        USER_ID,
        false,
        [uploadedFile],
        [],
        undefined,
      );

      expect(feasibilityRepository.saveFiles).toHaveBeenCalled();
      expect(feasibilityRepository.makeItemsFeasible).not.toHaveBeenCalled();
      expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        46,
        WORK_ID,
        tx,
      );
    });

    it('uses an empty list when no current technical files exist', async () => {
      vi.mocked(feasibilityRepository.findFiles).mockResolvedValue(null);

      await service.upload(
        WORK_ID,
        USER_ID,
        false,
        [uploadedFile],
        undefined as never,
      );

      expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
        WORK_ID,
        USER_ID,
        'DENTRO DO PRAZO',
        ['new-file.pdf'],
        tx,
      );
      expect(storage.deleteStored).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [],
      );
    });

    it('cleans uploaded files when a transactional operation fails', async () => {
      const error = new Error('status update failed');
      vi.mocked(statusFlowRepository.updateStatusWorks).mockRejectedValue(
        error,
      );

      await expect(
        service.upload(WORK_ID, USER_ID, false, [uploadedFile], [], []),
      ).rejects.toBe(error);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });

    it('does not store duplicate file names in the final technical path list', async () => {
      await service.upload(
        WORK_ID,
        USER_ID,
        false,
        [makeFile('technical-old.pdf'), makeFile('new-file.pdf')],
        ['technical-old.pdf'],
      );

      expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
        WORK_ID,
        USER_ID,
        'DENTRO DO PRAZO',
        ['technical-old.pdf', 'new-file.pdf'],
        tx,
      );
    });
  });

  // ═══ uploadComplementaryFiles ═══════════════════════════════════════

  describe('uploadComplementaryFiles', () => {
    it('rejects a missing work id and cleans up uploaded files', async () => {
      await expect(
        service.uploadComplementaryFiles(0, USER_ID, [uploadedFile], []),
      ).rejects.toThrow(new BadGatewayException('Obra não foi encontrada'));

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('updates complementary files and removes replaced files after commit', async () => {
      await service.uploadComplementaryFiles(
        WORK_ID,
        USER_ID,
        [uploadedFile],
        ['complementary-old.pdf', 'foreign.pdf'],
      );

      expect(feasibilityRepository.findFiles).toHaveBeenCalledWith(WORK_ID);
      expect(feasibilityRepository.updateFiles).toHaveBeenCalledWith(
        WORK_ID,
        ['complementary-old.pdf', 'new-file.pdf'],
        'complementary',
        tx,
      );
      expect(storage.deleteStored).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [],
      );
      expect(storage.deleteUploaded).not.toHaveBeenCalled();
    });

    it('removes current complementary files when the client keeps none', async () => {
      await service.uploadComplementaryFiles(WORK_ID, USER_ID, [], []);

      expect(feasibilityRepository.updateFiles).toHaveBeenCalledWith(
        WORK_ID,
        [],
        'complementary',
        tx,
      );
    });

    it('cleans newly uploaded files when the transaction fails', async () => {
      const error = new Error('update failed');
      vi.mocked(feasibilityRepository.updateFiles).mockRejectedValue(error);

      await expect(
        service.uploadComplementaryFiles(WORK_ID, USER_ID, [uploadedFile], []),
      ).rejects.toBe(error);

      expect(storage.deleteUploaded).toHaveBeenCalledWith(
        StorageKind.VIABILIDADE,
        [uploadedFile.path],
      );
      expect(storage.deleteStored).not.toHaveBeenCalled();
    });
  });

  // ═══ reject ═════════════════════════════════════════════════════════

  describe('reject', () => {
    it('records the rejection and updates the work status in one transaction', async () => {
      const input = {
        workId: WORK_ID,
        feasibilityReportId: 72,
        userId: USER_ID,
        reason: 'Missing information',
        description: 'Please add the technical document',
      } as RejectFeasibilityInput;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { workId, ...rejection } = input;

      await service.reject(input);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(feasibilityRepository.reject).toHaveBeenCalledWith(rejection, tx);
      expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        45,
        WORK_ID,
        tx,
      );
    });

    it('propagates an error from the rejection repository', async () => {
      const error = new Error('rejection failed');
      vi.mocked(feasibilityRepository.reject).mockRejectedValue(error);

      await expect(
        service.reject({
          workId: WORK_ID,
          feasibilityReportId: 72,
          userId: USER_ID,
          reason: 'reason',
          description: 'description',
        } as RejectFeasibilityInput),
      ).rejects.toBe(error);

      expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  // ═══ approve ════════════════════════════════════════════════════════

  describe('approve', () => {
    it('approves the feasibility and updates the work status in one transaction', async () => {
      await service.approve(WORK_ID, USER_ID);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(feasibilityRepository.approve).toHaveBeenCalledWith(
        WORK_ID,
        USER_ID,
        tx,
      );
      expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        1,
        WORK_ID,
        tx,
      );
    });

    it('propagates an error from the approval repository', async () => {
      const error = new Error('approval failed');
      vi.mocked(feasibilityRepository.approve).mockRejectedValue(error);

      await expect(service.approve(WORK_ID, USER_ID)).rejects.toBe(error);
      expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  it('removes every current complementary file when none are kept and none are uploaded', async () => {
    await service.uploadComplementaryFiles(WORK_ID, USER_ID, [], []);

    expect(feasibilityRepository.updateFiles).toHaveBeenCalledWith(
      WORK_ID,
      [],
      'complementary',
      tx,
    );
    expect(storage.deleteStored).toHaveBeenCalledWith(StorageKind.VIABILIDADE, [
      'complementary-old.pdf',
    ]);
    expect(uploadedPaths).not.toHaveBeenCalled();
    expect(storage.deleteUploaded).not.toHaveBeenCalled();
  });

  it('cleans up with an empty path list when the flow fails without uploads', async () => {
    const error = new Error('update failed');
    vi.mocked(feasibilityRepository.updateFiles).mockRejectedValue(error);

    await expect(
      service.uploadComplementaryFiles(
        WORK_ID,
        USER_ID,
        undefined as never,
        [],
      ),
    ).rejects.toBe(error);

    expect(uploadedPaths).toHaveBeenCalledWith(undefined);
    expect(storage.deleteUploaded).toHaveBeenCalledWith(
      StorageKind.VIABILIDADE,
      [],
    );
  });
});
