import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { ServicesQueryController } from 'src/interface/controllers/services/servicesQuery.controller';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('ServicesQueryController', () => {
  let controller: ServicesQueryController;
  let queriesService: QueriesServicesService;

  const mockQueriesService = {
    getNotScheduledServices: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServiceContracts: jest.fn(),
    getTeamsServices: jest.fn(),
    getMaterials: jest.fn(),
    getAllItems: jest.fn(),
    getServiceOptions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesQueryController],
      providers: [
        { provide: QueriesServicesService, useValue: mockQueriesService },
      ],
    }).compile();

    controller = module.get<ServicesQueryController>(ServicesQueryController);
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

  describe('getServicePoints', () => {
    it('should return Service Points', async () => {
      const mockId = 1;
      const mockResponse = {
        operation_description: ['Poste'],
        operation_number: ['2000'],
        points: ['P1'],
      };

      mockQueriesService.getServiceOptions.mockResolvedValue(mockResponse);

      const result = await controller.getServiceOptions(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Opções retornados com sucesso',
        data: mockResponse,
      });
      expect(queriesService.getServiceOptions).toHaveBeenCalledWith(mockId);
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
  });
});
