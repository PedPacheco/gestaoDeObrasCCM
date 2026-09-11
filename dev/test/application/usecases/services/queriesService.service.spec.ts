import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';

import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import {
  GET_WORKS_DETAILS_REPOSITORY,
  IGetWorksDetailsRepository,
} from 'src/domain/repositories/works/IGetWorksDetailsRepository';

const mockHistory: GetServiceScheduleHistoryResponse[] = [
  {
    id: 1,
    id_programacao: 1,
    id_servico: 1,
    programacoes: { data_prog: new Date('2024-01-01') },
    adicional: 1,
    equipes: { equipe: 'LM01', perfil: 'B1' },
    prog: 1,
    real: 1,
    servicos: {
      operacao: 'INSTALAÇÃO',
      descricao_operacao: 'POSTE',
      numero_operacao: '1000',
      ponto: 'P1',
      servicos_contratos: { texto_breve: 'POSTE', material: '2345' },
      qtde_plan: 1,
      viabilizado: 2,
      materiais: undefined,
    },
  },
  {
    id: 2,
    id_programacao: 1,
    id_servico: 1,
    programacoes: { data_prog: new Date('2024-01-01') },
    adicional: 1,
    equipes: { equipe: 'LM01', perfil: 'B4' },
    prog: 1,
    real: 1,
    servicos: {
      operacao: 'INSTALAÇÃO',
      ponto: 'P1',
      materiais: { descricao: 'POSTE - ODI', codigo: '12344' },
      qtde_plan: 1,
      viabilizado: 2,
      descricao_operacao: 'POSTE',
      numero_operacao: '2300',
    },
  },
];

