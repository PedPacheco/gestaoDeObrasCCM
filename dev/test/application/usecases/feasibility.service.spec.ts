import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FileService } from 'src/application/usecases/file.service';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

const exportFeasibilityRepositoryResponse = [
  {
    ovnota: '123456789',
    diagrama: 'DG-001',
    ordem_dci: null,
    ordem_dca: null,
    ordem_dcd: null,
    ordem_dcim: null,
    relatorio_viabilidade: {
      data_envio: new Date('2026-05-20'),
    },
    servicos: [
      {
        operacao: 'OP-01',
        ponto: 'PT-01',
        numero_operacao: '001',
        descricao_operacao: 'Instalação de poste',
        qtde_plan: 10,
        qtde_adicional: 2,
        viabilizado: 8,
        servicos_contratos: {
          preco: 100,
          material: 'SRV-001',
          texto_breve: 'Serviço de instalação',
        },
        materiais: null,
      },
      {
        operacao: 'OP-02',
        ponto: 'PT-02',
        numero_operacao: '002',
        descricao_operacao: 'Lançamento de cabo',
        qtde_plan: 5,
        qtde_adicional: 1,
        viabilizado: 5,
        servicos_contratos: null,
        materiais: {
          codigo: 'MAT-001',
          descricao: 'Cabo multiplexado',
          preco: {
            toNumber: jest.fn().mockReturnValue(50),
          },
        },
      },
    ],
  },
];

