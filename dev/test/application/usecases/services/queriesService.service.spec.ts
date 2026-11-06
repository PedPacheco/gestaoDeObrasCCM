import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/contracts/works/management/IGetWorksDetailsRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import { serviceTypeLabel } from 'src/utils/pointByPoint/serviceType.utils';

vi.mock('src/utils/pointByPoint/serviceType.utils', () => ({
  serviceTypeLabel: vi.fn(),
}));

// ---------- Factories ----------

const contract = {
  preco: 100,
  material: 'SRV-001',
  texto_breve: 'Serviço de instalação',
};

const material = {
  preco: 20,
  codigo: 'MAT-001',
  descricao: 'Cabo',
};

const makeService = (overrides: Record<string, unknown> = {}) => ({
  id_obra: 1,
  operacao: '0010',
  ponto: 'P1',
  numero_operacao: 10,
  descricao_operacao: 'Instalação de poste',
  qtde_plan: 10,
  qtde_adicional: 2,
  viabilizado: 10,
  qtde_prog: 5,
  qtde_real: 3,
  servicos_contratos: contract,
  materiais: null,
  ...overrides,
});

const materialOnly = { servicos_contratos: null, materiais: material };
const noPrice = { servicos_contratos: null, materiais: null };

const DATA_PROG = new Date('2026-10-15T00:00:00Z');

const makeScheduledItem = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  id_programacao: 50,
  id_servico: 7,
  prog: 4,
  real: 2,
  adicional: 1,
  servicos: makeService(),
  programacoes: { data_prog: DATA_PROG },
  equipes: { equipe: 'EQ-01', encarregado: 'Carlos', perfil: 'LM' },
  ...overrides,
});

const emptyRelations = {
  programacoes: null,
  equipes: null,
};

// ---------- Suíte ----------

