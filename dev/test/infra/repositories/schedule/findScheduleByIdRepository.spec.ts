import type { Prisma } from 'src/infra/generated/prisma/client';
import { toScheduleSnapshot } from 'src/infra/mappers/works/schedule/findById.mapper';

import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindScheduleByIdRepository } from 'src/infra/repositories/works/schedule/findScheduleByIdRepository';
import { SCHEDULE_SNAPSHOT_SELECT } from 'src/infra/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/infra/mappers/works/schedule/findById.mapper', () => ({
  toScheduleSnapshot: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const SCHEDULE_ID = 42;
const FINISH_TIME = new Date('2026-11-18T17:00:00Z');

const row = {
  id: SCHEDULE_ID,
  id_obra: 7,
  id_status_programacao: 3,
  hora_ter: FINISH_TIME,
};

const scheduleState = {
  id: SCHEDULE_ID,
  workId: 7,
  statusId: 3,
  scheduledFinishTime: FINISH_TIME,
};

const makeClient = () => ({
  programacoes: { findUnique: vi.fn() },
});

// ─── Suite ────────────────────────────────────────────────────────────

describe('FindScheduleByIdRepository', () => {
  let prisma: ReturnType<typeof makeClient>;
  let tx: ReturnType<typeof makeClient>;
  let repository: FindScheduleByIdRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeClient();
    tx = makeClient();
    vi.mocked(toScheduleSnapshot).mockReturnValue(scheduleState as never);

    repository = new FindScheduleByIdRepository(
      prisma as unknown as PrismaService,
    );
  });

  describe('findById', () => {
    it('queries the default client with the schedule select when no transaction is given', async () => {
      prisma.programacoes.findUnique.mockResolvedValue(row);

      await repository.findById(SCHEDULE_ID);

      expect(prisma.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: SCHEDULE_ID },
        select: SCHEDULE_SNAPSHOT_SELECT,
      });
      expect(tx.programacoes.findUnique).not.toHaveBeenCalled();
    });

    it('uses the transaction client when one is given', async () => {
      tx.programacoes.findUnique.mockResolvedValue(row);

      await repository.findById(
        SCHEDULE_ID,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: SCHEDULE_ID },
        select: SCHEDULE_SNAPSHOT_SELECT,
      });
      expect(prisma.programacoes.findUnique).not.toHaveBeenCalled();
    });

    it('maps the row to the domain type', async () => {
      prisma.programacoes.findUnique.mockResolvedValue(row);

      const result = await repository.findById(SCHEDULE_ID);

      expect(toScheduleSnapshot).toHaveBeenCalledWith(row);
      expect(result).toBe(scheduleState);
    });

    it('returns null without mapping when the schedule does not exist', async () => {
      prisma.programacoes.findUnique.mockResolvedValue(null);

      const result = await repository.findById(SCHEDULE_ID);

      expect(result).toBeNull();
      expect(toScheduleSnapshot).not.toHaveBeenCalled();
    });

    it('returns null when the schedule does not exist inside a transaction', async () => {
      tx.programacoes.findUnique.mockResolvedValue(null);

      const result = await repository.findById(
        SCHEDULE_ID,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(result).toBeNull();
      expect(toScheduleSnapshot).not.toHaveBeenCalled();
    });

    it('propagates database errors', async () => {
      const error = new Error('connection lost');
      prisma.programacoes.findUnique.mockRejectedValue(error);

      await expect(repository.findById(SCHEDULE_ID)).rejects.toBe(error);
    });
  });
});
