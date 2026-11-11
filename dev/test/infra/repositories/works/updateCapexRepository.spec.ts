import type { CalculatedValue } from 'src/domain/entities/capex.entity';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateCapexRepository } from 'src/infra/repositories/works/management/updateCapexRepository';

const makeItem = (id: number): CalculatedValue => ({
  id,
  capex_mat_pend: 1,
  capex_mat_plan: 2,
  capex_mo_pend: 3,
  capex_mo_plan: 4,
  mo_calc: 5,
  mo_exec: 6,
  mo_pend: 7,
  qtde_calc: 8,
  qtde_pend: 9,
});

const makeData = (length: number) =>
  Array.from({ length }, (_, i) => makeItem(i + 1));

/** Texto SQL de uma chamada a $executeRaw (tagged template ou Prisma.sql). */
function sqlOf(args: unknown[]): string {
  const [first] = args;
  if (Array.isArray(first)) return first.join('?');
  if (first && typeof first === 'object') {
    const sql = first as { sql?: string; strings?: string[] };
    return sql.sql ?? sql.strings?.join('?') ?? '';
  }
  return String(first);
}

describe('UpdateCapexRepository', () => {
  let repository: UpdateCapexRepository;

  const tx = { $executeRaw: vi.fn() };

  const mockPrisma = {
    $transaction: vi.fn(),
    servicos_contratos: { findMany: vi.fn() },
  };

  const mockLogger = { error: vi.fn(), log: vi.fn(), warn: vi.fn() };

  const executedSql = () => tx.$executeRaw.mock.calls.map(sqlOf);
  const updateStatements = () =>
    executedSql().filter((sql) => /\bupdate\b/i.test(sql));
  const truncateStatements = () =>
    executedSql().filter((sql) => /\btruncate\b/i.test(sql));

  beforeEach(() => {
    vi.clearAllMocks();

    tx.$executeRaw.mockResolvedValue(0);
    // Transação interativa: executa o callback com o cliente "tx"
    mockPrisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );

    // Instanciação direta: evita o custo do Test.createTestingModule
    repository = new UpdateCapexRepository(
      mockPrisma as unknown as PrismaService,
    );
    (repository as any).logger = mockLogger;
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
  // 🚀 update — transação, lotes e truncate
  // ============================================================

  describe('update', () => {
    it('should run all statements in a single transaction', async () => {
      await repository.update(makeData(10));

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should run one UPDATE per batch of 1000 works', async () => {
      await repository.update(makeData(2500));

      expect(updateStatements()).toHaveLength(3); // 1000 + 1000 + 500
    });

    it('should run a single UPDATE when data fits in one batch', async () => {
      await repository.update(makeData(10));

      expect(updateStatements()).toHaveLength(1);
    });

    it('should truncate cn52n once, after all updates', async () => {
      await repository.update(makeData(2500));

      const sql = executedSql();
      expect(truncateStatements()).toHaveLength(1);
      expect(sql.at(-1)).toMatch(/truncate/i);
      expect(sql.at(-1)).toMatch(/cn52n/i);
    });

    // ==========================================================
    // 📡 progresso
    // ==========================================================

    it('should emit progress up to the total number of works', async () => {
      const progressMock = vi.fn();

      await repository.update(makeData(2500), progressMock);

      expect(progressMock).toHaveBeenCalled();
      expect(progressMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ phase: 'updating', processed: 2500 }),
      );
    });

    it('should emit non-decreasing percentages within 0–100', async () => {
      const progressMock = vi.fn();

      await repository.update(makeData(2500), progressMock);

      const percentages = progressMock.mock.calls.map(
        ([event]) => event.percentage as number,
      );

      percentages.forEach((value, i) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        if (i > 0) expect(value).toBeGreaterThanOrEqual(percentages[i - 1]);
      });
    });

    it('should work without a progress callback', async () => {
      await expect(repository.update(makeData(10))).resolves.not.toThrow();
    });

    // ==========================================================
    // ⚠️ erro
    // ==========================================================

    it('should log the error and rethrow', async () => {
      const error = new Error('DB error');
      tx.$executeRaw.mockRejectedValueOnce(error);

      await expect(repository.update(makeData(10))).rejects.toThrow('DB error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        error.stack,
      );
    });

    it('should not truncate cn52n when an UPDATE fails', async () => {
      tx.$executeRaw.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.update(makeData(2500))).rejects.toThrow();

      expect(truncateStatements()).toHaveLength(0);
    });

    it('should propagate transaction failures (rollback)', async () => {
      mockPrisma.$transaction.mockRejectedValueOnce(
        new Error('transaction aborted'),
      );

      await expect(repository.update(makeData(10))).rejects.toThrow(
        'transaction aborted',
      );
    });
  });

  describe('private helpers', () => {
    type Helpers = {
      calcPercentage(done: number, total: number): number;
      num(value: number): number;
    };
    const helpers = () => repository as unknown as Helpers;

    it.each([
      [0, 0, 100], // total === 0
      [5, 0, 100],
      [0, 10, 0],
      [1, 3, 33], // Math.floor
      [10, 10, 100],
      [15, 10, 100], // Math.min cap
    ])('calcPercentage(%i, %i) should return %i', (done, total, expected) => {
      expect(helpers().calcPercentage(done, total)).toBe(expected);
    });

    it.each([
      [Number.NaN, 0],
      [Number.POSITIVE_INFINITY, 0],
      [Number.NEGATIVE_INFINITY, 0],
      [42.5, 42.5],
      [-3, -3],
      [0, 0],
    ])('num(%d) should return %d', (value, expected) => {
      expect(helpers().num(value)).toBe(expected);
    });
  });
});
