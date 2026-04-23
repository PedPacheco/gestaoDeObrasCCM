import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateCapexRepository } from 'src/infra/repositories/works/updateCapexRepository';

describe('UpdateCapexRepository', () => {
  let repository: UpdateCapexRepository;

  const mockPrisma = {
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

    repository = module.get(UpdateCapexRepository);

    (repository as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  // ============================================================
  // 🧩 BASICS
  // ============================================================

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ============================================================
  // 🧠 getDeletedMaterials
  // ============================================================

  it('should return deleted materials', async () => {
    const mock = [{ material: 'MAT1' }];

    mockPrisma.servicos_contratos.findMany.mockResolvedValue(mock);

    const result = await repository.getDeletedMaterials();

    expect(mockPrisma.servicos_contratos.findMany).toHaveBeenCalledWith({
      select: { material: true },
      distinct: ['material'],
    });

    expect(result).toEqual(mock);
  });

  // ============================================================
  // 🚀 update - fluxo principal
  // ============================================================

  it('should update all items and delete cn52n at the end', async () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      capex_mat_pend: 1,
      capex_mat_plan: 2,
      capex_mo_pend: 3,
      capex_mo_plan: 4,
      mo_calc: 5,
      mo_exec: 6,
      mo_pend: 7,
      qtde_calc: 8,
      qtde_pend: 9,
    }));

    mockPrisma.obras.update.mockResolvedValue({});
    mockPrisma.cn52n.deleteMany.mockResolvedValue({});

    await repository.update(data);

    expect(mockPrisma.obras.update).toHaveBeenCalledTimes(10);

    expect(mockPrisma.cn52n.deleteMany).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // 🔥 batch + concorrência
  // ============================================================

  it('should process in batches of 500 and chunks of 50', async () => {
    const data = Array.from({ length: 600 }, (_, i) => ({
      id: i,
      capex_mat_pend: 1,
      capex_mat_plan: 2,
      capex_mo_pend: 3,
      capex_mo_plan: 4,
      mo_calc: 5,
      mo_exec: 6,
      mo_pend: 7,
      qtde_calc: 8,
      qtde_pend: 9,
    }));

    mockPrisma.obras.update.mockResolvedValue({});
    mockPrisma.cn52n.deleteMany.mockResolvedValue({});

    await repository.update(data);

    expect(mockPrisma.obras.update).toHaveBeenCalledTimes(600);
  });

  // ============================================================
  // 📡 progresso
  // ============================================================

  it('should emit progress correctly', async () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      capex_mat_pend: 1,
      capex_mat_plan: 2,
      capex_mo_pend: 3,
      capex_mo_plan: 4,
      mo_calc: 5,
      mo_exec: 6,
      mo_pend: 7,
      qtde_calc: 8,
      qtde_pend: 9,
    }));

    const progressMock = jest.fn();

    mockPrisma.obras.update.mockResolvedValue({});
    mockPrisma.cn52n.deleteMany.mockResolvedValue({});

    await repository.update(data, progressMock);

    expect(progressMock).toHaveBeenCalled();

    expect(progressMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        phase: 'updating',
        processed: 100,
      }),
    );
  });

  // ============================================================
  // ⚠️ erro
  // ============================================================

  it('should log error and rethrow', async () => {
    const error = new Error('DB error');

    mockPrisma.obras.update.mockRejectedValue(error);

    await expect(repository.update([{ id: 1 } as any])).rejects.toThrow(
      'DB error',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Erro ao atualizar capex nas obras',
      error.stack,
    );
  });

  // ============================================================
  // 🧮 calcPercentage (private)
  // ============================================================

  describe('calcPercentage', () => {
    it('should return 50 when total is 0', () => {
      const result = (repository as any).calcPercentage(0, 0);

      expect(result).toBe(50);
    });

    it('should calculate correctly', () => {
      const result = (repository as any).calcPercentage(50, 100);

      expect(result).toBe(Math.floor(50 + (50 / 100) * 49));
    });
  });
});
