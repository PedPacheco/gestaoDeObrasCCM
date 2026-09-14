import moment from 'moment';
import { FileService } from 'src/application/usecases/file.service';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';

import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';

describe('HandleFeasibilityService', () => {
  let service: HandleFeasibilityService;
  let feasibilityRepository: jest.Mocked<IFeasibilityRepository>;
  let statusFlowRepository: jest.Mocked<IStatusFlowRepository>;

  let mockFeasibilityRepository: jest.Mocked<Partial<IFeasibilityRepository>>;

  let mockStatusFlowRepository: jest.Mocked<Partial<IStatusFlowRepository>>;

  const mockFileServiceService = { deleteFile: jest.fn() };

  const mockPrisma = {
    $transaction: jest.fn((callback: (tx: any) => Promise<void>) => {
      const fakeTx = {};
      return callback(fakeTx);
    }),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20'));

    mockFeasibilityRepository = {
      saveFiles: jest.fn(),
      makeItemsFeasible: jest.fn(),
      getProjectDate: jest.fn(),
      reject: jest.fn(),
      updateFiles: jest.fn(),
      approve: jest.fn(),
      findFiles: jest.fn(),
    };

    mockStatusFlowRepository = {
      updateStatusWorks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleFeasibilityService,
        {
          provide: FEASIBILITY_REPOSITORY,
          useValue: mockFeasibilityRepository,
        },
        {
          provide: STATUS_FLOW_REPOSITORY,
          useValue: mockStatusFlowRepository,
        },
        {
          provide: FileService,
          useValue: mockFileServiceService,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<HandleFeasibilityService>(HandleFeasibilityService);
    feasibilityRepository = module.get(FEASIBILITY_REPOSITORY);
    statusFlowRepository = module.get(STATUS_FLOW_REPOSITORY);

    jest.clearAllMocks();
  });

  // ─── Helpers ──────────────────────────────────────────────

  const makeFile = (filename = 'report.pdf'): Express.Multer.File => ({
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('fake-content'),
    stream: null as any,
    destination: '',
    filename,
    path: '',
  });

  const makeItems = (count = 1): ServiceMaterialItemDto[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      viabilizado: 10,
    }));

  describe('upload', () => {
    const idWork = 1;
    const idUser = 42;

    describe('validation', () => {
      it('should throw BadGatewayException when idWork is 0 (falsy)', async () => {
        await expect(
          service.upload(0, idUser, false, [makeFile()], [], makeItems()),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadGatewayException when idWork is null', async () => {
        await expect(
          service.upload(
            null as any,
            idUser,
            false,
            [makeFile()],
            [],
            makeItems(),
          ),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadGatewayException when idWork is undefined', async () => {
        await expect(
          service.upload(
            undefined as any,
            idUser,
            false,
            [makeFile()],
            [],
            makeItems(),
          ),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadRequestException when items array is empty', async () => {
        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], []),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when items is null', async () => {
        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], null as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when items is undefined', async () => {
        await expect(
          service.upload(
            idWork,
            idUser,
            true,
            [makeFile()],
            [],
            undefined as any,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('validation messages', () => {
      it('should include correct message when idWork is missing', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await expect(
          service.upload(0, idUser, false, [makeFile()], [], makeItems()),
        ).rejects.toThrow('Obra não foi encontrada');
      });

      it('should include correct message when items are missing', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], []),
        ).rejects.toThrow('Nenhum item foi enviado.');
      });

      it('should include correct message when project date is missing', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: undefined,
        });

        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], makeItems()),
        ).rejects.toThrow(
          new BadRequestException('Obra sem data de empreitamento'),
        );
      });
    });

    describe('happy path', () => {
      it('should execute all operations inside a transaction', async () => {
        const files = [makeFile()];
        const items = makeItems(2);

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await service.upload(idWork, idUser, false, files, [], items);

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      });

      it('should call saveFiles with correct parameters', async () => {
        const files = [makeFile('doc.pdf')];
        const items = makeItems(2);

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-18').toDate(),
        });

        mockFeasibilityRepository.findFiles.mockResolvedValue({
          id: 1,
          caminhos_arquivos: ['doc.pdf'],
          arquivos_complementares: null,
        });

        await service.upload(idWork, idUser, true, files, ['doc.pdf'], items);

        expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
          idWork,
          idUser,
          'DENTRO DO PRAZO',
          ['doc.pdf'],
          expect.anything(), // tx
        );
      });

      it('should call makeItemsFeasible with correct items', async () => {
        const files = [makeFile()];
        const items = makeItems(3);

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await service.upload(idWork, idUser, true, files, [], items);

        expect(feasibilityRepository.makeItemsFeasible).toHaveBeenCalledWith(
          items,
          expect.anything(),
        );
      });

      it('should update status to 46 (feasible)', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await service.upload(
          idWork,
          idUser,
          true,
          [makeFile()],
          [],
          makeItems(),
        );

        expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
          46,
          idWork,
          expect.anything(),
        );
      });

      it('should call repository methods in the correct order', async () => {
        const callOrder: string[] = [];

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        feasibilityRepository.saveFiles.mockImplementation(async () => {
          callOrder.push('saveFiles');
        });
        feasibilityRepository.makeItemsFeasible.mockImplementation(async () => {
          callOrder.push('makeItemsFeasible');
        });
        statusFlowRepository.updateStatusWorks.mockImplementation(async () => {
          callOrder.push('updateStatusWorks');
        });

        await service.upload(
          idWork,
          idUser,
          true,
          [makeFile()],
          [],
          makeItems(),
        );

        expect(callOrder).toEqual([
          'saveFiles',
          'makeItemsFeasible',
          'updateStatusWorks',
        ]);
      });

      it('should handle multiple files correctly', async () => {
        const files = [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')];

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await service.upload(idWork, idUser, false, files, [], []);

        expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
          idWork,
          idUser,
          'FORA DO PRAZO',
          ['a.pdf', 'b.pdf', 'c.pdf'],
          {},
        );
      });

      it('should delete files that were removed from feasibility', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        mockFeasibilityRepository.findFiles.mockResolvedValue({
          id: 1,
          caminhos_arquivos: [
            'old-file-1.pdf',
            'old-file-2.pdf',
            'keep-file.pdf',
          ],
          arquivos_complementares: null,
        });

        await service.upload(
          idWork,
          idUser,
          false,
          [],
          ['keep-file.pdf'],
          makeItems(),
        );

        expect(mockFileServiceService.deleteFile).toHaveBeenCalledTimes(2);

        expect(mockFileServiceService.deleteFile).toHaveBeenCalledWith(
          `${process.env.UPLOAD_DEST}/old-file-1.pdf`,
        );

        expect(mockFileServiceService.deleteFile).toHaveBeenCalledWith(
          `${process.env.UPLOAD_DEST}/old-file-2.pdf`,
        );
      });

      it('should attempt to delete all removed files even if one fails', async () => {
        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        mockFeasibilityRepository.findFiles.mockResolvedValue({
          id: 1,
          caminhos_arquivos: ['file1.pdf', 'file2.pdf', 'file3.pdf'],
          arquivos_complementares: null,
        });

        mockFileServiceService.deleteFile
          .mockRejectedValueOnce(new Error('fail'))
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined);

        await service.upload(idWork, idUser, false, [], [], makeItems());

        expect(mockFileServiceService.deleteFile).toHaveBeenCalledTimes(3);
      });
    });

    describe('error propagation', () => {
      it('should propagate error when saveFiles fails', async () => {
        feasibilityRepository.saveFiles.mockRejectedValueOnce(
          new Error('Storage unavailable'),
        );

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await expect(
          service.upload(idWork, idUser, false, [makeFile()], [], makeItems()),
        ).rejects.toThrow('Storage unavailable');
      });

      it('should propagate error when makeItemsFeasible fails', async () => {
        feasibilityRepository.makeItemsFeasible.mockRejectedValueOnce(
          new Error('Invalid item data'),
        );

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], makeItems()),
        ).rejects.toThrow('Invalid item data');
      });

      it('should propagate error when updateStatusWorks fails', async () => {
        statusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
          new Error('Status update failed'),
        );

        mockFeasibilityRepository.getProjectDate.mockResolvedValue({
          data_empreitamento: moment('2026-06-10').toDate(),
        });

        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], makeItems()),
        ).rejects.toThrow('Status update failed');
      });

      it('should not call makeItemsFeasible if saveFiles fails', async () => {
        feasibilityRepository.saveFiles.mockRejectedValueOnce(
          new Error('fail'),
        );

        await expect(
          service.upload(idWork, idUser, true, [makeFile()], [], makeItems()),
        ).rejects.toThrow();

        expect(feasibilityRepository.makeItemsFeasible).not.toHaveBeenCalled();
      });

      it('should not call updateStatusWorks if makeItemsFeasible fails', async () => {
        feasibilityRepository.makeItemsFeasible.mockRejectedValueOnce(
          new Error('fail'),
        );

        await expect(
          service.upload(idWork, idUser, false, [makeFile()], [], undefined),
        ).rejects.toThrow();

        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });

      it('should not call any repository method when validation fails', async () => {
        await expect(
          service.upload(0, idUser, true, [makeFile()], [], makeItems()),
        ).rejects.toThrow();

        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        expect(feasibilityRepository.saveFiles).not.toHaveBeenCalled();
        expect(feasibilityRepository.makeItemsFeasible).not.toHaveBeenCalled();
        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });
    });
  });

  describe('uploadComplementaryFiles', () => {
    const idWork = 1;
    const idUser = 42;

    it('should throw when idWork is invalid', async () => {
      await expect(
        service.uploadComplementaryFiles(0, idUser, [makeFile()], []),
      ).rejects.toThrow('Obra não foi encontrada');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should update complementary files merging existing and uploaded files', async () => {
      mockFeasibilityRepository.findFiles.mockResolvedValue({
        id: 1,
        caminhos_arquivos: [],
        arquivos_complementares: null,
      });

      await service.uploadComplementaryFiles(
        idWork,
        idUser,
        [makeFile('new.pdf')],
        [],
      );

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      expect(feasibilityRepository.findFiles).toHaveBeenCalledWith(idWork);

      expect(feasibilityRepository.updateFiles).toHaveBeenCalledWith(
        idWork,
        ['new.pdf'],
        'complementary',
        expect.anything(),
      );
    });

    it('should delete removed files', async () => {
      mockFeasibilityRepository.findFiles.mockResolvedValue({
        id: 1,
        caminhos_arquivos: [],
        arquivos_complementares: ['remove-1.pdf', 'remove-2.pdf'],
      });

      await service.uploadComplementaryFiles(idWork, idUser, [], ['keep.pdf']);

      expect(mockFileServiceService.deleteFile).toHaveBeenCalledTimes(2);

      expect(mockFileServiceService.deleteFile).toHaveBeenCalledWith(
        `${process.env.UPLOAD_DEST}/remove-1.pdf`,
      );

      expect(mockFileServiceService.deleteFile).toHaveBeenCalledWith(
        `${process.env.UPLOAD_DEST}/remove-2.pdf`,
      );
    });

    it('should propagate repository errors', async () => {
      feasibilityRepository.findFiles.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(
        service.uploadComplementaryFiles(idWork, idUser, [], []),
      ).rejects.toThrow('Database error');
    });
  });

  describe('reject', () => {
    const mockData: RejectFeasibilityDTO = {
      workId: 10,
      reason: 'Budget exceeded',
      description: 'The estimated cost is above the approved limit',
      userId: 5,
      feasibilityReportId: 2,
    };

    describe('happy path', () => {
      it('should execute all operations inside a transaction', async () => {
        await service.reject(mockData);

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      });

      it('should call feasibilityRepository.reject with correct data', async () => {
        await service.reject(mockData);

        expect(feasibilityRepository.reject).toHaveBeenCalledWith(
          mockData,
          expect.anything(),
        );
      });

      it('should update status to 45 (rejected)', async () => {
        await service.reject(mockData);

        expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
          45,
          mockData.workId,
          expect.anything(),
        );
      });

      it('should call reject before updateStatusWorks', async () => {
        const callOrder: string[] = [];

        feasibilityRepository.reject.mockImplementation(async () => {
          callOrder.push('reject');
        });
        statusFlowRepository.updateStatusWorks.mockImplementation(async () => {
          callOrder.push('updateStatusWorks');
        });

        await service.reject(mockData);

        expect(callOrder).toEqual(['reject', 'updateStatusWorks']);
      });
    });

    describe('error propagation', () => {
      it('should propagate error when reject fails', async () => {
        feasibilityRepository.reject.mockRejectedValueOnce(
          new Error('Database error'),
        );

        await expect(service.reject(mockData)).rejects.toThrow(
          'Database error',
        );
      });

      it('should propagate error when updateStatusWorks fails', async () => {
        statusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
          new Error('Status transition not allowed'),
        );

        await expect(service.reject(mockData)).rejects.toThrow(
          'Status transition not allowed',
        );
      });

      it('should not call updateStatusWorks if reject fails', async () => {
        feasibilityRepository.reject.mockRejectedValueOnce(new Error('fail'));

        await expect(service.reject(mockData)).rejects.toThrow();

        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });
    });
  });

  describe('approve', () => {
    describe('happy path', () => {
      it('should execute all operations inside a transaction', async () => {
        await service.approve(1, 2);

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      });

      it('should call feasibilityRepository.approve with correct data', async () => {
        mockFeasibilityRepository.findFiles.mockResolvedValue({
          id: 1,
          caminhos_arquivos: undefined,
          arquivos_complementares: undefined,
        });

        await service.approve(1, 2);

        expect(feasibilityRepository.approve).toHaveBeenCalledWith(1, 2, {});
      });

      it('should update status to 45 (rejected)', async () => {
        await service.approve(1, 2);

        expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
          1,
          1,
          expect.anything(),
        );
      });

      it('should call approve before updateStatusWorks', async () => {
        const callOrder: string[] = [];

        feasibilityRepository.approve.mockImplementation(async () => {
          callOrder.push('approve');
        });
        statusFlowRepository.updateStatusWorks.mockImplementation(async () => {
          callOrder.push('updateStatusWorks');
        });

        await service.approve(1, 2);

        expect(callOrder).toEqual(['approve', 'updateStatusWorks']);
      });
    });

    describe('error propagation', () => {
      it('should propagate error when approve fails', async () => {
        feasibilityRepository.approve.mockRejectedValueOnce(
          new Error('Database error'),
        );

        await expect(service.approve(1, 2)).rejects.toThrow('Database error');
      });

      it('should propagate error when updateStatusWorks fails', async () => {
        statusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
          new Error('Status transition not allowed'),
        );

        await expect(service.approve(1, 2)).rejects.toThrow(
          'Status transition not allowed',
        );
      });

      it('should not call updateStatusWorks if approve fails', async () => {
        feasibilityRepository.approve.mockRejectedValueOnce(new Error('fail'));

        await expect(service.approve(1, 2)).rejects.toThrow();

        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });
    });
  });
});
