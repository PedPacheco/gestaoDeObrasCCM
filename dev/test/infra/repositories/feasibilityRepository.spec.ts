import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';

describe('FeasibilityRepository', () => {
  let repository: FeasibilityRepository;

  const prismaMock = {
    relatorio_viabilidade: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

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

  // -------------------------------------------------------------------------
  // exists(idWork)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // saveFiles(idWork, files)
  // -------------------------------------------------------------------------

  it('deve salvar arquivos corretamente', async () => {
    prismaMock.relatorio_viabilidade.createMany.mockResolvedValue(undefined);

    const files = [
      { filename: 'a.pdf' } as Express.Multer.File,
      { filename: 'b.pdf' } as Express.Multer.File,
    ];

    await repository.saveFiles(5, files);

    expect(prismaMock.relatorio_viabilidade.createMany).toHaveBeenCalledWith({
      data: [
        { id_obra: 5, caminho_arquivo: 'a.pdf' },
        { id_obra: 5, caminho_arquivo: 'b.pdf' },
      ],
    });
  });

  // -------------------------------------------------------------------------
  // findFiles(idWork)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // deleteFiles(idWork)
  // -------------------------------------------------------------------------

  it('deve deletar arquivos por idWork', async () => {
    prismaMock.relatorio_viabilidade.deleteMany.mockResolvedValue(undefined);

    await repository.deleteFiles(9);

    expect(prismaMock.relatorio_viabilidade.deleteMany).toHaveBeenCalledWith({
      where: { id_obra: 9 },
    });
  });
});
