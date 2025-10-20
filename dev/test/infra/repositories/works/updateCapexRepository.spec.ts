import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateCapexRepository } from 'src/infra/repositories/works/UpdateCapexRepository';
import { mockCalculatedValues } from '../../../../test/mocks/mocksMaterialCapex';

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

    await repository.update(mockCalculatedValues);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.obras.updateMany).toHaveBeenCalledTimes(1);

    expect(mockPrisma.obras.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ovnota: mockCalculatedValues[0].ovnota },
          { diagrama: mockCalculatedValues[0].diagrama_rede },
          { ordem_dci: mockCalculatedValues[0].diagrama_rede },
          { ordem_dcim: mockCalculatedValues[0].diagrama_rede },
        ],
      },
      data: {
        capex_mat_pend: mockCalculatedValues[0].capex_mat_pend,
        capex_mat_plan: mockCalculatedValues[0].capex_mat_plan,
        capex_mo_pend: mockCalculatedValues[0].capex_mo_pend,
        capex_mo_plan: mockCalculatedValues[0].capex_mo_plan,
        mo_planejada: mockCalculatedValues[0].mo_calc,
        qtde_planejada: mockCalculatedValues[0].qtde_calc,
        qtde_pend: mockCalculatedValues[0].qtde_pend,
      },
    });
  });

  it('should log error and throw when prisma.$transaction fails', async () => {
    const error = new Error('DB error');
    mockPrisma.$transaction.mockRejectedValueOnce(error);

    await expect(repository.update(mockCalculatedValues)).rejects.toThrow(
      'DB error',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Erro ao atualizar contratos. Payload: ${JSON.stringify(mockCalculatedValues)}`,
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
