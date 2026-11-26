import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';
import type { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import type { Prisma } from 'src/infra/generated/prisma/client';
import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindScheduleByIdRepository } from 'src/infra/repositories/works/schedule/findScheduleByIdRepository';
import { SCHEDULE_SNAPSHOT_SELECT } from 'src/infra/types';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

// ─── Fixtures ─────────────────────────────────────────────────────────

const SCHEDULE_ID = 42;
const START_TIME = new Date('2026-11-18T14:00:00Z');
const FINISH_TIME = new Date('2026-11-18T17:00:00Z');
const DATA_PROG = new Date('2026-11-18');

const row = {
  id: SCHEDULE_ID,
  id_obra: 7,
  id_status_programacao: 3,
  hora_ini: START_TIME,
  hora_ter: FINISH_TIME,
  data_prog: DATA_PROG,
  reprovada: false,
};

const scheduleState = {
  id: SCHEDULE_ID,
  workId: 7,
  statusId: 3,
  dataProg: DATA_PROG,
  startTime: START_TIME,
  finishTime: FINISH_TIME,
  rejected: false,
} as unknown as WorkSchedule;

const makeClient = () => ({
  programacoes: { findUnique: vi.fn() },
});

// ─── Suite ────────────────────────────────────────────────────────────

describe('FindScheduleByIdRepository', () => {
  let prisma: ReturnType<typeof makeClient>;
  let tx: ReturnType<typeof makeClient>;
  let repository: FindScheduleByIdRepository;
  let toConfirmationSpy: MockInstance<typeof WorkScheduleMapper.toConfirmation>;

  beforeEach(() => {
    prisma = makeClient();
    tx = makeClient();
    repository = new FindScheduleByIdRepository(
      prisma as unknown as PrismaService,
    );
    toConfirmationSpy = vi
      .spyOn(WorkScheduleMapper, 'toConfirmation')
      .mockReturnValue(scheduleState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      const result = await repository.findById(
        SCHEDULE_ID,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: SCHEDULE_ID },
        select: SCHEDULE_SNAPSHOT_SELECT,
      });
      expect(prisma.programacoes.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(scheduleState);
    });

    it('maps the row to the domain type', async () => {
      prisma.programacoes.findUnique.mockResolvedValue(row);

      const result = await repository.findById(SCHEDULE_ID);

      expect(toConfirmationSpy).toHaveBeenCalledTimes(1);
      expect(toConfirmationSpy).toHaveBeenCalledWith(row);
      expect(result).toBe(scheduleState);
    });

    it('returns null without mapping when the schedule does not exist', async () => {
      prisma.programacoes.findUnique.mockResolvedValue(null);

      const result = await repository.findById(SCHEDULE_ID);

      expect(result).toBeNull();
      expect(toConfirmationSpy).not.toHaveBeenCalled();
    });

    it('returns null when the schedule does not exist inside a transaction', async () => {
      tx.programacoes.findUnique.mockResolvedValue(null);

      const result = await repository.findById(
        SCHEDULE_ID,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(result).toBeNull();
      expect(toConfirmationSpy).not.toHaveBeenCalled();
    });

    it('propagates database errors without mapping', async () => {
      const error = new Error('connection lost');
      prisma.programacoes.findUnique.mockRejectedValue(error);

      await expect(repository.findById(SCHEDULE_ID)).rejects.toBe(error);
      expect(toConfirmationSpy).not.toHaveBeenCalled();
    });
  });
});
