import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

import { WorksServicesService } from 'src/application/services/worksServices.service';
import { ServicesController } from 'src/interface/controllers/worksServices.controller';
import {
  FinalizeServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import { QueriesServicesService } from 'src/application/services/queriesServices.service';
import { FinalizeServicesService } from 'src/application/services/finalizeServices.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: WorksServicesService;
  let queriesService: QueriesServicesService;

  const mockWorksServicesService = {
    scheduleServices: jest.fn(),
    reascheduleServices: jest.fn(),
    performServices: jest.fn(),
    applyAdditional: jest.fn(),
    cancelServices: jest.fn(),
    addServices: jest.fn(),
  };

  const mockQueriesService = {
    getById: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServicesFilters: jest.fn(),
    getServiceContracts: jest.fn(),
    getTeamsServices: jest.fn(),
  };

  const mockFinalizeServices = {
    finalizeServices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: WorksServicesService,
          useValue: mockWorksServicesService,
        },
        { provide: QueriesServicesService, useValue: mockQueriesService },
        { provide: FinalizeServicesService, useValue: mockFinalizeServices },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<WorksServicesService>(WorksServicesService);
    queriesService = module.get<QueriesServicesService>(QueriesServicesService);

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

      mockQueriesService.getById.mockResolvedValue(mockResponse);

      const result = await controller.getServicesByWorkId(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços da obra retornados',
        data: mockResponse,
      });
      expect(queriesService.getById).toHaveBeenCalledWith({
        id: mockId,
        point: undefined,
        service: undefined,
        operation: undefined,
      });
      expect(queriesService.getById).toHaveBeenCalledTimes(1);
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

      mockQueriesService.getById.mockResolvedValue(mockResponse);

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
      expect(queriesService.getById).toHaveBeenCalledWith({
        id: mockId,
        point: mockPoint,
        service: mockService,
        operation: mockOperation,
      });
    });

    it('should return empty array when no services found', async () => {
      const mockId = 999;
      const mockResponse = [];

      mockQueriesService.getById.mockResolvedValue(mockResponse);

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

      mockQueriesService.getSelectedServices.mockResolvedValue(mockResponse);

      const result = await controller.getScheduledServices(
        mockId,
        mockIdProgramacao,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços Selecionados da obra retornados',
        data: mockResponse,
      });
      expect(queriesService.getSelectedServices).toHaveBeenCalledWith({
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

      mockQueriesService.getSelectedServices.mockResolvedValue(mockResponse);

      const result = await controller.getScheduledServices(
        mockId,
        mockIdProgramacao,
        mockPoint,
        mockService,
        mockOperation,
      );

      expect(result.data).toEqual(mockResponse);
      expect(queriesService.getSelectedServices).toHaveBeenCalledWith({
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

      mockQueriesService.getServiceScheduleHistory.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getServicesScheduleHistory(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Histórico das programações retornados',
        data: mockResponse,
      });
      expect(queriesService.getServiceScheduleHistory).toHaveBeenCalledWith(
        mockId,
      );
      expect(queriesService.getServiceScheduleHistory).toHaveBeenCalledTimes(1);
    });

    it('should return empty history', async () => {
      const mockId = 999;
      mockQueriesService.getServiceScheduleHistory.mockResolvedValue([]);

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

      mockQueriesService.getServicesFilters.mockResolvedValue(mockResponse);

      const result = await controller.getServicesFilters(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores dos filtros retornados',
        data: mockResponse,
      });
      expect(queriesService.getServicesFilters).toHaveBeenCalledWith(mockId);
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

      mockQueriesService.getServiceContracts.mockResolvedValue(mockResponse);

      const result = await controller.getServiceContracts(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Retornado contratos dos serviços',
        data: mockResponse,
      });
      expect(queriesService.getServiceContracts).toHaveBeenCalledWith(mockId);
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

      mockQueriesService.getTeamsServices.mockResolvedValue(mockResponse);

      const result = await controller.getTeamsServices(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Retornado equipes',
        data: mockResponse,
      });
      expect(queriesService.getTeamsServices).toHaveBeenCalledWith(mockId);
    });
  });

  describe('applyAdditional', () => {
    it('should call service method correctly', async () => {
      const mockData = [{ id: 1, additional: 3 }];

      mockWorksServicesService.applyAdditional.mockResolvedValue(undefined);

      const result = await controller.applyAdditional(mockData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Aplicado adicional no serviço',
      });
      expect(service.applyAdditional).toHaveBeenCalledWith(mockData);
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

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
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

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
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

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
    });

    it('should handle empty schedule array', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith(1, []);
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

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
    });
  });

  describe('reascheduleServices', () => {
    it('should call the method reascheduleServices service', async () => {
      const mockId = [{ id: 1 }, { id: 2 }];

      await controller.reascheduleServices(mockId);

      expect(mockWorksServicesService.reascheduleServices).toHaveBeenCalledWith(
        mockId,
      );
    });
  });

  describe('addServices', () => {
    it('should call the method addServices service', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      await controller.addServices(mockParam);

      expect(mockWorksServicesService.addServices).toHaveBeenCalledWith(
        mockParam,
      );
    });
  });

  describe('finalizeServices', () => {
    const mockId = 10;

    const mockExecutionData = {
      data: {
        idSchedule: 123,
        executionReport: {
          supervisor: 'João da Silva',
          partialConnectionReleased: true,
          startTime: '08:30',
          finishTime: '12:45',
          startContact: 'Carlos Souza',
          endContact: 'Maria Oliveira',
          delayJustification: 'Sem atraso',
          hasEquipmentInstalled: true,
          appliedEquipment: [
            {
              equipment: 'Transformador',
              power: '75kVA',
              patrimony: 'PAT-001',
              installation: 'Poste A12',
            },
          ],
          hasEquipmentRemoved: false,
          equipmentRemoved: [],
          changesExecution: false,
          generalObservation: 'Execução OK',
          reason: 'Planejado',
          provisionalKeyInstalled: true,
          provisionalKeyReference: 'PK-123',
          provisionalKeyWithdrawn: false,
          provisionalKeyReferenceWithdrawn: '',
        },
      },
    } as FinalizeServicesDTO;

    const mockFiles = [
      {
        originalname: 'teste.pdf',
        filename: 'teste.pdf',
        path: '/uploads/teste.pdf',
        mimetype: 'application/pdf',
      },
    ] as Express.Multer.File[];

    const mockReq = {
      user: {
        sub: 99,
      },
    };

    it('should call finalizeServices service with transformed data', async () => {
      await controller.finalizeServices(
        mockId,
        mockExecutionData,
        mockFiles,
        mockReq,
      );

      const expectedExecutionReportData = {
        ...mockExecutionData.data.executionReport,
        idUser: 99,
      };

      expect(mockFinalizeServices.finalizeServices).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          idSchedule: 123,
          idUser: 99,
          executionReportData: expectedExecutionReportData,
        }),
        mockFiles,
      );
    });
  });

  describe('performServices', () => {
    it('should call the method performServices service', async () => {
      const mockParams = [
        { id: 1, idSchedule: 1, qtdeRealizada: 3 },
        { id: 2, idSchedule: 2, qtdeRealizada: 4 },
      ];

      await controller.performServices(mockParams);

      expect(mockWorksServicesService.performServices).toHaveBeenCalledWith(
        mockParams,
      );
    });
  });

  describe('cancelScheduleService', () => {
    it('should cancel schedule successfully', async () => {
      const mockId = 1;

      mockWorksServicesService.cancelServices.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programação dos serviços foi cancelada',
      });
      expect(service.cancelServices).toHaveBeenCalledWith(mockId);
      expect(service.cancelServices).toHaveBeenCalledTimes(1);
    });

    it('should handle cancellation for different ids', async () => {
      const mockId = 999;

      mockWorksServicesService.cancelServices.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.cancelServices).toHaveBeenCalledWith(mockId);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from service on getById', async () => {
      const mockId = 1;
      const mockError = new Error('Database error');

      mockQueriesService.getById.mockRejectedValue(mockError);

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
        controller.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow('Schedule conflict');
    });

    it('should propagate errors from service on cancel', async () => {
      const mockId = 1;
      const mockError = new Error('Schedule not found');

      mockWorksServicesService.cancelServices.mockRejectedValue(mockError);

      await expect(controller.cancelScheduleService(mockId)).rejects.toThrow(
        'Schedule not found',
      );
    });
  });
});