describe('FeasibilityService', () => {
  let service: FeasibilityService;

  const mockRepository: jest.Mocked<IFeasibilityRepository> = {
    exists: jest.fn(),
    saveFiles: jest.fn(),
    findFiles: jest.fn(),
    approve: jest.fn(),
    getRejections: jest.fn(),
    updateFiles: jest.fn(),
    makeItemsFeasible: jest.fn(),
    reject: jest.fn(),
    getProjectDate: jest.fn(),
    exportFeasibility: jest.fn(),
  };

  const mockFileService = {
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-06T12:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeasibilityService,
        {
          provide: FEASIBILITY_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<FeasibilityService>(FeasibilityService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // feasibilityExists(id)
  // -------------------------------------------------------------------------

  it('deve lançar erro se id não for enviado em feasibilityExists', async () => {
    await expect(service.feasibilityExists(undefined as any)).rejects.toThrow(
      new BadRequestException('Obra não foi enviada'),
    );
  });

  it('deve retornar o resultado da verificação de existência', async () => {
    mockRepository.exists.mockResolvedValue([{ id: 10 }]);

    const result = await service.feasibilityExists(10);

    expect(mockRepository.exists).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 10 }]);
  });

  describe('getRejections', () => {
    it('should return a list of rejections mapped with description, reason, user name, and creation date', async () => {
      const data = [
        {
          descricao: 'Poste em falta',
          motivo: 'Material em falta',
          novo_tabela_usuarios: { nome: 'Pedro' },
          criado_em: '2026-07-11',
        },
      ];

      mockRepository.getRejections.mockResolvedValue(data);

      const response = await service.getRejections(1);

      expect(response).toEqual([
        {
          descricao: 'Poste em falta',
          motivo: 'Material em falta',
          criado_em: '2026-07-11',
          usuario: 'Pedro',
        },
      ]);
    });
  });

  describe('exportFeasibilityPendingApproval', () => {
    it('should return the data formatted for export', async () => {
      mockRepository.exportFeasibility.mockResolvedValue(
        exportFeasibilityRepositoryResponse,
      );

      const result = await service.exportFeasibilityPendingApproval([2]);

      expect(mockRepository.exportFeasibility).toHaveBeenCalledWith(46, [2]);

      expect(result).toEqual([
        {
          ovnota: '123456789',
          ordemDiagrama: 'DG-001',
          data_envio: new Date('2026-05-20'),
          operacao: 'OP-01',
          ponto: 'PT-01',
          numeroOperacao: '001',
          descricaoOperacao: 'Instalação de poste',
          material: 'SRV-001',
          textoBreve: 'Serviço de instalação',
          qtdePlanejada: 10,
          viabilizado: 8,
          tipo: 'S',
          valorUnit: 100,
          valorTotal: 1200,
          diferença: 2,
          alterado: 'Sim',
        },
        {
          ovnota: '123456789',
          ordemDiagrama: 'DG-001',
          data_envio: new Date('2026-05-20'),
          operacao: 'OP-02',
          ponto: 'PT-02',
          numeroOperacao: '002',
          descricaoOperacao: 'Lançamento de cabo',
          material: 'MAT-001',
          textoBreve: 'Cabo multiplexado',
          qtdePlanejada: 5,
          viabilizado: 5,
          tipo: 'M',
          valorUnit: 50,
          valorTotal: 300,
          diferença: 0,
          alterado: 'Não',
        },
      ]);
    });

    it('should use ordem_dci when diagrama is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: 'DCI-001',
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].ordemDiagrama).toBe('DCI-001');
    });

    it('should use ordem_dca when diagrama and ordem_dci are null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: 'DCA-001',
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].ordemDiagrama).toBe('DCA-001');
    });

    it('should use ordem_dcd when previous fields are null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: 'DCD-001',
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].ordemDiagrama).toBe('DCD-001');
    });

    it('should use ordem_dcim as last fallback', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: null,
          ordem_dcim: 'DCIM-001',
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].ordemDiagrama).toBe('DCIM-001');
    });

    it('should use 0 as price fallback', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              operacao: 'OP',
              ponto: 'P1',
              numero_operacao: '1',
              descricao_operacao: 'Desc',
              qtde_plan: 10,
              qtde_adicional: 0,
              viabilizado: 10,
              servicos_contratos: null,
              materiais: null,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].valorUnit).toBe(0);
      expect(result[0].valorTotal).toBe(0);
    });

    it('should use 0 when qtde_plan is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              ...exportFeasibilityRepositoryResponse[0].servicos[0],
              qtde_plan: null,
              qtde_adicional: 5,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].valorTotal).toBe(500);
    });

    it('should use 0 when qtde_adicional is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              ...exportFeasibilityRepositoryResponse[0].servicos[0],
              qtde_plan: 10,
              qtde_adicional: null,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result[0].valorTotal).toBe(1000);
    });
  });

  describe('exportFeasibilityPending', () => {
    it('should return the data formatted for export', async () => {
      mockRepository.exportFeasibility.mockResolvedValue(
        exportFeasibilityRepositoryResponse,
      );

      const result = await service.exportFeasibilityPending([2]);

      expect(mockRepository.exportFeasibility).toHaveBeenCalledWith(45, [2]);

      expect(result).toEqual([
        {
          ovnota: '123456789',
          ordemDiagrama: 'DG-001',
          operacao: 'OP-01',
          ponto: 'PT-01',
          numeroOperacao: '001',
          descricaoOperacao: 'Instalação de poste',
          material: 'SRV-001',
          textoBreve: 'Serviço de instalação',
          qtdePlanejada: 10,
          tipo: 'S',
          valorUnit: 100,
          valorTotal: 1200,
        },
        {
          ovnota: '123456789',
          ordemDiagrama: 'DG-001',
          operacao: 'OP-02',
          ponto: 'PT-02',
          numeroOperacao: '002',
          descricaoOperacao: 'Lançamento de cabo',
          material: 'MAT-001',
          textoBreve: 'Cabo multiplexado',
          qtdePlanejada: 5,
          tipo: 'M',
          valorUnit: 50,
          valorTotal: 300,
        },
      ]);
    });

    it('should use ordem_dci when diagrama is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: 'DCI-001',
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].ordemDiagrama).toBe('DCI-001');
    });

    it('should use ordem_dca when diagrama and ordem_dci are null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: 'DCA-001',
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].ordemDiagrama).toBe('DCA-001');
    });

    it('should use ordem_dcd when previous fields are null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: 'DCD-001',
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].ordemDiagrama).toBe('DCD-001');
    });

    it('should use ordem_dcim as last fallback', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: null,
          ordem_dcim: 'DCIM-001',
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].ordemDiagrama).toBe('DCIM-001');
    });

    it('should use 0 as price fallback', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              operacao: 'OP',
              ponto: 'P1',
              numero_operacao: '1',
              descricao_operacao: 'Desc',
              qtde_plan: 10,
              qtde_adicional: 0,
              viabilizado: 10,
              servicos_contratos: null,
              materiais: null,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].valorUnit).toBe(0);
      expect(result[0].valorTotal).toBe(0);
    });

    it('should use 0 when qtde_plan is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              ...exportFeasibilityRepositoryResponse[0].servicos[0],
              qtde_plan: null,
              qtde_adicional: 5,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].valorTotal).toBe(500);
    });

    it('should use 0 when qtde_adicional is null', async () => {
      mockRepository.exportFeasibility.mockResolvedValue([
        {
          ...exportFeasibilityRepositoryResponse[0],
          servicos: [
            {
              ...exportFeasibilityRepositoryResponse[0].servicos[0],
              qtde_plan: 10,
              qtde_adicional: null,
            },
          ],
        },
      ]);

      const result = await service.exportFeasibilityPending();

      expect(result[0].valorTotal).toBe(1000);
    });
  });
});
