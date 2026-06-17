import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import {
  WORKS_SERVICE_REPOSITORY,
  IWorksServicesRepository,
} from 'src/domain/repositories/IWorksServiceRepository';

import {
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
} from 'src/interface/types/servicesInterface';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { GetWorkDetailsService } from 'src/application/usecases/works/getWorkDetails.service';

describe('WorksServicesService', () => {
  let service: QueriesServicesService;
  let repository: IWorksServicesRepository;
  let getWorkDetailsService: GetWorkDetailsService;

  const mockWorksServicesRepository = {
    getNotScheduledServices: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServicesFilters: jest.fn(),
    getServicesContracts: jest.fn(),
    getTeamsServices: jest.fn(),
  };

  const mockGetWorkDetailsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueriesServicesService,
        {
          provide: WORKS_SERVICE_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
        {
          provide: GetWorkDetailsService,
          useValue: mockGetWorkDetailsService,
        },
      ],
    }).compile();

    service = module.get<QueriesServicesService>(QueriesServicesService);
    repository = module.get<IWorksServicesRepository>(WORKS_SERVICE_REPOSITORY);
    getWorkDetailsService = module.get<GetWorkDetailsService>(
      GetWorkDetailsService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    const mockParams: GetByIdParamsInterface = {
      id: 1,
      point: 'Ponto A',
      service: 'Serviço 1',
      operation: 'Operação 1',
    };

    const mockRepositoryResponse = [
      {
        id: 1,
        id_obra: 100,
        operacao: 'Operação 1',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        qtde_adicional: null,
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
          preco: 100,
        },
        programacoes: {
          data_prog: '2024-01-01',
        },
      },
      {
        id: 2,
        id_obra: 100,
        operacao: 'Operação 2',
        ponto: 'Ponto B',
        qtde_plan: 2,
        qtde_prog: 3,
        qtde_real: null,
        qtde_adicional: 1,
        servicos_contratos: {
          material: 'Material 2',
          texto_breve: 'Serviço 2',
          preco: 200,
        },
        programacoes: null,
      },
    ];

    it('should return formatted services successfully', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await service.getById(mockParams);

      expect(result).toEqual([
        {
          id: 1,
          idObra: 100,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          material: 'Material 1',
          textoBreve: 'Serviço 1',
          dataProgramada: '2024-01-01',
          qtdePlanejada: 10,
          qtdeProgramada: 8,
          qtdeRealizada: 5,
          qtdeAdicional: null,
          preco: 100,
          valorUnit: 1000,
          valorReal: 500,
        },
        {
          id: 2,
          idObra: 100,
          operacao: 'Operação 2',
          ponto: 'Ponto B',
          material: 'Material 2',
          textoBreve: 'Serviço 2',
          dataProgramada: undefined,
          qtdePlanejada: 2,
          qtdeProgramada: 3,
          qtdeRealizada: null,
          qtdeAdicional: 1,
          preco: 200,
          valorUnit: 600,
          valorReal: 0,
        },
      ]);
      expect(repository.getNotScheduledServices).toHaveBeenCalledWith(
        mockParams,
      );
      expect(repository.getNotScheduledServices).toHaveBeenCalledTimes(1);
    });

    it('should return services without optional filters', async () => {
      const paramsWithoutFilters: GetByIdParamsInterface = {
        id: 1,
      };

      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue([
        mockRepositoryResponse[0],
      ]);

      const result = await service.getById(paramsWithoutFilters);

      expect(result).toHaveLength(1);
      expect(repository.getNotScheduledServices).toHaveBeenCalledWith(
        paramsWithoutFilters,
      );
    });

    it('should throw NotFoundException when services is null', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        null,
      );

      await expect(service.getById(mockParams)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getById(mockParams)).rejects.toThrow(
        'Obra não encontrada',
      );
    });

    it('should throw NotFoundException when services is undefined', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        undefined,
      );

      await expect(service.getById(mockParams)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array when no services found', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue([]);

      const result = await service.getById(mockParams);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should calculate valorUnit and valorReal correctly', async () => {
      const serviceWithCustomValues = [
        {
          ...mockRepositoryResponse[0],
          qtde_plan: 2,
          qtde_real: 2,
          qtde_adicional: null,
          servicos_contratos: {
            ...mockRepositoryResponse[0].servicos_contratos,
            preco: 5,
          },
        },
      ];

      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        serviceWithCustomValues,
      );

      const result = await service.getById(mockParams);

      expect(result[0].valorUnit).toBe(10); // 50 * 25.5
      expect(result[0].valorReal).toBe(10); // 30 * 25.5
    });

    it('should handle service without programacoes', async () => {
      const serviceWithoutProgramacao = [
        {
          ...mockRepositoryResponse[0],
          programacoes: null,
        },
      ];

      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        serviceWithoutProgramacao,
      );

      const result = await service.getById(mockParams);

      expect(result[0].dataProgramada).toBeUndefined();
    });
  });

  describe('getSelectedServices', () => {
    const mockParams: GetSelectedServicesParamsInterface = {
      id: 1,
      idProgramacao: 10,
      point: 'Ponto A',
      service: 'Serviço 1',
      operation: 'Operação 1',
    };

    const mockRepositoryResponse = [
      {
        id: 1,
        id_obra: 100,
        operacao: 'Operação 1',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        qtde_adicional: null,
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
          preco: 100,
        },
        programacoes: {
          data_prog: '2024-01-01',
        },
        equipes: {
          equipe: 'LM 01',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
        },
      },
    ];

    it('should return formatted selected services successfully', async () => {
      mockWorksServicesRepository.getSelectedServices.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await service.getSelectedServices(mockParams);

      expect(result).toEqual([
        {
          id: 1,
          idObra: 100,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          material: 'Material 1',
          textoBreve: 'Serviço 1',
          dataProgramada: '2024-01-01',
          qtdePlanejada: 10,
          qtdeProgramada: 8,
          qtdeRealizada: 5,
          qtdeAdicional: null,
          preco: 100,
          equipe: 'LM 01',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
          valorUnit: 800,
        },
      ]);
      expect(repository.getSelectedServices).toHaveBeenCalledWith(mockParams);
      expect(repository.getSelectedServices).toHaveBeenCalledTimes(1);
    });

    it('should return multiple selected services', async () => {
      const multipleServices = [
        mockRepositoryResponse[0],
        {
          ...mockRepositoryResponse[0],
          id: 2,
          equipes: {
            encarregado: 'Maria Santos',
            perfil: 'Eletricista',
          },
        },
      ];

      mockWorksServicesRepository.getSelectedServices.mockResolvedValue(
        multipleServices,
      );

      const result = await service.getSelectedServices(mockParams);

      expect(result).toHaveLength(2);
      expect(result[1].encarregado).toBe('Maria Santos');
      expect(result[1].perfil).toBe('Eletricista');
    });

    it('should throw NotFoundException when selected services is null', async () => {
      mockWorksServicesRepository.getSelectedServices.mockResolvedValue(null);

      await expect(service.getSelectedServices(mockParams)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getSelectedServices(mockParams)).rejects.toThrow(
        'Obra não encontrada',
      );
    });

    it('should throw NotFoundException when selected services is undefined', async () => {
      mockWorksServicesRepository.getSelectedServices.mockResolvedValue(
        undefined,
      );

      await expect(service.getSelectedServices(mockParams)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array when no selected services found', async () => {
      mockWorksServicesRepository.getSelectedServices.mockResolvedValue([]);

      const result = await service.getSelectedServices(mockParams);

      expect(result).toEqual([]);
    });
  });

  describe('getServiceScheduleHistory', () => {
    it('should return schedule history successfully', async () => {
      const mockId = 1;
      const mockHistory = [
        {
          id: 1,
          data_prog: '2024-01-01',
          status: 'completed',
        },
        {
          id: 2,
          data_prog: '2024-01-02',
          status: 'pending',
        },
      ];

      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await service.getServiceScheduleHistory(mockId);

      expect(result).toEqual(mockHistory);
      expect(repository.getServiceScheduleHistory).toHaveBeenCalledWith(mockId);
      expect(repository.getServiceScheduleHistory).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no history found', async () => {
      const mockId = 999;
      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        [],
      );

      const result = await service.getServiceScheduleHistory(mockId);

      expect(result).toEqual([]);
    });

    it('should handle different id values', async () => {
      const mockId = 42;
      const mockHistory = [{ id: 1, data_prog: '2024-01-01' }];

      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );

      await service.getServiceScheduleHistory(mockId);

      expect(repository.getServiceScheduleHistory).toHaveBeenCalledWith(42);
    });
  });

  describe('getServicesFilters', () => {
    it('should return formatted filters successfully', async () => {
      const mockId = 1;
      const mockFilters = {
        services: [{ texto_breve: 'Serviço 1' }, { texto_breve: 'Serviço 2' }],
        operations: [{ operacao: 'Operação 1' }, { operacao: 'Operação 2' }],
        points: [{ ponto: 'Ponto A' }, { ponto: 'Ponto B' }],
      };

      mockWorksServicesRepository.getServicesFilters.mockResolvedValue(
        mockFilters,
      );

      const result = await service.getServicesFilters(mockId);

      expect(result).toEqual({
        services: ['Serviço 1', 'Serviço 2'],
        operations: ['Operação 1', 'Operação 2'],
        points: ['Ponto A', 'Ponto B'],
      });
      expect(repository.getServicesFilters).toHaveBeenCalledWith(mockId);
      expect(repository.getServicesFilters).toHaveBeenCalledTimes(1);
    });

    it('should return empty arrays when no filters found', async () => {
      const mockId = 1;
      const mockFilters = {
        services: [],
        operations: [],
        points: [],
      };

      mockWorksServicesRepository.getServicesFilters.mockResolvedValue(
        mockFilters,
      );

      const result = await service.getServicesFilters(mockId);

      expect(result).toEqual({
        services: [],
        operations: [],
        points: [],
      });
    });

    it('should map filter values correctly', async () => {
      const mockId = 1;
      const mockFilters = {
        services: [
          { texto_breve: 'Pintura' },
          { texto_breve: 'Alvenaria' },
          { texto_breve: 'Elétrica' },
        ],
        operations: [
          { operacao: 'Op1' },
          { operacao: 'Op2' },
          { operacao: 'Op3' },
        ],
        points: [{ ponto: 'P1' }, { ponto: 'P2' }],
      };

      mockWorksServicesRepository.getServicesFilters.mockResolvedValue(
        mockFilters,
      );

      const result = await service.getServicesFilters(mockId);

      expect(result.services).toHaveLength(3);
      expect(result.operations).toHaveLength(3);
      expect(result.points).toHaveLength(2);
    });
  });

  describe('getServiceContracts', () => {
    it('should return service contracts successfully', async () => {
      const mockIdWork = 1;
      const mockIdParceira = 100;
      const mockWork = {
        id: 1,
        id_turma: mockIdParceira,
      };
      const mockContracts = [
        {
          id: 1,
          contrato: 'CONT-001',
          valor: 10000,
        },
        {
          id: 2,
          contrato: 'CONT-002',
          valor: 20000,
        },
      ];

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getServicesContracts.mockResolvedValue(
        mockContracts,
      );

      const result = await service.getServiceContracts(mockIdWork);

      expect(result).toEqual(mockContracts);
      expect(getWorkDetailsService.get).toHaveBeenCalledWith(mockIdWork);
      expect(repository.getServicesContracts).toHaveBeenCalledWith(
        mockIdParceira,
      );
      expect(getWorkDetailsService.get).toHaveBeenCalledTimes(1);
      expect(repository.getServicesContracts).toHaveBeenCalledTimes(1);
    });

    it('should handle work without id_turma', async () => {
      const mockIdWork = 1;
      const mockWork = {
        id: 1,
        id_turma: null,
      };

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getServicesContracts.mockResolvedValue([]);

      const result = await service.getServiceContracts(mockIdWork);

      expect(repository.getServicesContracts).toHaveBeenCalledWith(null);
      expect(result).toEqual([]);
    });

    it('should handle work not found', async () => {
      const mockIdWork = 999;

      mockGetWorkDetailsService.get.mockResolvedValue(null);
      mockWorksServicesRepository.getServicesContracts.mockResolvedValue([]);

      const result = await service.getServiceContracts(mockIdWork);

      expect(repository.getServicesContracts).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when no contracts found', async () => {
      const mockIdWork = 1;
      const mockIdParceira = 100;
      const mockWork = {
        id: 1,
        id_turma: mockIdParceira,
      };

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getServicesContracts.mockResolvedValue([]);

      const result = await service.getServiceContracts(mockIdWork);

      expect(result).toEqual([]);
    });
  });

  describe('getTeamsServices', () => {
    it('should return teams services successfully', async () => {
      const mockIdWork = 1;
      const mockIdParceira = 100;
      const mockWork = {
        id: 1,
        id_turma: mockIdParceira,
      };
      const mockTeams = [
        {
          id: 1,
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
        },
        {
          id: 2,
          encarregado: 'Maria Santos',
          perfil: 'Eletricista',
        },
      ];

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue(mockTeams);

      const result = await service.getTeamsServices(mockIdWork);

      expect(result).toEqual(mockTeams);
      expect(getWorkDetailsService.get).toHaveBeenCalledWith(mockIdWork);
      expect(repository.getTeamsServices).toHaveBeenCalledWith(mockIdParceira);
      expect(getWorkDetailsService.get).toHaveBeenCalledTimes(1);
      expect(repository.getTeamsServices).toHaveBeenCalledTimes(1);
    });

    it('should handle work without id_turma', async () => {
      const mockIdWork = 1;
      const mockWork = {
        id: 1,
        id_turma: null,
      };

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue([]);

      const result = await service.getTeamsServices(mockIdWork);

      expect(repository.getTeamsServices).toHaveBeenCalledWith(null);
      expect(result).toEqual([]);
    });

    it('should handle work not found', async () => {
      const mockIdWork = 999;

      mockGetWorkDetailsService.get.mockResolvedValue(null);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue([]);

      const result = await service.getTeamsServices(mockIdWork);

      expect(repository.getTeamsServices).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when no teams found', async () => {
      const mockIdWork = 1;
      const mockIdParceira = 100;
      const mockWork = {
        id: 1,
        id_turma: mockIdParceira,
      };

      mockGetWorkDetailsService.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue([]);

      const result = await service.getTeamsServices(mockIdWork);

      expect(result).toEqual([]);
    });
  });
});
