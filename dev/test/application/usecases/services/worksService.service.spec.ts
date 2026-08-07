import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';

describe('WorksServicesService', () => {
  let service: WorksServicesService;
  let repository: IWorkServicesRepository;

  const mockWorksServicesRepository = {
    scheduleServices: jest.fn(),
    cancelServices: jest.fn(),
    reascheduleServices: jest.fn(),
    addItem: jest.fn(),
    applyAdditional: jest.fn(),
  };

  const mockWorkServicesQueryRepository = {
    getServiceScheduleHistory: jest.fn(),
    getAllServicesOfWork: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  const mockPrisma = { $transaction: jest.fn() };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksServicesService,
        {
          provide: WORK_SERVICES_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockWorkServicesQueryRepository,
        },
        {
          provide: STATUS_FLOW_REPOSITORY,
          useValue: mockStatusFlowRepository,
        },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorksServicesService>(WorksServicesService);
    repository = module.get<IWorkServicesRepository>(WORK_SERVICES_REPOSITORY);

    (service as any).logger = mockLogger;

    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback({}),
    );
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
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
        {
          id: 2,
          idTeam: 20,
          prog: 5,
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
      ];

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, viabilizado: 3, qtde_adicional: null },
        { id: 2, viabilizado: 5, qtde_adicional: null },
      ]);
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        { increment: 100 },
        undefined,
      );
      expect(repository.scheduleServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyAdditonal', () => {
    it('should call method of apply additional successfully', async () => {
      const mockData = [{ id: 2, additional: 2 }];

      mockWorksServicesRepository.cancelServices.mockResolvedValue(undefined);

      await service.applyAdditional(mockData);

      expect(repository.applyAdditional).toHaveBeenCalledWith(mockData);
      expect(repository.applyAdditional).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelServices', () => {
    it('should cancel schedule successfully', async () => {
      const mockId = 1;

      mockWorksServicesRepository.cancelServices.mockResolvedValue(undefined);

      await service.cancelServices(mockId);

      expect(repository.cancelServices).toHaveBeenCalledWith(mockId);
      expect(repository.cancelServices).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors on cancel', async () => {
      const mockId = 1;
      const mockError = new Error('Schedule not found');

      mockWorksServicesRepository.cancelServices.mockRejectedValue(mockError);

      await expect(service.cancelServices(mockId)).rejects.toThrow(
        'Schedule not found',
      );
    });
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

      await service.reascheduleServices(2, 1);

      expect(repository.reascheduleServices).toHaveBeenCalledWith(
        [
          { id: 1, id_servico: 1 },
          { id: 2, id_servico: 2 },
        ],

        1,
      );
      expect(repository.reascheduleServices).toHaveBeenCalledTimes(1);
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
      mockWorksServicesRepository.reascheduleServices.mockRejectedValue(error);

      // 1. Verifica que o erro é re-lançado
      await expect(service.reascheduleServices(2, 1)).rejects.toThrow(
        'Database connection failed',
      );

      // 2. Verifica que o logger.error foi chamado com o erro
      expect(mockLogger.error).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('addItem', () => {
    it('should add material successfully', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE',
        operationNumber: '2000',
        quantity: 2,
      };

      mockWorksServicesRepository.addItem.mockResolvedValue(undefined);

      await service.addItem(mockData, 'material');

      expect(repository.addItem).toHaveBeenCalledWith(mockData, 'material');
      expect(repository.addItem).toHaveBeenCalledTimes(1);
    });

    it('should add service successfully', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE',
        operationNumber: '2000',
        quantity: 2,
      };

      mockWorksServicesRepository.addItem.mockResolvedValue(undefined);

      await service.addItem(mockData, 'service');

      expect(repository.addItem).toHaveBeenCalledWith(mockData, 'service');
      expect(repository.addItem).toHaveBeenCalledTimes(1);
    });

    it('should trigger an error id the service already exists at the specified location', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE',
        operationNumber: '2000',
        quantity: 2,
      };

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        {
          id: 2,
          id_contrato_servico: 2,
          ponto: 'P1',
          numero_operacao: '2000',
          qtde_plan: 2,
        },
      ]);

      await expect(service.addItem(mockData, 'service')).rejects.toThrow(
        'Esse serviço já existe nesse ponto.',
      );
    });

    it('should trigger an error id the material already exists at the specified location', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE',
        operationNumber: '2000',
        quantity: 2,
      };

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        {
          id: 2,
          id_material: 2,
          ponto: 'P1',
          numero_operacao: '2000',
          qtde_plan: 2,
        },
      ]);

      await expect(service.addItem(mockData, 'material')).rejects.toThrow(
        'Esse material já existe nesse ponto.',
      );
    });
  });

  describe('calculateScheduledProgress', () => {
    it('should calculate progress correctly', async () => {
      const mockServices = [
        { id: 1, viabilizado: 10, qtde_adicional: null },
        { id: 2, viabilizado: 20, qtde_adicional: 2 },
      ];

      const mockSelectedServices = [
        { prog: 10, additional: null },
        { prog: 20, additional: 2 },
      ];

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(94); // (10 + 20) / 100 * 100
    });

    it('should return 0 when total plan is 0', async () => {
      const mockServices = [
        { id: 1, viabilizado: 0 },
        { id: 2, viabilizado: 0 },
      ];

      const mockSelectedServices = [{ prog: 10 }];

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue(
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
        { id: 1, viabilizado: 50 },
        { id: 2 }, // sem qtde_plan
      ];

      const mockSelectedServices = [{ prog: 25, additional: null }];

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(50); // 25 / 50 * 100
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
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
      ];

      mockWorkServicesQueryRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, viabilizado: 2, qtde_adicional: null },
      ]);
      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [
          {
            id_programacao: 5,
            id_servico: 1,
            prog: 2,
            real: 0,
            servicos: {
              ponto: 'p1',
              operacao: 'instalação',
            },
          },
        ],
      );

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow(
        'Esse serviço já foi programado, nessa programação atual!!',
      );
    });

    it('should throw error when data not sent', async () => {
      await expect(service.scheduleServices(1, [])).rejects.toThrow(
        new BadRequestException('Programação não enviada.'),
      );
    });

    it('should throw error when data sent with id different ids', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 2,
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
        {
          id: 1,
          idTeam: 10,
          idSchedule: 3,
          prog: 2,
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
      ];

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow(
        new BadRequestException(
          'Todos os serviços devem pertencer à mesma programação.',
        ),
      );
    });

    it('should throw error when progress is undefined or null', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: undefined,
          operation: 'instalação',
          point: 'p1',
          additional: null,
        },
      ];

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow(
        new BadRequestException('Valor do programado tem que ser enviado'),
      );
    });

    it('should use scheduleProg parameter when provided', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idSchedule: 5,
          idTeam: 10,
          operation: 'instalação',
          point: 'p1',
          prog: 2,
        },
      ];

      mockWorkServicesQueryRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await service.scheduleServices(1, mockScheduleData, 50);

      expect(repository.scheduleServices).toHaveBeenCalledWith(
        mockScheduleData,
        50,
        5,
      );
    });
  });
});
