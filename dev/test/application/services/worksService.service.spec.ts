import { Test, TestingModule } from '@nestjs/testing';

import {
  WORKS_SERVICE_REPOSITORY,
  IWorksServicesRepository,
} from 'src/domain/repositories/IWorksServiceRepository';

import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';
import { WorksServicesService } from 'src/application/services/worksServices.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { ExecutionReportService } from 'src/application/executionReport.service';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('WorksServicesService', () => {
  let service: WorksServicesService;
  let repository: IWorksServicesRepository;

  const mockWorksServicesRepository = {
    scheduleServices: jest.fn(),
    finalizeServices: jest.fn(),
    cancel: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    performServices: jest.fn(),
    reascheduleServices: jest.fn(),
    addServices: jest.fn(),
    getAllServicesOfWork: jest.fn(),
  };

  const mockGetWorkDetailsService = {
    get: jest.fn(),
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
        WorksServicesService,
        {
          provide: WORKS_SERVICE_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
        {
          provide: GetWorkDetailsService,
          useValue: mockGetWorkDetailsService,
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

    service = module.get<WorksServicesService>(WorksServicesService);
    repository = module.get<IWorksServicesRepository>(WORKS_SERVICE_REPOSITORY);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleServices', () => {
    it('should schedule services successfully', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 3,
        },
        {
          id: 2,
          idTeam: 20,
          prog: 5,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, qtde_plan: 3 },
        { id: 2, qtde_plan: 5 },
      ]);
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        { increment: 100 },
      );
      expect(repository.scheduleServices).toHaveBeenCalledTimes(1);
    });

    it('should schedule services with idSchedule', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 2,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, qtde_plan: 2 },
      ]);
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        { increment: 100 },
      );
    });

    it('should handle empty schedule array', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([]);
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow('Valor do programado tem que ser enviado');
    });
  });

  describe('cancel', () => {
    it('should cancel schedule successfully', async () => {
      const mockId = 1;

      mockWorksServicesRepository.cancel.mockResolvedValue(undefined);

      await service.cancel(mockId);

      expect(repository.cancel).toHaveBeenCalledWith(mockId);
      expect(repository.cancel).toHaveBeenCalledTimes(1);
    });

    it('should handle different id values for cancellation', async () => {
      const mockId = 999;

      mockWorksServicesRepository.cancel.mockResolvedValue(undefined);

      await service.cancel(mockId);

      expect(repository.cancel).toHaveBeenCalledWith(999);
    });

    it('should propagate repository errors on cancel', async () => {
      const mockId = 1;
      const mockError = new Error('Schedule not found');

      mockWorksServicesRepository.cancel.mockRejectedValue(mockError);

      await expect(service.cancel(mockId)).rejects.toThrow(
        'Schedule not found',
      );
    });
  });

  describe('scheduleServices - validation', () => {
    it('should throw error when trying to schedule duplicate services', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 2,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, qtde_plan: 2 },
      ]);
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue([
        {
          id_programacao: 5,
          id_servico: 1,
          prog: 2,
          real: 0,
        },
      ]);

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow(
        'Esse serviço já foi programado, nessa programação atual!!',
      );
    });

    it('should allow scheduling when no duplicates exist', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 2,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, qtde_plan: 2 },
      ]);
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue([
        {
          id_programacao: 3,
          id_servico: 2,
          prog: 1,
          real: 0,
        },
      ]);
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        { increment: 100 },
      );
    });

    it('should use scheduleProg parameter when provided', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 2,
        },
      ];

      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData, 50);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        50,
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

      mockWorksServicesRepository.performServices.mockResolvedValue(undefined);

      await service.performServices(mockPerformData);

      expect(repository.performServices).toHaveBeenCalledWith(mockPerformData);
      expect(repository.performServices).toHaveBeenCalledTimes(1);
    });

    it('should handle empty perform data array', async () => {
      const mockPerformData = [];

      mockWorksServicesRepository.performServices.mockResolvedValue(undefined);

      await service.performServices(mockPerformData);

      expect(repository.performServices).toHaveBeenCalledWith([]);
    });

    it('should propagate repository errors on perform', async () => {
      const mockPerformData = [{ id: 1, idSchedule: 1, qtdeRealizada: 4 }];
      const mockError = new Error('Database error');

      mockWorksServicesRepository.performServices.mockRejectedValue(mockError);

      await expect(service.performServices(mockPerformData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('reascheduleServices', () => {
    it('should reschedule services successfully', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];

      mockWorksServicesRepository.reascheduleServices.mockResolvedValue(
        undefined,
      );

      await service.reascheduleServices(mockData);

      expect(repository.reascheduleServices).toHaveBeenCalledWith(mockData);
      expect(repository.reascheduleServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('addService', () => {
    it('should add service successfully', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      mockWorksServicesRepository.addServices.mockResolvedValue(undefined);

      await service.addServices(mockData);

      expect(repository.addServices).toHaveBeenCalledWith(mockData);
      expect(repository.addServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('calculateScheduledProgress', () => {
    it('should calculate progress correctly', async () => {
      const mockServices = [
        { id: 1, qtde_plan: 10 },
        { id: 2, qtde_plan: 20 },
        { id: 3, qtde_plan: 70 },
      ];

      const mockSelectedServices = [{ prog: 10 }, { prog: 20 }];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(30); // (10 + 20) / 100 * 100
    });

    it('should return 0 when total plan is 0', async () => {
      const mockServices = [
        { id: 1, qtde_plan: 0 },
        { id: 2, qtde_plan: 0 },
      ];

      const mockSelectedServices = [{ prog: 10 }];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(0);
    });

    it('should handle services without qtde_plan', async () => {
      const mockServices = [
        { id: 1, qtde_plan: 50 },
        { id: 2 }, // sem qtde_plan
      ];

      const mockSelectedServices = [{ prog: 25 }];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(50); // 25 / 50 * 100
    });
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
        { id: 1, qtde_plan: 0 },
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
