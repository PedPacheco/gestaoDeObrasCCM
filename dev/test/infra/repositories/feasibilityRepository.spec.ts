import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';

describe('FeasibilityRepository', () => {
  let repository: FeasibilityRepository;

  const prismaMock = {
    relatorio_viabilidade: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    reprovacoes_viabilidade: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    obras: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTx = {
    $executeRaw: jest.fn(),
    reprovacoes_viabilidade: {
      create: jest.fn(),
    },
    relatorio_viabilidade: { update: jest.fn(), upsert: jest.fn() },
  } as unknown as Prisma.TransactionClient;

  const FIXED_DATE = new Date('2025-07-01T12:00:00Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-01T12:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeasibilityRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<FeasibilityRepository>(FeasibilityRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('exists', () => {
    it('deve retornar registros encontrados por idWork', async () => {
      const mockResult = [{ id: 1 }, { id: 2 }];

      prismaMock.relatorio_viabilidade.findFirst.mockResolvedValue(mockResult);

      const result = await repository.exists(10);

      expect(prismaMock.relatorio_viabilidade.findFirst).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: 10 },
              { ovnota: '10' },
              { ordem_dci: '10' },
              { ordem_dcd: '10' },
              { ordem_dca: '10' },
              { ordem_dcim: '10' },
              { diagrama: '10' },
            ],
          },
        },
      });

      expect(result).toEqual(mockResult);
    });

    it('deve retornar registros encontrados por ordens', async () => {
      const mockResult = [{ id: 1 }, { id: 2 }];

      prismaMock.relatorio_viabilidade.findFirst.mockResolvedValue(mockResult);

      const result = await repository.exists(100000000000000);

      expect(prismaMock.relatorio_viabilidade.findFirst).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: undefined },
              { ovnota: '100000000000000' },
              { ordem_dci: '100000000000000' },
              { ordem_dcd: '100000000000000' },
              { ordem_dca: '100000000000000' },
              { ordem_dcim: '100000000000000' },
              { diagrama: '100000000000000' },
            ],
          },
        },
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('saveFiles', () => {
    it('deve salvar arquivos corretamente', async () => {
      const files = ['a.pdf', 'b.pdf'];

      await repository.saveFiles(5, 1, 'DENTRO DO PRAZO', files, mockTx);

      expect(mockTx.relatorio_viabilidade.upsert).toHaveBeenCalledWith({
        where: { id_obra: 5 },
        create: {
          id_obra: 5,
          caminhos_arquivos: files,
          id_usuario: 1,
          data_envio: FIXED_DATE,
          prazo_viabilidade: 'DENTRO DO PRAZO',
        },
        update: {
          caminhos_arquivos: files,
          id_usuario: 1,
          data_envio: FIXED_DATE,
          prazo_viabilidade: 'DENTRO DO PRAZO',
        },
      });
    });
  });

  describe('findFiles', () => {
    it('deve buscar arquivos por idWork', async () => {
      const mockFiles = [
        { id: 1, caminho_arquivo: 'x.pdf' },
        { id: 2, caminho_arquivo: 'y.pdf' },
      ];

      prismaMock.relatorio_viabilidade.findUnique.mockResolvedValue(mockFiles);

      const result = await repository.findFiles(3);

      expect(prismaMock.relatorio_viabilidade.findUnique).toHaveBeenCalledWith({
        where: {
          id_obra: 3,
        },
        select: { id: true, caminhos_arquivos: true },
      });
      expect(result).toEqual(mockFiles);
    });
  });

  describe('getRejections', () => {
    it('should call findMany method of reprovacoes_viabilidade table and return data', async () => {
      const idWorkMock = 1;

      const responseMock = [
        {
          descricao: 'Material pendente',
          motivo: 'Poste em falta',
          criado_em: new Date('2026-06-05'),
          novo_tabela_usuarios: { nome: 'PEdro' },
        },
      ];

      prismaMock.reprovacoes_viabilidade.findMany.mockResolvedValue(
        responseMock,
      );

      const response = await repository.getRejections(idWorkMock);

      expect(response).toEqual(responseMock);
      expect(prismaMock.reprovacoes_viabilidade.findMany).toHaveBeenCalledWith({
        where: { relatorio_viabilidade: { id_obra: 1 } },
        select: {
          descricao: true,
          motivo: true,
          criado_em: true,
          novo_tabela_usuarios: { select: { nome: true } },
        },
      });
    });
  });

  describe('getProjectDate', () => {
    it('should call findUnique method of obras table and return data', async () => {
      const responseMock = { data_empreitamento: new Date('2026-06-06') };

      prismaMock.obras.findUnique.mockResolvedValue(responseMock);

      const response = await repository.getProjectDate(1);

      expect(response).toEqual(responseMock);
      expect(prismaMock.obras.findUnique).toHaveBeenCalledWith({
        select: { data_empreitamento: true },
        where: { id: 1 },
      });
    });
  });

  describe('exportFeasibility', () => {
    it('should export feasibility data without partner filter', async () => {
      const responseMock = [
        {
          ovnota: 'OV001',
          diagrama: 'DG001',
        },
      ];

      prismaMock.obras.findMany.mockResolvedValue(responseMock);

      const result = await repository.exportFeasibility(
        '2026-01-01',
        '2026-01-31',
        [],
      );

      expect(result).toEqual(responseMock);

      expect(prismaMock.obras.findMany).toHaveBeenCalledWith({
        where: {
          programacao_ponto_a_ponto: true,
          relatorio_viabilidade: {
            prazo_viabilidade: {
              not: 'PRAZO VIABILIDADE',
            },
            data_envio: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          },
        },
        select: {
          ovnota: true,
          diagrama: true,
          ordem_dci: true,
          ordem_dca: true,
          ordem_dcd: true,
          ordem_dcim: true,
          relatorio_viabilidade: {
            select: {
              data_envio: true,
            },
          },
          servicos: {
            select: {
              operacao: true,
              ponto: true,
              qtde_plan: true,
              viabilizado: true,
              descricao_operacao: true,
              numero_operacao: true,
              materiais: {
                select: {
                  codigo: true,
                  descricao: true,
                  preco: true,
                },
              },
              servicos_contratos: {
                select: {
                  material: true,
                  texto_breve: true,
                  preco: true,
                },
              },
            },
          },
        },
      });
    });

    it('should export feasibility data filtering partners', async () => {
      prismaMock.obras.findMany.mockResolvedValue([]);

      await repository.exportFeasibility('2026-01-01', '2026-01-31', [1, 2, 3]);

      expect(prismaMock.obras.findMany).toHaveBeenCalledWith({
        where: {
          programacao_ponto_a_ponto: true,
          relatorio_viabilidade: {
            prazo_viabilidade: {
              not: 'PRAZO VIABILIDADE',
            },
            data_envio: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          },
          id_turma: {
            in: [1, 2, 3],
          },
        },
        select: {
          ovnota: true,
          diagrama: true,
          ordem_dci: true,
          ordem_dca: true,
          ordem_dcd: true,
          ordem_dcim: true,
          relatorio_viabilidade: {
            select: {
              data_envio: true,
            },
          },
          servicos: {
            select: {
              operacao: true,
              ponto: true,
              qtde_plan: true,
              viabilizado: true,
              descricao_operacao: true,
              numero_operacao: true,
              materiais: {
                select: {
                  codigo: true,
                  descricao: true,
                  preco: true,
                },
              },
              servicos_contratos: {
                select: {
                  material: true,
                  texto_breve: true,
                  preco: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return empty array when no feasibility records are found', async () => {
      prismaMock.obras.findMany.mockResolvedValue([]);

      const result = await repository.exportFeasibility(
        '2026-01-01',
        '2026-01-31',
        [],
      );

      expect(result).toEqual([]);
    });

    it('should propagate prisma errors', async () => {
      prismaMock.obras.findMany.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(
        repository.exportFeasibility('2026-01-01', '2026-01-31', []),
      ).rejects.toThrow('Database error');
    });
  });

  describe('makeItemsFeasible', () => {
    it('should execute a raw UPDATE query using the transaction client', async () => {
      const itemMock = [
        {
          id: 1,
          viabilizado: 5,
        },
      ];

      await repository.makeItemsFeasible(itemMock, mockTx);

      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple items with different feasibility values', async () => {
      const itemMock = [
        { id: 1, viabilizado: 5 },
        { id: 2, viabilizado: 10 },
        { id: 3, viabilizado: 0 },
      ];

      await repository.makeItemsFeasible(itemMock, mockTx);

      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('should propagate the error when tx.$executeRaw fails', async () => {
      const itemMock = [{ id: 1, viabilizado: 5 }];

      (mockTx.$executeRaw as jest.Mock).mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(
        repository.makeItemsFeasible(itemMock, mockTx),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('reject', () => {
    it('should create a rejection record using the transaction client', async () => {
      const dataMock: RejectFeasibilityDTO = {
        workId: 1,
        userId: 5,
        reason: 'Material em falta',
        description: 'Sem poste',
        feasibilityReportId: 2,
      };

      await repository.reject(dataMock, mockTx);

      expect(mockTx.reprovacoes_viabilidade.create).toHaveBeenCalledWith({
        data: {
          descricao: dataMock.description,
          motivo: dataMock.reason,
          id_relatorio_viabilidade: dataMock.feasibilityReportId,
          id_usuario: dataMock.userId,
        },
      });
      expect(mockTx.reprovacoes_viabilidade.create).toHaveBeenCalledTimes(1);

      expect(mockTx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id: dataMock.feasibilityReportId },
        data: {
          data_envio: null,
          prazo_viabilidade: 'FALTA VIABILIDADE',
        },
      });
      expect(mockTx.relatorio_viabilidade.update).toHaveBeenCalledTimes(1);
    });

    it('should propagate the error when the transaction fails', async () => {
      const data: RejectFeasibilityDTO = {
        description: 'Any description',
        reason: 'Any reason',
        workId: 1,
        userId: 1,
        feasibilityReportId: 2,
      } as RejectFeasibilityDTO;

      (
        mockTx.reprovacoes_viabilidade.create as jest.Mock
      ).mockRejectedValueOnce(new Error('FK constraint violation'));

      await expect(repository.reject(data, mockTx)).rejects.toThrow(
        'FK constraint violation',
      );
    });
  });

  describe('approve', () => {
    it('should call approve method and approve the work correctly', async () => {
      await repository.approve(1, 2, mockTx);

      expect(mockTx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id_obra: 1 },
        data: {
          data_aprovacao: FIXED_DATE,
          aprovada: true,
          id_usuario_aprovador: 2,
        },
      });
      expect(mockTx.relatorio_viabilidade.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateFiles', () => {
    it('Should call the file update method and update the `relatorio_viabilidade` table with the new paths.', async () => {
      await repository.updateFiles(1, ['doc.pdf', 'word.pdf'], mockTx);

      expect(mockTx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id_obra: 1 },
        data: {
          caminhos_arquivos: ['doc.pdf', 'word.pdf'],
        },
      });
    });
  });
});
