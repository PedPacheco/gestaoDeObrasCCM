import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/works/schedule/scheduleExecutionValidator.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('WorksServicesService', () => {
  let service: FinalizeServicesService;

  const mockWorkServicesQueryRepository = {
    getServiceScheduleHistory: jest.fn(),
    getAllServicesOfWork: jest.fn(),
  };

  const mockWorkServicesExecutionRepository = {
    finalizeServices: jest.fn(),
    performServices: jest.fn(),
    reascheduleServices: jest.fn(),
  };

  const mockExecutionValidator = {
    validateExecutionAndUpdateStatus: jest.fn(),
  };

  const mockExecutionReport = {
    create: jest.fn(),
  };

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  const mockScheduleProgressCalculatorService = {
    calculateScheduleProgress: jest.fn(),
    calculateAllSchedulesProgress: jest.fn(),
    calculateAggregateProgress: jest.fn(),
  };

  const mockWorkServiceRepository = {
    updateSchedulesProgress: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
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
          provide: WORK_SERVICES_REPOSITORY,
          useValue: mockWorkServiceRepository,
        },
        {
          provide: WORK_SERVICES_EXECUTION_REPOSITORY,
          useValue: mockWorkServicesExecutionRepository,
        },
        {
          provide: ScheduleProgressCalculatorService,
          useValue: mockScheduleProgressCalculatorService,
        },
        {
          provide: STATUS_FLOW_REPOSITORY,
          useValue: mockStatusFlowRepository,
        },
        {
          provide: ScheduleExecutionValidatorService,
          useValue: mockExecutionValidator,
        },
        { provide: ExecutionReportService, useValue: mockExecutionReport },
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

  describe('reascheduleServices', () => {
    it('should reschedule services successfully', async () => {
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [
          {
            id: 1,
            id_servico: 1,
            servicos: {
              materiais: { descricao: 'POSTE' },
              servicos_contratos: { texto_breve: undefined },
              ponto: 'P1',
              operacao: 'INSTALAÇÃO',
              qtde_plan: 1,
              viabilizado: 2,
            },
            id_programacao: 1,
            programacoes: { data_prog: '' },
            equipes: { equipe: 'LM01' },
            prog: 2,
            real: 1,
            adicional: null,
          },
          {
            id: 2,
            id_servico: 2,
            servicos: {
              materiais: { descricao: 'POSTE' },
              servicos_contratos: { texto_breve: undefined },
              ponto: 'P1',
              operacao: 'INSTALAÇÃO',
              qtde_plan: 1,
              viabilizado: 2,
            },
            id_programacao: 1,
            programacoes: { data_prog: '' },
            equipes: { equipe: 'LM01' },
            prog: 2,
            real: undefined,
            adicional: null,
          },
        ],
      );

      const mockTx = {} as unknown as Prisma.TransactionClient;

      mockPrisma.$transaction.mockImplementation(async (callback) =>
        callback(mockTx),
      );

      await service.reascheduleServices(2, 1);

      expect(
        mockWorkServicesExecutionRepository.reascheduleServices,
      ).toHaveBeenCalledWith(
        [
          { id: 1, id_servico: 1 },
          { id: 2, id_servico: 2 },
        ],
        1,
        mockTx,
      );
    });

    it('should log error and rethrow when repository fails', async () => {
      const error = new Error('Database connection failed');

      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [
          {
            id: 1,
            id_servico: 1,
            servicos: {
              materiais: { descricao: 'POSTE' },
              servicos_contratos: { texto_breve: undefined },
              ponto: 'P1',
              operacao: 'INSTALAÇÃO',
              qtde_plan: 1,
              viabilizado: 2,
            },
            id_programacao: 1,
            programacoes: { data_prog: '' },
            equipes: { equipe: 'LM01' },
            prog: 2,
            real: 1,
            adicional: null,
          },
        ],
      );

      // Simula falha no repositório
      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      // ✅ Simula falha no repositório
      mockWorkServicesExecutionRepository.reascheduleServices.mockRejectedValue(
        error,
      );

      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      // 1. Verifica que o erro é re-lançado
      await expect(service.reascheduleServices(2, 1)).rejects.toThrow(
        'Database connection failed',
      );

      // 2. Verifica que o logger.error foi chamado com o erro
      expect(loggerSpy).toHaveBeenCalledWith(error);
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
      { id: 1, viabilizado: 50, qtde_real: null },
      { id: 2, viabilizado: 50, qtde_real: null },
    ];

    const mockHistory = [
      {
        id_programacao: mockScheduleId,
        id_servico: 1,
        prog: 30,
        real: 25,
        servicos: {
          materiais: null,
          servicos_contratos: {
            select: { texto_breve: 'POSTE', material: '1234' },
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: mockScheduleId,
        id_servico: 1,
        prog: null,
        real: null,
        servicos: {
          materiais: null,
          servicos_contratos: {
            select: { texto_breve: 'POSTE', material: '1234' },
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: mockScheduleId,
        id_servico: 2,
        prog: null,
        real: null,
        servicos: {
          materiais: { descricao: 'CABO', codigo: '2345' },
          servicos_contratos: {
            select: null,
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: 3,
        id_servico: 2,
        prog: null,
        real: null,
        servicos: {
          materiais: null,
          servicos_contratos: {
            select: { texto_breve: 'POSTE', material: '1234' },
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: 4,
        id_servico: 5,
        prog: 2,
        real: 2,
        servicos: {
          materiais: null,
          servicos_contratos: {
            select: { texto_breve: 'POSTE', material: '1234' },
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
      {
        id_programacao: 4,
        id_servico: 6,
        prog: 2,
        real: 0,
        servicos: {
          materiais: null,
          servicos_contratos: {
            select: { texto_breve: 'POSTE', material: '1234' },
          },
        },
        programacoes: {
          data_prog: mockDate,
        },
      },
    ];

    beforeEach(() => {
      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockPrisma),
      );
      mockExecutionReport.create.mockResolvedValue(undefined);
      mockExecutionValidator.validateExecutionAndUpdateStatus.mockResolvedValue(
        undefined,
      );
      mockWorkServicesExecutionRepository.finalizeServices.mockResolvedValue(
        undefined,
      );
      mockWorkServiceRepository.updateSchedulesProgress.mockResolvedValue(
        undefined,
      );
      mockScheduleProgressCalculatorService.calculateScheduleProgress.mockReturnValue(
        {
          prog: 60,
          exec: 50,
        },
      );
      mockScheduleProgressCalculatorService.calculateAggregateProgress.mockReturnValue(
        {
          prog: 40,
          exec: 35,
        },
      );
      mockScheduleProgressCalculatorService.calculateAllSchedulesProgress.mockReturnValue(
        [
          {
            idProgramacao: 3,
            prog: 25,
            exec: 20,
          },
          {
            idProgramacao: 4,
            prog: 60,
            exec: 50,
          },
          {
            idProgramacao: mockScheduleId,
            prog: 80,
            exec: 70,
          },
        ],
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

    it('should handle errors during transaction and rollback', async () => {
      const mockError = new Error('Transaction failed');
      mockExecutionReport.create.mockRejectedValue(mockError);

      await expect(
        service.finalizeServices(mockWorkId, mockData),
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle zero total planned in finalization', async () => {
      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        {
          id: 1,
          qtde_plan: null,
          qtde_real: null,
          viabilizado: null,
          id_material: null,
        },
      ]);

      mockScheduleProgressCalculatorService.calculateScheduleProgress.mockReturnValue(
        {
          prog: 0,
          exec: 0,
        },
      );

      mockScheduleProgressCalculatorService.calculateAggregateProgress.mockReturnValue(
        {
          prog: 0,
          exec: 0,
        },
      );

      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockExecutionValidator.validateExecutionAndUpdateStatus,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          prog: 0,
          exec: 0,
        }),
        {
          prog: 0,
          exec: 0,
        },
        mockPrisma,
      );
    });

    it('should validate execution with aggregated progress', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockExecutionValidator.validateExecutionAndUpdateStatus,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockScheduleId,
          idWork: mockWorkId,
          prog: 60,
          exec: 50,
        }),
        {
          prog: 40,
          exec: 35,
        },
        mockPrisma,
      );
    });

    it('should calculate aggregate progress before validation', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockScheduleProgressCalculatorService.calculateAggregateProgress,
      ).toHaveBeenCalledWith(mockHistory, 100, mockScheduleId);
    });

    it('should calculate schedule progress using calculator service', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockScheduleProgressCalculatorService.calculateScheduleProgress,
      ).toHaveBeenCalledWith(mockHistory, 100, mockScheduleId);
    });

    it('should recalculate progress of remaining schedules', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockScheduleProgressCalculatorService.calculateAllSchedulesProgress,
      ).toHaveBeenCalledWith(mockHistory, 100);

      expect(
        mockWorkServiceRepository.updateSchedulesProgress,
      ).toHaveBeenCalledWith(
        [
          {
            idProgramacao: 3,
            prog: 25,
            exec: 20,
          },
          {
            idProgramacao: 4,
            prog: 60,
            exec: 50,
          },
        ],
        mockPrisma,
      );
    });

    it('should finalize services through repository', async () => {
      await service.finalizeServices(mockWorkId, mockData);

      expect(
        mockWorkServicesExecutionRepository.finalizeServices,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockScheduleId,
          idWork: mockWorkId,
          prog: 60,
          exec: 50,
        }),
        mockPrisma,
      );
    });

    it('should throw NotFoundException when schedule history is not found', async () => {
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [
          {
            id_programacao: 999,
            id_servico: 1,
            prog: 30,
            real: 25,
            servicos: {
              materiais: null,
              servicos_contratos: {
                select: {
                  texto_breve: 'POSTE',
                  material: '1234',
                },
              },
            },
            programacoes: {
              data_prog: mockDate,
            },
          },
        ],
      );

      await expect(
        service.finalizeServices(mockWorkId, mockData),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.finalizeServices(mockWorkId, mockData),
      ).rejects.toThrow(
        `Nenhum histórico encontrado para a programação ${mockScheduleId} nesta obra.`,
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
