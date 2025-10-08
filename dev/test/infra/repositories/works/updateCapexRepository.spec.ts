import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateCapexRepository } from 'src/infra/repositories/works/UpdateCapexRepository';

describe('UpdateCapexRepository', () => {
  let repository: UpdateCapexRepository;

  const mockPrisma = {
    $transaction: jest.fn(),
    obras: {
      updateMany: jest.fn(),
    },
    materiais_excluidos: {
      findMany: jest.fn(),
    },
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockData = [
    {
      diagrama_rede: '170000027938',
      qtde_calc: 5,
      qtde_pend: 0,
      mo_calc: 6.49,
      capex_mat_plan: 8016.270000000001,
      capex_mo_plan: 6.49,
      capex_mo_pend: 0,
      capex_mat_pend: 8016.270000000001,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCapexRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateCapexRepository>(UpdateCapexRepository);

    (repository as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should call prisma.$transaction with formatted data', async () => {
    mockPrisma.$transaction.mockResolvedValueOnce(undefined);

    await repository.update(mockData);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.obras.updateMany).toHaveBeenCalledTimes(1);

    expect(mockPrisma.obras.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { diagrama: mockData[0].diagrama_rede },
          { ordem_dci: mockData[0].diagrama_rede },
          { ordem_dcim: mockData[0].diagrama_rede },
        ],
      },
      data: {
        capex_mat_pend: mockData[0].capex_mat_pend,
        capex_mat_plan: mockData[0].capex_mat_plan,
        capex_mo_pend: mockData[0].capex_mo_pend,
        capex_mo_plan: mockData[0].capex_mo_plan,
        mo_planejada: mockData[0].mo_calc,
        qtde_planejada: mockData[0].qtde_calc,
        qtde_pend: mockData[0].qtde_pend,
      },
    });
  });

  it('should log error and throw when prisma.$transaction fails', async () => {
    const error = new Error('DB error');
    mockPrisma.$transaction.mockRejectedValueOnce(error);

    await expect(repository.update(mockData)).rejects.toThrow('DB error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Erro ao atualizar contratos. Payload: ${JSON.stringify(mockData)}`,
      error.stack,
    );
  });

  it('should call getDeletedMaterials and return materials', async () => {
    mockPrisma.materiais_excluidos.findMany.mockResolvedValue([
      {
        codigo_material: '234234',
      },
    ]);

    await repository.getDeletedMaterials();

    expect(mockPrisma.materiais_excluidos.findMany).toHaveBeenCalledWith({
      select: { codigo_material: true },
    });
  });
});