describe('QueriesServicesService', () => {
  let service: QueriesServicesService;

  const mockQueryRepository = {
    getAllServicesOfWork: vi.fn(),
    getNotScheduledServices: vi.fn(),
    getSelectedServices: vi.fn(),
    getServiceScheduleHistory: vi.fn(),
    getServiceScheduleHistoryByIdSchedule: vi.fn(),
    getServicesContracts: vi.fn(),
    getMaterialsContract: vi.fn(),
    getTeamsServices: vi.fn(),
    getServiceOptions: vi.fn(),
  };

  const mockWorksDetailsRepository = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(serviceTypeLabel).mockReturnValue('S');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueriesServicesService,
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockQueryRepository,
        },
        {
          provide: GET_WORKS_DETAILS_REPOSITORY,
          useValue: mockWorksDetailsRepository,
        },
      ],
    }).compile();

    service = module.get(QueriesServicesService);
  });

  // ======================================================
  describe('getAllItems', () => {
    it('should throw NotFoundException when the repository returns null', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue(null);

      await expect(service.getAllItems(1)).rejects.toThrow(NotFoundException);
      expect(mockQueryRepository.getAllServicesOfWork).toHaveBeenCalledWith(1);
    });

    it('should return an empty array when the work has no services', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue([]);

      await expect(service.getAllItems(1)).resolves.toEqual([]);
    });

    it('should map a service priced by contract', async () => {
      const raw = makeService();
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue([raw]);

      const [result] = await service.getAllItems(1);

      expect(result).toEqual({
        idObra: 1,
        operacao: '0010',
        ponto: 'P1',
        numeroOperacao: 10,
        descricaoOperacao: 'Instalação de poste',
        material: 'SRV-001',
        textoBreve: 'Serviço de instalação',
        qtdePlanejada: 10,
        qtdeAdicional: 2,
        viabilizado: 10,
        qtdeProgramada: 5,
        qtdeRealizada: 3,
        tipo: 'S',
        valorUnit: 100,
        valorTotal: 1200, // 100 * (10 + 2)
        valorReal: 300, // 100 * 3
      });
      expect(serviceTypeLabel).toHaveBeenCalledWith(raw);
    });

    it('should fall back to material data when there is no contract', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue([
        makeService(materialOnly),
      ]);

      const [result] = await service.getAllItems(1);

      expect(result).toMatchObject({
        material: 'MAT-001',
        textoBreve: 'Cabo',
        valorUnit: 20,
        valorTotal: 240,
        valorReal: 60,
      });
    });

    it('should return undefined descriptors and NaN values when there is no price source', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue([
        makeService(noPrice),
      ]);

      const [result] = await service.getAllItems(1);

      expect(result.material).toBeUndefined();
      expect(result.textoBreve).toBeUndefined();
      expect(result.valorUnit).toBeNaN();
      expect(result.valorTotal).toBeNaN();
    });
  });

  // ======================================================
  describe('getNotScheduledServices', () => {
    it('should throw NotFoundException when the repository returns null', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue(null);

      await expect(service.getNotScheduledServices(1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRepository.getNotScheduledServices).toHaveBeenCalledWith(
        1,
      );
    });

    it('should skip services whose realized quantity equals the total (null quantities count as 0)', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([
        makeService({
          viabilizado: null,
          qtde_adicional: null,
          qtde_real: 0,
          qtde_prog: 0,
        }),
      ]);

      await expect(service.getNotScheduledServices(1)).resolves.toEqual([]);
    });

    it('should skip services whose scheduled quantity equals the total', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([
        makeService({ qtde_real: 3, qtde_prog: 12 }),
      ]);

      await expect(service.getNotScheduledServices(1)).resolves.toEqual([]);
    });

    it('should return a contract service with the balance based on the scheduled quantity', async () => {
      const raw = makeService(); // total 12, real 3, prog 5
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([raw]);

      const [result] = await service.getNotScheduledServices(1);

      expect(result).toEqual({
        idObra: 1,
        operacao: '0010',
        ponto: 'P1',
        numeroOperacao: 10,
        descricaoOperacao: 'Instalação de poste',
        material: 'SRV-001',
        textoBreve: 'Serviço de instalação',
        qtdePlanejada: 10,
        qtdeAdicional: 2,
        viabilizado: 10,
        saldoDisponivel: 7, // 12 - max(3, 5)
        qtdeRealizada: 3,
        qtdeProgramada: 5,
        tipo: 'S',
        valorUnit: 100,
        valorTotal: 1200,
        valorReal: 300,
      });
      expect(serviceTypeLabel).toHaveBeenCalledWith(raw);
    });

    it('should return a material service with the balance based on the realized quantity', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([
        makeService({ ...materialOnly, qtde_real: 8, qtde_prog: 4 }),
      ]);

      const [result] = await service.getNotScheduledServices(1);

      expect(result).toMatchObject({
        material: 'MAT-001',
        textoBreve: 'Cabo',
        saldoDisponivel: 4, // 12 - max(8, 4)
        valorUnit: 20,
        valorTotal: 240,
        valorReal: 160,
      });
    });

    it('should return NaN values when there is no price source', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([
        makeService(noPrice),
      ]);

      const [result] = await service.getNotScheduledServices(1);

      expect(result.material).toBeUndefined();
      expect(result.textoBreve).toBeUndefined();
      expect(result.valorUnit).toBeNaN();
    });

    it('should keep only the pending services in a mixed list', async () => {
      mockQueryRepository.getNotScheduledServices.mockResolvedValue([
        makeService({ qtde_real: 12 }), // concluído → descartado
        makeService({ operacao: '0020' }), // pendente
      ]);

      const result = await service.getNotScheduledServices(1);

      expect(result).toHaveLength(1);
      expect(result[0].operacao).toBe('0020');
    });
  });

  // ======================================================
  describe('getSelectedServices', () => {
    const params = { idWork: 1, ids: [7] } as any;

    it('should throw NotFoundException when the repository returns null', async () => {
      mockQueryRepository.getSelectedServices.mockResolvedValue(null);

      await expect(service.getSelectedServices(params)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRepository.getSelectedServices).toHaveBeenCalledWith(
        params,
      );
    });

    it('should map a fully populated item priced by contract', async () => {
      const item = makeScheduledItem();
      mockQueryRepository.getSelectedServices.mockResolvedValue([item]);

      const [result] = await service.getSelectedServices(params);

      expect(result).toEqual({
        idObra: 1,
        operacao: '0010',
        ponto: 'P1',
        numeroOperacao: 10,
        descricaoOperacao: 'Instalação de poste',
        material: 'SRV-001',
        textoBreve: 'Serviço de instalação',
        dataProgramada: DATA_PROG,
        qtdePlanejada: 10,
        qtdeProgramada: 4,
        qtdeRealizada: 2,
        qtdeAdicional: 1,
        viabilizado: 10,
        tipo: 'S',
        valorUnit: 100,
        valorProg: 400,
        valorReal: 200,
        equipe: 'EQ-01',
        encarregado: 'Carlos',
        perfil: 'LM',
      });
      expect(serviceTypeLabel).toHaveBeenCalledWith(item.servicos);
    });

    it('should handle material pricing, missing relations and null quantities', async () => {
      mockQueryRepository.getSelectedServices.mockResolvedValue([
        makeScheduledItem({
          ...emptyRelations,
          servicos: makeService(materialOnly),
          prog: null,
          real: null,
        }),
      ]);

      const [result] = await service.getSelectedServices(params);

      expect(result).toMatchObject({
        material: 'MAT-001',
        textoBreve: 'Cabo',
        dataProgramada: undefined,
        valorUnit: 20,
        valorProg: 0,
        valorReal: 0,
        equipe: undefined,
        encarregado: undefined,
        perfil: undefined,
      });
    });

    it('should return NaN values when there is no price source', async () => {
      mockQueryRepository.getSelectedServices.mockResolvedValue([
        makeScheduledItem({ servicos: makeService(noPrice) }),
      ]);

      const [result] = await service.getSelectedServices(params);

      expect(result.material).toBeUndefined();
      expect(result.textoBreve).toBeUndefined();
      expect(result.valorUnit).toBeNaN();
    });
  });

  // ======================================================
  describe('getServiceScheduleHistory', () => {
    it('should map a fully populated history item priced by contract', async () => {
      const item = makeScheduledItem();
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue([item]);

      const [result] = await service.getServiceScheduleHistory(1);

      expect(
        mockQueryRepository.getServiceScheduleHistory,
      ).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 100,
        idProg: 50,
        idServico: 7,
        operacao: '0010',
        numeroOperacao: 10,
        descricaoOperacao: 'Instalação de poste',
        ponto: 'P1',
        codigo: 'SRV-001',
        textoBreve: 'Serviço de instalação',
        tipo: 'S',
        dataProgramada: DATA_PROG,
        qtdeProgramada: 4,
        qtdePlanejada: 10,
        qtdeViabilizado: 10,
        qtdeAdicional: 1,
        qtdeRealizada: 2,
        equipe: 'EQ-01',
        perfil: 'LM',
      });
      expect(serviceTypeLabel).toHaveBeenCalledWith(item.servicos);
    });

    it('should fall back to material data and handle missing relations', async () => {
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue([
        makeScheduledItem({
          ...emptyRelations,
          servicos: makeService(materialOnly),
        }),
      ]);

      const [result] = await service.getServiceScheduleHistory(1);

      expect(result).toMatchObject({
        codigo: 'MAT-001',
        textoBreve: 'Cabo',
        dataProgramada: undefined,
        equipe: undefined,
        perfil: undefined,
      });
    });

    it('should return undefined descriptors when there is no contract nor material', async () => {
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue([
        makeScheduledItem({ servicos: makeService(noPrice) }),
      ]);

      const [result] = await service.getServiceScheduleHistory(1);

      expect(result.codigo).toBeUndefined();
      expect(result.textoBreve).toBeUndefined();
    });

    it('should return an empty array when there is no history', async () => {
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue([]);

      await expect(service.getServiceScheduleHistory(1)).resolves.toEqual([]);
    });
  });

  // ======================================================
  describe('getServiceScheduleHistoryByIdSchedule', () => {
    const ids = [50, 51];

    it('should map a history item including the contract price', async () => {
      mockQueryRepository.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
        [makeScheduledItem()],
      );

      const [result] = await service.getServiceScheduleHistoryByIdSchedule(ids);

      expect(
        mockQueryRepository.getServiceScheduleHistoryByIdSchedule,
      ).toHaveBeenCalledWith(ids);
      expect(result).toEqual({
        id: 100,
        idProg: 50,
        idServico: 7,
        operacao: '0010',
        numeroOperacao: 10,
        descricaoOperacao: 'Instalação de poste',
        ponto: 'P1',
        codigo: 'SRV-001',
        textoBreve: 'Serviço de instalação',
        tipo: 'S',
        dataProgramada: DATA_PROG,
        qtdeProgramada: 4,
        qtdePlanejada: 10,
        qtdeViabilizado: 10,
        qtdeAdicional: 1,
        qtdeRealizada: 2,
        equipe: 'EQ-01',
        perfil: 'LM',
        preco: 100,
      });
    });

    it('should use the material price and handle missing relations', async () => {
      mockQueryRepository.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
        [
          makeScheduledItem({
            ...emptyRelations,
            servicos: makeService(materialOnly),
          }),
        ],
      );

      const [result] = await service.getServiceScheduleHistoryByIdSchedule(ids);

      expect(result).toMatchObject({
        codigo: 'MAT-001',
        textoBreve: 'Cabo',
        preco: 20,
        dataProgramada: undefined,
        equipe: undefined,
        perfil: undefined,
      });
    });

    it('should default the price to 0 when there is no price source', async () => {
      mockQueryRepository.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
        [makeScheduledItem({ servicos: makeService(noPrice) })],
      );

      const [result] = await service.getServiceScheduleHistoryByIdSchedule(ids);

      expect(result.preco).toBe(0);
      expect(result.codigo).toBeUndefined();
      expect(result.textoBreve).toBeUndefined();
    });
  });

  // ======================================================
  describe('getServiceContracts', () => {
    it('should fetch contracts using the partner of the work', async () => {
      const contracts = [{ id: 1, material: 'SRV-001' }];
      mockWorksDetailsRepository.get.mockResolvedValue({ id_turma: 7 });
      mockQueryRepository.getServicesContracts.mockResolvedValue(contracts);

      const result = await service.getServiceContracts(1);

      expect(mockWorksDetailsRepository.get).toHaveBeenCalledWith(1);
      expect(mockQueryRepository.getServicesContracts).toHaveBeenCalledWith(7);
      expect(result).toBe(contracts);
    });

    it('should call the repository with undefined when the work is not found', async () => {
      mockWorksDetailsRepository.get.mockResolvedValue(null);
      mockQueryRepository.getServicesContracts.mockResolvedValue([]);

      await service.getServiceContracts(999);

      expect(mockQueryRepository.getServicesContracts).toHaveBeenCalledWith(
        undefined,
      );
    });
  });

  // ======================================================
  describe('getTeamsServices', () => {
    it('should fetch teams using the partner of the work', async () => {
      const teams = [{ id: 1, equipe: 'EQ-01' }];
      mockWorksDetailsRepository.get.mockResolvedValue({ id_turma: 7 });
      mockQueryRepository.getTeamsServices.mockResolvedValue(teams);

      const result = await service.getTeamsServices(1);

      expect(mockWorksDetailsRepository.get).toHaveBeenCalledWith(1);
      expect(mockQueryRepository.getTeamsServices).toHaveBeenCalledWith(7);
      expect(result).toBe(teams);
    });

    it('should call the repository with undefined when the work is not found', async () => {
      mockWorksDetailsRepository.get.mockResolvedValue(null);
      mockQueryRepository.getTeamsServices.mockResolvedValue([]);

      await service.getTeamsServices(999);

      expect(mockQueryRepository.getTeamsServices).toHaveBeenCalledWith(
        undefined,
      );
    });
  });

  // ======================================================
  describe('getMaterials', () => {
    it('should return the materials from the repository', async () => {
      const materials = [material];
      mockQueryRepository.getMaterialsContract.mockResolvedValue(materials);

      await expect(service.getMaterials()).resolves.toBe(materials);
      expect(mockQueryRepository.getMaterialsContract).toHaveBeenCalledTimes(1);
    });
  });

  // ======================================================
  describe('getServiceOptions', () => {
    it('should return the service options for the given id', async () => {
      const options = [{ id: 1, label: 'Opção' }];
      mockQueryRepository.getServiceOptions.mockResolvedValue(options);

      await expect(service.getServiceOptions(1)).resolves.toBe(options);
      expect(mockQueryRepository.getServiceOptions).toHaveBeenCalledWith(1);
    });
  });
});
