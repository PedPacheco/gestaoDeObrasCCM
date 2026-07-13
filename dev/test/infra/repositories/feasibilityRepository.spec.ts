import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';

describe('FeasibilityRepository', () => {
  let repository: FeasibilityRepository;

  const prismaMock = {
    relatorio_viabilidade: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    reprovacoes_viabilidade: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    obras: {
      update: jest.fn(),
    },
  };

  const mockTx = {
    $executeRaw: jest.fn(),
    reprovacoes_viabilidade: {
      create: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
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

  describe('exists', () => {
    it('deve retornar registros encontrados por idWork', async () => {
      const mockResult = [{ id: 1 }, { id: 2 }];

      prismaMock.relatorio_viabilidade.findMany.mockResolvedValue(mockResult);

      const result = await repository.exists(10);

      expect(prismaMock.relatorio_viabilidade.findMany).toHaveBeenCalledWith({
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

      prismaMock.relatorio_viabilidade.findMany.mockResolvedValue(mockResult);

      const result = await repository.exists(100000000000000);

      expect(prismaMock.relatorio_viabilidade.findMany).toHaveBeenCalledWith({
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
      const files = [
        { filename: 'a.pdf' } as Express.Multer.File,
        { filename: 'b.pdf' } as Express.Multer.File,
      ];

      const mockTx = {
        relatorio_viabilidade: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      } as unknown as Prisma.TransactionClient;

      await repository.saveFiles(5, 1, files, mockTx);

      expect(mockTx.relatorio_viabilidade.createMany).toHaveBeenCalledWith({
        data: [
          { id_obra: 5, caminho_arquivo: 'a.pdf', id_usuario: 1 },
          { id_obra: 5, caminho_arquivo: 'b.pdf', id_usuario: 1 },
        ],
      });
    });
  });

  describe('findFiles', () => {
    it('deve buscar arquivos por idWork', async () => {
      const mockFiles = [
        { id: 1, caminho_arquivo: 'x.pdf' },
        { id: 2, caminho_arquivo: 'y.pdf' },
      ];

      prismaMock.relatorio_viabilidade.findMany.mockResolvedValue(mockFiles);

      const result = await repository.findFiles(3);

      expect(prismaMock.relatorio_viabilidade.findMany).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: 3 },
              { ovnota: '3' },
              { ordem_dci: '3' },
              { ordem_dcd: '3' },
              { ordem_dca: '3' },
              { ordem_dcim: '3' },
              { diagrama: '3' },
            ],
          },
        },
        select: { id: true, caminho_arquivo: true, id_obra: true },
      });
      expect(result).toEqual(mockFiles);
    });

    it('deve buscar arquivos por ordem', async () => {
      const mockFiles = [
        { id: 1, caminho_arquivo: 'x.pdf' },
        { id: 2, caminho_arquivo: 'y.pdf' },
      ];

      prismaMock.relatorio_viabilidade.findMany.mockResolvedValue(mockFiles);

      const result = await repository.findFiles(100000000000);

      expect(prismaMock.relatorio_viabilidade.findMany).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: undefined },
              { ovnota: '100000000000' },
              { ordem_dci: '100000000000' },
              { ordem_dcd: '100000000000' },
              { ordem_dca: '100000000000' },
              { ordem_dcim: '100000000000' },
              { diagrama: '100000000000' },
            ],
          },
        },
        select: { id: true, caminho_arquivo: true, id_obra: true },
      });
      expect(result).toEqual(mockFiles);
    });
  });

  describe('deleteFiles', () => {
    it('deve deletar arquivos por idWork', async () => {
      prismaMock.relatorio_viabilidade.deleteMany.mockResolvedValue(undefined);

      await repository.deleteFiles(9);

      expect(prismaMock.relatorio_viabilidade.deleteMany).toHaveBeenCalledWith({
        where: { id_obra: 9 },
      });
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
        where: { id_obra: 1 },
        select: {
          descricao: true,
          motivo: true,
          criado_em: true,
          novo_tabela_usuarios: { select: { nome: true } },
        },
      });
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
        idWork: 1,
        idUser: 5,
        reason: 'Material em falta',
        description: 'Sem poste',
      };

      await repository.reject(dataMock, mockTx);

      expect(mockTx.reprovacoes_viabilidade.create).toHaveBeenCalledWith({
        data: {
          descricao: dataMock.description,
          motivo: dataMock.reason,
          id_obra: dataMock.idWork,
          id_usuario: dataMock.idUser,
        },
      });
      expect(mockTx.reprovacoes_viabilidade.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate the error when the transaction fails', async () => {
      const data: RejectFeasibilityDTO = {
        description: 'Any description',
        reason: 'Any reason',
        idWork: 1,
        idUser: 1,
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
      await repository.approve(1);

      expect(prismaMock.obras.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { id_status: 1 },
      });
      expect(prismaMock.obras.update).toHaveBeenCalledTimes(1);
    });
  });
});
