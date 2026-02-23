import { Test, TestingModule } from '@nestjs/testing';

import { WORKS_SERVICE_REPOSITORY } from 'src/domain/repositories/IWorksServiceRepository';

import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { ExecutionReportService } from 'src/application/executionReport.service';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FinalizeServicesService } from 'src/application/services/finalizeServices.service';

describe('WorksServicesService', () => {
  let service: FinalizeServicesService;

  const mockWorksServicesRepository = {
    finalizeServices: jest.fn(),
    cancel: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    reascheduleServices: jest.fn(),
    getAllServicesOfWork: jest.fn(),
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
          provide: WORKS_SERVICE_REPOSITORY,
          useValue: mockWorksServicesRepository,
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
      { id: 1, qtde_plan: 50 },
      { id: 2, qtde_plan: 50 },
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
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
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
        mockWorksServicesRepository.getAllServicesOfWork,
      ).toHaveBeenCalledWith(mockWorkId);
      expect(
        mockWorksServicesRepository.getServiceScheduleHistory,
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
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
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
});
