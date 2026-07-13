import { Test, TestingModule } from '@nestjs/testing';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';

import {
  WORKS_SERVICE_REPOSITORY,
  IWorksServicesRepository,
} from 'src/domain/repositories/IWorksServiceRepository';

import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';

describe('WorksServicesService', () => {
  let service: WorksServicesService;
  let repository: IWorksServicesRepository;

  const mockWorksServicesRepository = {
    scheduleServices: jest.fn(),
    cancelServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    performServices: jest.fn(),
    reascheduleServices: jest.fn(),
    addServices: jest.fn(),
    addMaterials: jest.fn(),
    getAllServicesOfWork: jest.fn(),
    getAllMaterialsOfWork: jest.fn(),
    applyAdditional: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksServicesService,
        {
          provide: WORKS_SERVICE_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
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
          additional: null,
        },
        {
          id: 2,
          idTeam: 20,
          prog: 5,
          additional: null,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, viabilizado: 3, qtde_adicional: null },
        { id: 2, viabilizado: 5, qtde_adicional: null },
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

    it('should handle empty schedule array', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([]);
      mockWorksServicesRepository.scheduleServices.mockResolvedValue(undefined);

      await expect(
        service.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow('Valor do programado tem que ser enviado');
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

  describe('scheduleServices - validation', () => {
    it('should throw error when trying to schedule duplicate services', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 2,
          additional: null,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, viabilizado: 2, qtde_adicional: null },
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
          additional: null,
        },
      ];

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        { id: 1, viabilizado: 2, qtde_additional: null },
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

    it('should trigger an error id the service already exists at the specified location', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([
        {
          id: 2,
          id_contrato_servico: 2,
          ponto: 'P1',
          operacao: 'INSTALACAO',
          qtde_plan: 2,
        },
      ]);

      await expect(service.addServices(mockData)).rejects.toThrow(
        'Esse serviço já existe nesse ponto.',
      );
    });
  });

  describe('addMaterials', () => {
    it('should add material successfully', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      mockWorksServicesRepository.getAllMaterialsOfWork.mockResolvedValue([]);

      mockWorksServicesRepository.addMaterials.mockResolvedValue(undefined);

      await service.addMaterials(mockData);

      expect(repository.addMaterials).toHaveBeenCalledWith(mockData);
      expect(repository.addMaterials).toHaveBeenCalledTimes(1);
    });

    it('should trigger an error id the service already exists at the specified location', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      mockWorksServicesRepository.getAllMaterialsOfWork.mockResolvedValue([
        {
          id: 2,
          id_material: 2,
          ponto: 'P1',
          operacao: 'INSTALACAO',
          qtde_plan: 2,
        },
      ]);

      await expect(service.addMaterials(mockData)).rejects.toThrow(
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

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockServices,
      );

      const progress = await service.calculateScheduledProgress(
        1,
        mockSelectedServices,
      );

      expect(progress).toBe(100); // (10 + 20) / 100 * 100
    });

    it('should return 0 when total plan is 0', async () => {
      const mockServices = [
        { id: 1, viabilizado: 0 },
        { id: 2, viabilizado: 0 },
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
        { id: 1, viabilizado: 50 },
        { id: 2 }, // sem qtde_plan
      ];

      const mockSelectedServices = [{ prog: 25, additional: null }];

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
});
