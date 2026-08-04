import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/schedule/scheduleExecutionValidator.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesExecutionRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test, TestingModule } from '@nestjs/testing';

describe('WorksServicesService', () => {
  let service: FinalizeServicesService;

  const mockWorkServicesQueryRepository = {
    getServiceScheduleHistory: jest.fn(),
    getAllServicesOfWork: jest.fn(),
  };

  const mockWorkServicesExecutionRepository = {
    finalizeServices: jest.fn(),
    performServices: jest.fn(),
  };

  const mockExecutionValidator = {
    validateExecutionAndUpdateStatus: jest.fn(),
  };

  const mockExecutionReport = {
    create: jest.fn(),
  };

  const mockUpdateSchedule = {
    findExecutionOfSchedules: jest.fn(),
  };

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizeServicesService,
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockWorkServicesQueryRepository,
        },
        {
          provide: WORK_SERVICES_EXECUTION_REPOSITORY,
          useValue: mockWorkServicesExecutionRepository,
        },
        {
          provide: ScheduleExecutionValidatorService,
          useValue: mockExecutionValidator,
        },
        { provide: ExecutionReportService, useValue: mockExecutionReport },
        { provide: UPDATE_SCHEDULES_REPOSITORY, useValue: mockUpdateSchedule },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinalizeServicesService>(FinalizeServicesService);
    // repository = module.get<IWorksServicesRepository>(WORKS_SERVICE_REPOSITORY);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('finalizeServices', () => {
    const mockWorkId = 1;
    const mockScheduleId = 5;
    const mockDate = new Date('2024-01-15');

    const mockData = {
      idSchedule: mockScheduleId,
      idExecutionRestriction: 1,
      responsibility: 'John Doe',
      executionReportData: {
        description: 'Test report',
        observations: 'Test observations',
      },
    };

    const mockServices = [
      { id: 1, viabilizado: 50 },
      { id: 2, viabilizado: 50 },
    ];

    const mockHistory = [
      {
        id_programacao: mockScheduleId,
        id_servico: 1,
        prog: 30,
        real: 25,
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: mockScheduleId,
        id_servico: 2,
        prog: null,
        real: null,
        programacoes: {
          data_prog: mockDate,
        },
      },
    ];

    const mockExecutionValues = [
      { exec: 25, prog: 30 },
      { exec: 15, prog: 20 },
      { exec: null, prog: null },
    ];

    beforeEach(() => {
      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );
      mockUpdateSchedule.findExecutionOfSchedules.mockResolvedValue(
        mockExecutionValues,
      );
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockPrisma),
      );
      mockExecutionReport.create.mockResolvedValue(undefined);
      mockExecutionValidator.validateExecutionAndUpdateStatus.mockResolvedValue(
        undefined,
      );
    });

    it('should finalize services successfully', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockWorkServicesQueryRepository.getAllServicesOfWork,
      ).toHaveBeenCalledWith(mockWorkId);
      expect(
        mockWorkServicesQueryRepository.getServiceScheduleHistory,
      ).toHaveBeenCalledWith(mockWorkId);
      expect(mockUpdateSchedule.findExecutionOfSchedules).toHaveBeenCalledWith(
        mockScheduleId,
        mockWorkId,
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should create execution report when executionReportData is provided', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(mockExecutionReport.create).toHaveBeenCalledWith(
        {
          idSchedule: mockScheduleId,
          idWork: mockWorkId,
          description: 'Test report',
          observations: 'Test observations',
        },
        mockDate,
        undefined,
        mockPrisma,
      );
    });

    it('should not create execution report when executionReportData is empty', async () => {
      const dataWithoutReport = {
        idSchedule: mockScheduleId,
        idExecutionRestriction: 1,
        responsibility: 'John Doe',
        executionReportData: {},
      };

      await service.finalizeServices(mockWorkId, dataWithoutReport);

      expect(mockExecutionReport.create).not.toHaveBeenCalled();
    });

    it('should handle files when provided', async () => {
      const mockFiles = [
        {
          fieldname: 'file',
          originalname: 'test.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test'),
          size: 1234,
        },
      ] as Express.Multer.File[];

      await service.finalizeServices(mockWorkId, mockData, mockFiles);

      expect(mockExecutionReport.create).toHaveBeenCalledWith(
        expect.any(Object),
        mockDate,
        mockFiles,
        mockPrisma,
      );
    });

    it('should calculate percentages correctly for finalization', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockExecutionValidator.validateExecutionAndUpdateStatus,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockScheduleId,
          idWork: mockWorkId,
          dataProg: mockDate,
          prog: 30,
          exec: 25,
          idExecutionRestriction: 1,
          responsibility: 'John Doe',
        }),
        { exec: 40, prog: 50 },
        mockPrisma,
      );
    });

    it('should handle errors during transaction and rollback', async () => {
      const mockError = new Error('Transaction failed');
      mockExecutionReport.create.mockRejectedValue(mockError);

      await expect(
        service.finalizeServices(mockWorkId, mockData),
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle zero total planned in finalization', async () => {
      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, qtde_plan: null },
      ]);

      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockExecutionValidator.validateExecutionAndUpdateStatus,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          prog: 0,
          exec: 0,
        }),
        expect.any(Object),
        mockPrisma,
      );
    });
  });

  describe('performServices', () => {
    it('should perform services successfully', async () => {
      const mockPerformData = [
        {
          id: 1,
          idSchedule: 1,
          qtdeRealizada: 2,
        },
        {
          id: 2,
          idSchedule: 2,
          qtdeRealizada: 4,
        },
      ];

      mockWorkServicesExecutionRepository.performServices.mockResolvedValue(
        undefined,
      );

      await service.performServices(mockPerformData);

      expect(
        mockWorkServicesExecutionRepository.performServices,
      ).toHaveBeenCalledWith(mockPerformData);
      expect(
        mockWorkServicesExecutionRepository.performServices,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle empty perform data array', async () => {
      const mockPerformData = [];

      mockWorkServicesExecutionRepository.performServices.mockResolvedValue(
        undefined,
      );

      await service.performServices(mockPerformData);

      expect(
        mockWorkServicesExecutionRepository.performServices,
      ).not.toHaveBeenCalled();
    });

    it('should propagate repository errors on perform', async () => {
      const mockPerformData = [{ id: 1, idSchedule: 1, qtdeRealizada: 4 }];
      const mockError = new Error('Database error');

      mockWorkServicesExecutionRepository.performServices.mockRejectedValue(
        mockError,
      );

      await expect(service.performServices(mockPerformData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
