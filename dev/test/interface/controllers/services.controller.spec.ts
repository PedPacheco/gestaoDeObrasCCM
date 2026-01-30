import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

import { WorksServicesService } from 'src/application/worksServices.service';
import { ServicesController } from 'src/interface/controllers/worksServices.controller';
import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: WorksServicesService;

  const mockWorksServicesService = {
    getById: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServicesFilters: jest.fn(),
    getServiceContracts: jest.fn(),
    getTeamsServices: jest.fn(),
    scheduleServices: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: WorksServicesService,
          useValue: mockWorksServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<WorksServicesService>(WorksServicesService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getServicesByWorkId', () => {
    it('should return services by work id without filters', async () => {
      const mockId = 1;
      const mockResponse = [
        {
          id: 1,
          name: 'Serviço 1',
          point: 'Ponto A',
        },
      ];

      mockWorksServicesService.getById.mockResolvedValue(mockResponse);

      const result = await controller.getServicesByWorkId(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços da obra retornados',
        data: mockResponse,
      });
      expect(service.getById).toHaveBeenCalledWith({
        id: mockId,
        point: undefined,
        service: undefined,
        operation: undefined,
      });
      expect(service.getById).toHaveBeenCalledTimes(1);
    });

    it('should return services by work id with all filters', async () => {
      const mockId = 1;
      const mockPoint = 'Ponto A';
      const mockService = 'Serviço 1';
      const mockOperation = 'Operação 1';
      const mockResponse = [
        {
          id: 1,
          name: mockService,
          point: mockPoint,
          operation: mockOperation,
        },
      ];

      mockWorksServicesService.getById.mockResolvedValue(mockResponse);

      const result = await controller.getServicesByWorkId(
        mockId,
        mockPoint,
        mockService,
        mockOperation,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços da obra retornados',
        data: mockResponse,
      });
      expect(service.getById).toHaveBeenCalledWith({
        id: mockId,
        point: mockPoint,
        service: mockService,
        operation: mockOperation,
      });
    });

    it('should return empty array when no services found', async () => {
      const mockId = 999;
      const mockResponse = [];

      mockWorksServicesService.getById.mockResolvedValue(mockResponse);

      const result = await controller.getServicesByWorkId(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços da obra retornados',
        data: [],
      });
    });
  });

  describe('getScheduledServices', () => {
    it('should return scheduled services without filters', async () => {
      const mockId = 1;
      const mockIdProgramacao = 10;
      const mockResponse = [
        {
          id: 1,
          scheduledDate: '2024-01-01',
        },
      ];

      mockWorksServicesService.getSelectedServices.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getScheduledServices(
        mockId,
        mockIdProgramacao,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços Selecionados da obra retornados',
        data: mockResponse,
      });
      expect(service.getSelectedServices).toHaveBeenCalledWith({
        id: mockId,
        idProgramacao: mockIdProgramacao,
        point: undefined,
        service: undefined,
        operation: undefined,
      });
    });

    it('should return scheduled services with all filters', async () => {
      const mockId = 1;
      const mockIdProgramacao = 10;
      const mockPoint = 'Ponto B';
      const mockService = 'Serviço 2';
      const mockOperation = 'Operação 2';
      const mockResponse = [
        {
          id: 2,
          scheduledDate: '2024-01-02',
        },
      ];

      mockWorksServicesService.getSelectedServices.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getScheduledServices(
        mockId,
        mockIdProgramacao,
        mockPoint,
        mockService,
        mockOperation,
      );

      expect(result.data).toEqual(mockResponse);
      expect(service.getSelectedServices).toHaveBeenCalledWith({
        id: mockId,
        idProgramacao: mockIdProgramacao,
        point: mockPoint,
        service: mockService,
        operation: mockOperation,
      });
    });
  });

  describe('getServicesScheduleHistory', () => {
    it('should return schedule history', async () => {
      const mockId = 1;
      const mockResponse = [
        {
          id: 1,
          date: '2024-01-01',
          status: 'completed',
        },
        {
          id: 2,
          date: '2024-01-02',
          status: 'pending',
        },
      ];

      mockWorksServicesService.getServiceScheduleHistory.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getServicesScheduleHistory(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Histórico das programações retornados',
        data: mockResponse,
      });
      expect(service.getServiceScheduleHistory).toHaveBeenCalledWith(mockId);
      expect(service.getServiceScheduleHistory).toHaveBeenCalledTimes(1);
    });

    it('should return empty history', async () => {
      const mockId = 999;
      mockWorksServicesService.getServiceScheduleHistory.mockResolvedValue([]);

      const result = await controller.getServicesScheduleHistory(mockId);

      expect(result.data).toEqual([]);
    });
  });

  describe('getServicesFilters', () => {
    it('should return available filters', async () => {
      const mockId = 1;
      const mockResponse = {
        points: ['Ponto A', 'Ponto B'],
        services: ['Serviço 1', 'Serviço 2'],
        operations: ['Operação 1', 'Operação 2'],
      };

      mockWorksServicesService.getServicesFilters.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getServicesFilters(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores dos filtros retornados',
        data: mockResponse,
      });
      expect(service.getServicesFilters).toHaveBeenCalledWith(mockId);
    });
  });

  describe('getServiceContracts', () => {
    it('should return service contracts', async () => {
      const mockId = 1;
      const mockResponse = [
        {
          contractId: 1,
          contractNumber: 'CONT-001',
          value: 10000,
        },
      ];

      mockWorksServicesService.getServiceContracts.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getServiceContracts(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Retornado contratos dos serviços',
        data: mockResponse,
      });
      expect(service.getServiceContracts).toHaveBeenCalledWith(mockId);
    });
  });

  describe('getTeamsServices', () => {
    it('should return teams services', async () => {
      const mockId = 1;
      const mockResponse = [
        {
          teamId: 1,
          teamName: 'Equipe A',
          members: 5,
        },
      ];

      mockWorksServicesService.getTeamsServices.mockResolvedValue(mockResponse);

      const result = await controller.getTeamsServices(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Retornado equipes',
        data: mockResponse,
      });
      expect(service.getTeamsServices).toHaveBeenCalledWith(mockId);
    });
  });

  describe('scheduleServices', () => {
    it('should schedule services successfully', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
        },
        {
          id: 2,
          idTeam: 20,
          prog: 200,
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(mockScheduleData);
      expect(service.scheduleServices).toHaveBeenCalledTimes(1);
    });

    it('should schedule services with optional idSchedule', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 100,
        },
        {
          id: 2,
          idTeam: 20,
          prog: 200,
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(mockScheduleData);
      expect(service.scheduleServices).toHaveBeenCalledTimes(1);
    });

    it('should schedule single service', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith(mockScheduleData);
    });

    it('should handle empty schedule array', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith([]);
    });

    it('should schedule services with all fields populated', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 100,
        },
        {
          id: 2,
          idTeam: 20,
          idSchedule: 6,
          prog: 200,
        },
        {
          id: 3,
          idTeam: 30,
          idSchedule: 7,
          prog: 300,
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(mockScheduleData);
    });
  });

  describe('cancelScheduleService', () => {
    it('should cancel schedule successfully', async () => {
      const mockId = 1;

      mockWorksServicesService.cancel.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programação dos serviços foi cancelada',
      });
      expect(service.cancel).toHaveBeenCalledWith(mockId);
      expect(service.cancel).toHaveBeenCalledTimes(1);
    });

    it('should handle cancellation for different ids', async () => {
      const mockId = 999;

      mockWorksServicesService.cancel.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.cancel).toHaveBeenCalledWith(mockId);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from service on getById', async () => {
      const mockId = 1;
      const mockError = new Error('Database error');

      mockWorksServicesService.getById.mockRejectedValue(mockError);

      await expect(controller.getServicesByWorkId(mockId)).rejects.toThrow(
        'Database error',
      );
    });

    it('should propagate errors from service on scheduleServices', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
        },
      ];
      const mockError = new Error('Schedule conflict');

      mockWorksServicesService.scheduleServices.mockRejectedValue(mockError);

      await expect(
        controller.scheduleServices(mockScheduleData),
      ).rejects.toThrow('Schedule conflict');
    });

    it('should propagate errors from service on cancel', async () => {
      const mockId = 1;
      const mockError = new Error('Schedule not found');

      mockWorksServicesService.cancel.mockRejectedValue(mockError);

      await expect(controller.cancelScheduleService(mockId)).rejects.toThrow(
        'Schedule not found',
      );
    });
  });
});
