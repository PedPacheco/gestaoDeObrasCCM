import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateCapexRepository } from 'src/infra/repositories/works/updateCapexRepository';
import { mockCalculatedValues } from '../../../../test/mocks/mocksMaterialCapex';

describe('UpdateCapexRepository', () => {
  let repository: UpdateCapexRepository;

  const mockPrisma = {
    $transaction: jest.fn(),
    obras: {
      update: jest.fn(),
    },
    servicos_contratos: {
      findMany: jest.fn(),
    },
    cn52n: {
      deleteMany: jest.fn(),
    },
  };

  const mockLogger = {
    error: jest.fn(),
  };

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

  it('should call prisma.$transaction with individual updates for each item', async () => {
    const mockTx = {
      obras: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    mockPrisma.cn52n.deleteMany.mockResolvedValue({ count: 0 });

    await repository.update(mockCalculatedValues);

    // Verifica se $transaction foi chamado (uma vez por batch de 500 itens)
    const expectedBatches = Math.ceil(mockCalculatedValues.length / 500);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(expectedBatches);

    // Verifica se update foi chamado para cada item
    expect(mockTx.obras.update).toHaveBeenCalledTimes(
      mockCalculatedValues.length,
    );

    // Verifica o formato da primeira chamada
    expect(mockTx.obras.update).toHaveBeenCalledWith({
      where: { id: mockCalculatedValues[0].id },
      data: {
        capex_mat_pend: mockCalculatedValues[0].capex_mat_pend,
        capex_mat_plan: mockCalculatedValues[0].capex_mat_plan,
        capex_mo_pend: mockCalculatedValues[0].capex_mo_pend,
        capex_mo_plan: mockCalculatedValues[0].capex_mo_plan,
        mo_planejada: mockCalculatedValues[0].mo_calc,
        qtde_planejada: mockCalculatedValues[0].qtde_calc,
        qtde_pend: mockCalculatedValues[0].qtde_pend,
        mo_final: mockCalculatedValues[0].mo_exec,
        mo_pend: mockCalculatedValues[0].mo_pend,
      },
    });

    // Verifica se cn52n.deleteMany foi chamado após todos os batches
    expect(mockPrisma.cn52n.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('should process data in batches of 500', async () => {
    const largeDataset = Array.from({ length: 1200 }, (_, i) => ({
      ...mockCalculatedValues[0],
      id: i,
    }));

    const mockTx = {
      obras: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    mockPrisma.cn52n.deleteMany.mockResolvedValue({ count: 0 });

    await repository.update(largeDataset);

    // Deve ter 3 batches (500 + 500 + 200)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3);
    expect(mockTx.obras.update).toHaveBeenCalledTimes(1200);
    expect(mockPrisma.cn52n.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('should log error and throw when prisma.$transaction fails', async () => {
    const error = new Error('DB error');
    mockPrisma.$transaction.mockRejectedValueOnce(error);

    await expect(repository.update(mockCalculatedValues)).rejects.toThrow(
      'DB error',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Erro ao atualizar capex`,
      error.stack,
    );
  });

  it('should call getDeletedMaterials and return materials', async () => {
    const mockMaterials = [{ material: 'MAT001' }, { material: 'MAT002' }];

    mockPrisma.servicos_contratos.findMany.mockResolvedValue(mockMaterials);

    const result = await repository.getDeletedMaterials();

    expect(mockPrisma.servicos_contratos.findMany).toHaveBeenCalledWith({
      select: { material: true },
      distinct: ['material'],
    });

    expect(result).toEqual(mockMaterials);
  });
});