describe('WorksServicesService', () => {
  let service: QueriesServicesService;
  let repository: IWorkServicesQueryRepository;
  let getWorkDetailsService: IGetWorksDetailsRepository;

  const mockWorksServicesRepository = {
    getAllServicesOfWork: jest.fn(),
    getNotScheduledServices: jest.fn(),
    getSelectedServices: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    getServicesFilters: jest.fn(),
    getServicesContracts: jest.fn(),
    getTeamsServices: jest.fn(),
    getMaterialsContract: jest.fn(),
    getServiceOptions: jest.fn(),
  };

  const mockGetWorksDetailsRepository = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueriesServicesService,
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
        {
          provide: GET_WORKS_DETAILS_REPOSITORY,
          useValue: mockGetWorksDetailsRepository,
        },
      ],
    }).compile();

    service = module.get<QueriesServicesService>(QueriesServicesService);
    repository = module.get<IWorkServicesQueryRepository>(
      WORK_SERVICES_QUERY_REPOSITORY,
    );
    getWorkDetailsService = module.get<IGetWorksDetailsRepository>(
      GET_WORKS_DETAILS_REPOSITORY,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllItems', () => {
    const mockRepositoryResponse: GetServicesByWorkIdResponse[] = [
      {
        id: 1,
        id_obra: 100,
        id_contrato_servico: 2,
        id_material: null,
        operacao: 'Operação 1',
        descricao_operacao: 'POSTE',
        numero_operacao: '2000',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        qtde_adicional: null,
        servicos_contratos: undefined,
        viabilizado: 0,
        materiais: {
          codigo: '12345',
          descricao: 'POSTE',
          preco: new Decimal(1.5),
        },
      },
      {
        id: 2,
        id_obra: 100,
        id_contrato_servico: null,
        id_material: 2,
        operacao: 'Operação 2',
        descricao_operacao: 'POSTE - ODI',
        numero_operacao: '2000',
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
        viabilizado: 0,
        materiais: undefined,
      },
    ];

    it('should return formatted services successfully', async () => {
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await service.getAllItems(1);

      expect(result).toEqual([
        {
          id: 1,
          idObra: 100,
          operacao: 'Operação 1',
          descricaoOperacao: 'POSTE',
          numeroOperacao: '2000',
          ponto: 'Ponto A',
          material: '12345',
          textoBreve: 'POSTE',
          qtdePlanejada: 10,
          qtdeProgramada: 8,
          viabilizado: 0,
          qtdeRealizada: 5,
          qtdeAdicional: null,
          tipo: 'S',
          valorUnit: 1.5,
          valorTotal: 15,
          valorReal: 7.5,
        },
        {
          id: 2,
          idObra: 100,
          operacao: 'Operação 2',
          descricaoOperacao: 'POSTE - ODI',
          numeroOperacao: '2000',
          ponto: 'Ponto B',
          material: 'Material 2',
          textoBreve: 'Serviço 2',
          qtdePlanejada: 2,
          qtdeProgramada: 3,
          viabilizado: 0,
          qtdeRealizada: null,
          qtdeAdicional: 1,
          tipo: 'M',
          valorUnit: 200,
          valorTotal: 600,
          valorReal: 0,
        },
      ]);
      expect(repository.getAllServicesOfWork).toHaveBeenCalledWith(1);
      expect(repository.getAllServicesOfWork).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when services is null', async () => {
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(null);

      await expect(service.getAllItems(1)).rejects.toThrow(NotFoundException);
      await expect(service.getAllItems(1)).rejects.toThrow(
        'Obra não encontrada',
      );
    });

    it('should throw NotFoundException when services is undefined', async () => {
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        undefined,
      );

      await expect(service.getAllItems(1)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when no services found', async () => {
      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue([]);

      const result = await service.getAllItems(1);

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

      mockWorksServicesRepository.getAllServicesOfWork.mockResolvedValue(
        serviceWithCustomValues,
      );

      const result = await service.getAllItems(1);

      expect(result[0].valorUnit).toBe(5); // 50 * 25.5
      expect(result[0].valorTotal).toBe(10); // 50 * 25.5
      expect(result[0].valorReal).toBe(10); // 30 * 25.5
    });
  });

  describe('getNotScheduledServices', () => {
    const mockRepositoryResponse: GetServicesByWorkIdResponse[] = [
      {
        id: 1,
        id_obra: 100,
        id_contrato_servico: 10,
        id_material: null,
        operacao: 'OP001',
        ponto: 'P16',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 4,
        qtde_adicional: 2,
        viabilizado: 7,
        descricao_operacao: 'Instalação de poste',
        numero_operacao: '2000',
        materiais: null,
        servicos_contratos: {
          material: 'SER001',
          texto_breve: 'Serviço de Instalação',
          preco: 350.5,
        },
      },
      {
        id: 2,
        id_obra: 100,
        id_contrato_servico: null,
        id_material: 20,
        operacao: 'OP002',
        ponto: 'V02',
        qtde_plan: 20,
        qtde_prog: 15,
        qtde_real: 12,
        qtde_adicional: 0,
        viabilizado: 18,
        descricao_operacao: 'Substituição de cabo',
        numero_operacao: '2001',
        materiais: {
          codigo: 'MAT002',
          descricao: 'Cabo de Alumínio',
          preco: new Decimal(45.9),
        },
        servicos_contratos: null,
      },
    ];

    it('should return formatted services successfully', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await service.getNotScheduledServices(1);

      expect(result).toEqual([
        {
          id: 1,
          idObra: 100,
          operacao: 'OP001',
          descricaoOperacao: 'Instalação de poste',
          numeroOperacao: '2000',
          ponto: 'P16',
          material: 'SER001',
          textoBreve: 'Serviço de Instalação',
          qtdePlanejada: 10,
          viabilizado: 7,
          qtdeRealizada: 4,
          qtdeProgramada: 8,
          qtdeAdicional: 2,
          tipo: 'S' as const,
          saldoDisponivel: 1,
          valorUnit: 350.5,
          valorTotal: 3154.5,
          valorReal: 1402,
        },
        {
          id: 2,
          idObra: 100,
          operacao: 'OP002',
          descricaoOperacao: 'Substituição de cabo',
          numeroOperacao: '2001',
          ponto: 'V02',
          material: 'MAT002',
          textoBreve: 'Cabo de Alumínio',
          qtdePlanejada: 20,
          viabilizado: 18,
          qtdeRealizada: 12,
          qtdeProgramada: 15,
          qtdeAdicional: 0,
          tipo: 'M' as const,
          saldoDisponivel: 3,
          valorUnit: 45.9,
          valorTotal: 826.1999999999999,
          valorReal: 550.8,
        },
      ]);
      expect(repository.getNotScheduledServices).toHaveBeenCalledWith(1);
      expect(repository.getNotScheduledServices).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when services is null', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        null,
      );

      await expect(service.getNotScheduledServices(1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getNotScheduledServices(1)).rejects.toThrow(
        'Obra não encontrada',
      );
    });

    it('should throw NotFoundException when services is undefined', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        undefined,
      );

      await expect(service.getNotScheduledServices(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate valorUnit and valorReal correctly', async () => {
      mockWorksServicesRepository.getNotScheduledServices.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await service.getNotScheduledServices(1);

      expect(result[0].valorUnit).toBe(350.5);
      expect(result[0].valorTotal).toBe(3154.5);
      expect(result[0].valorReal).toBe(1402);
    });
  });

  describe('getSelectedServices', () => {
    const mockParams: GetSelectedServicesParamsInterface = {
      id: 1,
      idProgramacao: 10,
    };

    const mockRepositoryResponse: GetServicesSelectedByWorkIdResponse[] = [
      {
        id_programacao: 1,
        prog: 8,
        real: 5,
        adicional: null,
        equipes: {
          equipe: 'LM 01',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
        },
        programacoes: {
          data_prog: new Date('2024-01-01'),
        },
        servicos: {
          id: 1,
          id_obra: 100,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          qtde_plan: 10,
          viabilizado: 5,
          descricao_operacao: 'Poste',
          numero_operacao: '2000',
          servicos_contratos: {
            material: 'Material 1',
            texto_breve: 'Serviço 1',
            preco: 100,
          },
          materiais: null,
        },
      },
      {
        id_programacao: 2,
        prog: 8,
        real: 5,
        adicional: null,
        equipes: {
          equipe: 'LM 01',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
        },
        programacoes: {
          data_prog: new Date('2024-01-01'),
        },
        servicos: {
          id: 2,
          id_obra: 100,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          qtde_plan: 10,
          viabilizado: 5,
          descricao_operacao: 'Poste',
          numero_operacao: '2000',
          servicos_contratos: null,
          materiais: {
            codigo: '1234',
            descricao: 'Poste',
            preco: new Decimal(5),
          },
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
          dataProgramada: new Date('2024-01-01'),
          descricaoOperacao: 'Poste',
          numeroOperacao: '2000',
          qtdePlanejada: 10,
          qtdeProgramada: 8,
          qtdeRealizada: 5,
          qtdeAdicional: null,
          viabilizado: 5,
          equipe: 'LM 01',
          tipo: 'S',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
          valorUnit: 100,
          valorReal: 500,
          valorProg: 800,
        },
        {
          id: 2,
          idObra: 100,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          material: '1234',
          textoBreve: 'Poste',
          descricaoOperacao: 'Poste',
          numeroOperacao: '2000',
          dataProgramada: new Date('2024-01-01'),
          qtdePlanejada: 10,
          qtdeProgramada: 8,
          qtdeRealizada: 5,
          qtdeAdicional: null,
          viabilizado: 5,
          equipe: 'LM 01',
          tipo: 'M',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
          valorUnit: 5,
          valorProg: 40,
          valorReal: 25,
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

      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await service.getServiceScheduleHistory(mockId);

      expect(result).toEqual([
        {
          id: 1,
          idProg: 1,
          idServico: 1,
          dataProgramada: new Date('2024-01-01'),
          textoBreve: 'POSTE',
          tipo: 'S',
          descricaoOperacao: 'POSTE',
          numeroOperacao: '1000',
          perfil: 'B1',
          codigo: '2345',
          qtdeAdicional: 1,
          qtdePlanejada: 1,
          qtdeProgramada: 1,
          qtdeRealizada: 1,
          qtdeViabilizado: 2,
          operacao: 'INSTALAÇÃO',
          ponto: 'P1',
          equipe: 'LM01',
        },
        {
          id: 2,
          idProg: 1,
          idServico: 1,
          dataProgramada: new Date('2024-01-01'),
          textoBreve: 'POSTE - ODI',
          tipo: 'M',
          descricaoOperacao: 'POSTE',
          numeroOperacao: '2300',
          perfil: 'B4',
          codigo: '12344',
          equipe: 'LM01',
          qtdeAdicional: 1,
          qtdePlanejada: 1,
          qtdeProgramada: 1,
          qtdeRealizada: 1,
          qtdeViabilizado: 2,
          operacao: 'INSTALAÇÃO',
          ponto: 'P1',
        },
      ]);
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

      mockWorksServicesRepository.getServiceScheduleHistory.mockResolvedValue(
        mockHistory,
      );

      await service.getServiceScheduleHistory(mockId);

      expect(repository.getServiceScheduleHistory).toHaveBeenCalledWith(42);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getServicesContracts.mockResolvedValue([]);

      const result = await service.getServiceContracts(mockIdWork);

      expect(repository.getServicesContracts).toHaveBeenCalledWith(null);
      expect(result).toEqual([]);
    });

    it('should handle work not found', async () => {
      const mockIdWork = 999;

      mockGetWorksDetailsRepository.get.mockResolvedValue(null);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue([]);

      const result = await service.getTeamsServices(mockIdWork);

      expect(repository.getTeamsServices).toHaveBeenCalledWith(null);
      expect(result).toEqual([]);
    });

    it('should handle work not found', async () => {
      const mockIdWork = 999;

      mockGetWorksDetailsRepository.get.mockResolvedValue(null);
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

      mockGetWorksDetailsRepository.get.mockResolvedValue(mockWork);
      mockWorksServicesRepository.getTeamsServices.mockResolvedValue([]);

      const result = await service.getTeamsServices(mockIdWork);

      expect(result).toEqual([]);
    });
  });

  describe('getMaterials', () => {
    it('should call getMaterialsContract method', async () => {
      mockWorksServicesRepository.getMaterialsContract.mockResolvedValue([]);

      const response = await service.getMaterials();

      expect(response).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return service points successfully', async () => {
      const mockIdWork = 1;
      const mockPoints = {
        operation_description: ['Poste'],
        operation_number: ['2000'],
        points: ['P1'],
      };

      mockWorksServicesRepository.getServiceOptions.mockResolvedValue(
        mockPoints,
      );

      const result = await service.getServiceOptions(mockIdWork);

      expect(result).toEqual(mockPoints);
      expect(repository.getServiceOptions).toHaveBeenCalledTimes(1);
    });
  });
});
