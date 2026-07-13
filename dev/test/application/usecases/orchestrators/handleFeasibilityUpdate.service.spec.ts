import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';
import {
  STATUS_FLOW_REPOSITORY,
  IStatusFlowRepository,
} from 'src/domain/repositories/IStatusFlowRepository';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpdate.service';
import { FeasibilityService } from 'src/application/usecases/feasibility.service';

describe('HandleFeasibilityService', () => {
  let service: HandleFeasibilityService;
  let feasibilityRepository: jest.Mocked<IFeasibilityRepository>;
  let statusFlowRepository: jest.Mocked<IStatusFlowRepository>;

  const mockFeasibilityRepository: jest.Mocked<
    Partial<IFeasibilityRepository>
  > = {
    saveFiles: jest.fn(),
    makeItemsFeasible: jest.fn(),
    reject: jest.fn(),
  };

  const mockStatusFlowRepository: jest.Mocked<Partial<IStatusFlowRepository>> =
    {
      updateStatusWorks: jest.fn(),
    };

  const mockFeasibilityService = {};

  const mockPrisma = {
    $transaction: jest.fn((callback: (tx: any) => Promise<void>) => {
      const fakeTx = {};
      return callback(fakeTx);
    }),
  };

  beforeEach(async () => {
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
          provide: FeasibilityService,
          useValue: mockFeasibilityService,
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
  });

  afterEach(() => {
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

  // ─── UPDATE ───────────────────────────────────────────────

  describe('update', () => {
    const idWork = 1;
    const idUser = 42;

    // ── Validation ────────────────────────────────────────

    describe('validation', () => {
      it('should throw BadGatewayException when idWork is 0 (falsy)', async () => {
        await expect(
          service.update(0, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadGatewayException when idWork is null', async () => {
        await expect(
          service.update(null as any, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadGatewayException when idWork is undefined', async () => {
        await expect(
          service.update(undefined as any, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow(BadGatewayException);
      });

      it('should throw BadRequestException when files array is empty', async () => {
        await expect(
          service.update(idWork, idUser, [], makeItems()),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when files is null', async () => {
        await expect(
          service.update(idWork, idUser, null as any, makeItems()),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when files is undefined', async () => {
        await expect(
          service.update(idWork, idUser, undefined as any, makeItems()),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when items array is empty', async () => {
        await expect(
          service.update(idWork, idUser, [makeFile()], []),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when items is null', async () => {
        await expect(
          service.update(idWork, idUser, [makeFile()], null as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when items is undefined', async () => {
        await expect(
          service.update(idWork, idUser, [makeFile()], undefined as any),
        ).rejects.toThrow(BadRequestException);
      });
    });

    // ── Validation Messages ───────────────────────────────

    describe('validation messages', () => {
      it('should include correct message when idWork is missing', async () => {
        await expect(
          service.update(0, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow('Obra não foi encontrada');
      });

      it('should include correct message when files are missing', async () => {
        await expect(
          service.update(idWork, idUser, [], makeItems()),
        ).rejects.toThrow('Nenhum arquivo foi enviado.');
      });

      it('should include correct message when items are missing', async () => {
        await expect(
          service.update(idWork, idUser, [makeFile()], []),
        ).rejects.toThrow('Nenhum item foi enviado.');
      });
    });

    // ── Happy Path ────────────────────────────────────────

    describe('happy path', () => {
      it('should execute all operations inside a transaction', async () => {
        const files = [makeFile()];
        const items = makeItems(2);

        await service.update(idWork, idUser, files, items);

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      });

      it('should call saveFiles with correct parameters', async () => {
        const files = [makeFile('doc.pdf')];
        const items = makeItems();

        await service.update(idWork, idUser, files, items);

        expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
          idWork,
          idUser,
          files,
          expect.anything(), // tx
        );
      });

      it('should call makeItemsFeasible with correct items', async () => {
        const files = [makeFile()];
        const items = makeItems(3);

        await service.update(idWork, idUser, files, items);

        expect(feasibilityRepository.makeItemsFeasible).toHaveBeenCalledWith(
          items,
          expect.anything(),
        );
      });

      it('should update status to 46 (feasible)', async () => {
        await service.update(idWork, idUser, [makeFile()], makeItems());

        expect(statusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
          46,
          idWork,
          expect.anything(),
        );
      });

      it('should call repository methods in the correct order', async () => {
        const callOrder: string[] = [];

        feasibilityRepository.saveFiles.mockImplementation(async () => {
          callOrder.push('saveFiles');
        });
        feasibilityRepository.makeItemsFeasible.mockImplementation(async () => {
          callOrder.push('makeItemsFeasible');
        });
        statusFlowRepository.updateStatusWorks.mockImplementation(async () => {
          callOrder.push('updateStatusWorks');
        });

        await service.update(idWork, idUser, [makeFile()], makeItems());

        expect(callOrder).toEqual([
          'saveFiles',
          'makeItemsFeasible',
          'updateStatusWorks',
        ]);
      });

      it('should handle multiple files correctly', async () => {
        const files = [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')];

        await service.update(idWork, idUser, files, makeItems());

        expect(feasibilityRepository.saveFiles).toHaveBeenCalledWith(
          idWork,
          idUser,
          files,
          expect.anything(),
        );
      });
    });

    // ── Error Propagation ─────────────────────────────────

    describe('error propagation', () => {
      it('should propagate error when saveFiles fails', async () => {
        feasibilityRepository.saveFiles.mockRejectedValueOnce(
          new Error('Storage unavailable'),
        );

        await expect(
          service.update(idWork, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow('Storage unavailable');
      });

      it('should propagate error when makeItemsFeasible fails', async () => {
        feasibilityRepository.makeItemsFeasible.mockRejectedValueOnce(
          new Error('Invalid item data'),
        );

        await expect(
          service.update(idWork, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow('Invalid item data');
      });

      it('should propagate error when updateStatusWorks fails', async () => {
        statusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
          new Error('Status update failed'),
        );

        await expect(
          service.update(idWork, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow('Status update failed');
      });

      it('should not call makeItemsFeasible if saveFiles fails', async () => {
        feasibilityRepository.saveFiles.mockRejectedValueOnce(
          new Error('fail'),
        );

        await expect(
          service.update(idWork, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow();

        expect(feasibilityRepository.makeItemsFeasible).not.toHaveBeenCalled();
      });

      it('should not call updateStatusWorks if makeItemsFeasible fails', async () => {
        feasibilityRepository.makeItemsFeasible.mockRejectedValueOnce(
          new Error('fail'),
        );

        await expect(
          service.update(idWork, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow();

        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });

      it('should not call any repository method when validation fails', async () => {
        await expect(
          service.update(0, idUser, [makeFile()], makeItems()),
        ).rejects.toThrow();

        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        expect(feasibilityRepository.saveFiles).not.toHaveBeenCalled();
        expect(feasibilityRepository.makeItemsFeasible).not.toHaveBeenCalled();
        expect(statusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      });
    });
  });

  // ─── REJECT ───────────────────────────────────────────────

  describe('reject', () => {
    const mockData: RejectFeasibilityDTO = {
      idWork: 10,
      reason: 'Budget exceeded',
      description: 'The estimated cost is above the approved limit',
      idUser: 5,
    };

    // ── Happy Path ────────────────────────────────────────

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
          mockData.idWork,
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

    // ── Error Propagation ─────────────────────────────────

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
});
