import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

import { ServicesController } from 'src/interface/controllers/worksServices.controller';
import {
  FinalizeServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: WorksServicesService;
  let queriesService: QueriesServicesService;

  const mockWorksServicesService = {
    scheduleServices: jest.fn(),
    reascheduleServices: jest.fn(),
    applyAdditional: jest.fn(),
    cancelServices: jest.fn(),
    addItem: jest.fn(),
  };

  const mockQueriesService = {
    getNotScheduledServices: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServiceContracts: jest.fn(),
    getTeamsServices: jest.fn(),
    getMaterials: jest.fn(),
    getAllItems: jest.fn(),
  };

  const mockFinalizeServices = {
    finalizeServices: jest.fn(),
    performServices: jest.fn(),
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

  describe('getNotScheduledServices', () => {
    const mockResponse = [
      {
        id: 1,
        name: 'Serviço 1',
        point: 'Ponto A',
      },
    ];

    it('should return services by work id without filters', async () => {
      mockQueriesService.getNotScheduledServices.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getNotScheduledServices(1);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços da obra retornados',
        data: mockResponse,
      });
      expect(queriesService.getNotScheduledServices).toHaveBeenCalledWith(1);
      expect(queriesService.getNotScheduledServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllItems', () => {
    const mockResponse = [
      {
        id: 1,
        name: 'Serviço 1',
        point: 'Ponto A',
      },
    ];

    it('should return all services and materials', async () => {
      mockQueriesService.getAllItems.mockResolvedValue(mockResponse);

      const result = await controller.getAllItems(1);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Todos os materiais e serviços da obra retornados',
        data: mockResponse,
      });
      expect(queriesService.getAllItems).toHaveBeenCalledWith(1);
      expect(queriesService.getAllItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMaterials', () => {
    it('should return materials', async () => {
      const mockResponse = [
        {
          id: 1,
          id_material: 1,
          ponto: 'P1',
          operacao: 'INSTALAÇAO',
          qtde_plan: 1,
          qtde_adicional: 1,
          viabilizado: 1,
        },
      ];

      mockQueriesService.getMaterials.mockResolvedValue(mockResponse);

      const result = await controller.getMaterials();

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Materiais retornados',
        data: mockResponse,
      });
      expect(queriesService.getMaterials).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScheduledServices', () => {
    it('should return scheduled services without filters', async () => {
      const mockResponse = [
        {
          id: 1,
          scheduledDate: '2024-01-01',
        },
      ];

      mockQueriesService.getSelectedServices.mockResolvedValue(mockResponse);

      const result = await controller.getScheduledServices(1, 10);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços Selecionados da obra retornados',
        data: mockResponse,
      });
      expect(queriesService.getSelectedServices).toHaveBeenCalledWith({
        id: 1,
        idProgramacao: 10,
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
      await controller.reascheduleServices(2, 1);

      expect(mockWorksServicesService.reascheduleServices).toHaveBeenCalledWith(
        2,
        1,
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
        operationDescription: 'POSTE - ODI',
        operationNumber: '2000',
        qtdePlan: 2,
      };

      await controller.addServices(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        mockParam,
        'service',
      );
    });
  });

  describe('addMaterials', () => {
    it('should call the method addMaterials service', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        operationNumber: '2000',
        qtdePlan: 2,
      };

      await controller.addMaterials(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        mockParam,
        'material',
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

    it('should call finalizeServices service with transformed data', async () => {
      await controller.finalizeServices(
        mockId,
        { data: { executionReport: undefined, idSchedule: 1 } },
        mockFiles,
        mockReq,
      );

      expect(mockFinalizeServices.finalizeServices).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          idSchedule: 1,
          idUser: 99,
          executionReportData: undefined,
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

      expect(mockFinalizeServices.performServices).toHaveBeenCalledWith(
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

      mockQueriesService.getNotScheduledServices.mockRejectedValue(mockError);

      await expect(controller.getNotScheduledServices(mockId)).rejects.toThrow(
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
