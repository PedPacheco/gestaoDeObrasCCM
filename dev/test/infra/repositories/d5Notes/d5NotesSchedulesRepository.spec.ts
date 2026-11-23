import type { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import type {
  CreateD5ScheduleRejectionData,
  D5ScheduleFilter,
} from 'src/domain/types';
import {
  toD5NoteSchedule,
  toD5ScheduleCreateInput,
  toD5ScheduleDetail,
  toD5ScheduleRejection,
  toD5ScheduleRejectionCreateInput,
  toD5ScheduleUpdateInput,
  toD5ScheduleWhere,
  toNoteScheduledWork,
} from 'src/infra/mappers/d5Notes/d5NotesSchedules.mapper';

import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { D5NotesSchedulesRepository } from 'src/infra/repositories/d5Notes/d5NotesSchedulesRepository';
import {
  D5_SCHEDULE_BY_ID_SELECT,
  D5_SCHEDULE_BY_NOTE_SELECT,
  D5_SCHEDULE_REJECTION_SELECT,
  D5_SCHEDULE_WITH_NOTE_SELECT,
} from 'src/infra/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/infra/mappers/d5Notes/d5NotesSchedules.mapper', () => ({
  toD5NoteSchedule: vi.fn((r) => ({ entity: r.id })),
  toD5ScheduleCreateInput: vi.fn(() => ({ create: true })),
  toD5ScheduleUpdateInput: vi.fn(() => ({ prog: 80 })),
  toD5ScheduleDetail: vi.fn((r) => ({ detail: r.id })),
  toD5ScheduleRejection: vi.fn((r) => ({ rejection: r.id })),
  toD5ScheduleRejectionCreateInput: vi.fn((d) => ({ row: d.description })),
  toD5ScheduleWhere: vi.fn(() => ({ AND: [{ reprovada: false }] })),
  toD5ScheduleWithNote: vi.fn((r) => ({ withNote: r.id })),
  toNoteScheduledWork: vi.fn((r) => ({ noteId: r.id })),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const WHERE = { AND: [{ reprovada: false }] };
const FILTER = { noteIds: [10] } as D5ScheduleFilter;
const SCHEDULE_DATE = new Date('2026-11-18T00:00:00Z');

const makeSchedule = (): D5NoteSchedule =>
  ({ d5NoteId: 10, dataProg: SCHEDULE_DATE }) as unknown as D5NoteSchedule;

const makeClient = () => ({
  programacoes_d5: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    updateMany: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    aggregate: vi.fn(),
  },
  programacoes_d5_reprovacoes: {
    findMany: vi.fn(),
    createMany: vi.fn().mockResolvedValue(undefined),
  },
  notas_d5: {
    findMany: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
  },
});

type Client = ReturnType<typeof makeClient>;

// ─── Suite ────────────────────────────────────────────────────────────

describe('D5NotesSchedulesRepository', () => {
  let prisma: Client & { $transaction: ReturnType<typeof vi.fn> };
  let tx: Client;
  let repository: D5NotesSchedulesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    tx = makeClient();
    prisma = {
      ...makeClient(),
      // executa o callback com um cliente de transação próprio
      $transaction: vi.fn(async (fn: (client: Client) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    repository = new D5NotesSchedulesRepository(
      prisma as unknown as PrismaService,
    );
  });

  // ═══ get ════════════════════════════════════════════════════════════

  describe('get', () => {
    it('queries the schedules with the domain filter and maps each row', async () => {
      prisma.programacoes_d5.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await repository.get(FILTER, { skip: 200, take: 200 });

      expect(toD5ScheduleWhere).toHaveBeenCalledWith(FILTER);
      expect(prisma.programacoes_d5.findMany).toHaveBeenCalledWith({
        where: WHERE,
        orderBy: [{ data_prog: 'asc' }, { id: 'asc' }],
        take: 200,
        skip: 200,
        select: D5_SCHEDULE_WITH_NOTE_SELECT,
      });
      expect(result).toEqual([{ withNote: 1 }, { withNote: 2 }]);
    });

    it('does not paginate when no pagination is given', async () => {
      prisma.programacoes_d5.findMany.mockResolvedValue([]);

      const result = await repository.get(FILTER);

      expect(prisma.programacoes_d5.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: undefined, skip: undefined }),
      );
      expect(result).toEqual([]);
    });
  });

  // ═══ getTotals ══════════════════════════════════════════════════════

  describe('getTotals', () => {
    it('loads the notes with matching schedules and applies the same filter to the schedules', async () => {
      prisma.notas_d5.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      const result = await repository.getTotals(FILTER);

      expect(toD5ScheduleWhere).toHaveBeenCalledTimes(1);
      expect(prisma.notas_d5.findMany).toHaveBeenCalledWith({
        where: { programacoes_d5: { some: WHERE } },
        select: {
          id: true,
          mo_planejada: true,
          programacoes_d5: { where: WHERE, select: { prog: true } },
        },
      });
      expect(toNoteScheduledWork).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ noteId: 10 }, { noteId: 11 }]);
    });
  });

  // ═══ getById ════════════════════════════════════════════════════════

  describe('getById', () => {
    it('loads the schedule and maps it to the entity', async () => {
      prisma.programacoes_d5.findUnique.mockResolvedValue({ id: 5 });

      const result = await repository.getById(5);

      expect(prisma.programacoes_d5.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: D5_SCHEDULE_BY_ID_SELECT,
      });
      expect(result).toEqual({ entity: 5 });
    });

    it('returns null without building the entity when the schedule does not exist', async () => {
      prisma.programacoes_d5.findUnique.mockResolvedValue(null);

      expect(await repository.getById(5)).toBeNull();
      expect(toD5NoteSchedule).not.toHaveBeenCalled();
    });
  });

  // ═══ getByD5NoteId ══════════════════════════════════════════════════

  describe('getByD5NoteId', () => {
    it('loads the schedules of the note and maps them', async () => {
      prisma.programacoes_d5.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await repository.getByD5NoteId(10);

      expect(prisma.programacoes_d5.findMany).toHaveBeenCalledWith({
        where: { id_nota_d5: 10 },
        select: D5_SCHEDULE_BY_NOTE_SELECT,
      });
      expect(toD5ScheduleDetail).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ detail: 1 }]);
    });
  });

  // ═══ findRejections ═════════════════════════════════════════════════

  describe('findRejections', () => {
    it('loads the rejections of the note and maps them', async () => {
      prisma.programacoes_d5_reprovacoes.findMany.mockResolvedValue([
        { id: 3 },
      ]);

      const result = await repository.findRejections(10);

      expect(prisma.programacoes_d5_reprovacoes.findMany).toHaveBeenCalledWith({
        where: { id_nota_d5: 10 },
        select: D5_SCHEDULE_REJECTION_SELECT,
      });
      expect(toD5ScheduleRejection).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ rejection: 3 }]);
    });
  });

  // ═══ create ═════════════════════════════════════════════════════════

  describe('create', () => {
    it('sets the note as scheduled and creates the schedule inside one transaction', async () => {
      const schedule = makeSchedule();

      await repository.create(schedule);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.notas_d5.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { id_status: 35 },
      });
      expect(toD5ScheduleCreateInput).toHaveBeenCalledWith(schedule);
      expect(tx.programacoes_d5.create).toHaveBeenCalledWith({
        data: { create: true },
      });
      expect(prisma.programacoes_d5.create).not.toHaveBeenCalled();
    });

    it('propagates errors raised inside the transaction', async () => {
      const error = new Error('unique violation');
      tx.programacoes_d5.create.mockRejectedValue(error);

      await expect(repository.create(makeSchedule())).rejects.toBe(error);
    });
  });

  // ═══ updateAndSyncWorkStatus ════════════════════════════════════════

  describe('updateAndSyncWorkStatus', () => {
    it('updates the schedule clearing the rejection flag', async () => {
      const schedule = makeSchedule();
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 40 } });

      await repository.updateAndSyncWorkStatus(5, schedule, false);

      expect(toD5ScheduleUpdateInput).toHaveBeenCalledWith(schedule);
      expect(tx.programacoes_d5.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { reprovada: false, prog: 80 },
      });
    });

    it('lets the mapped columns override the rejection flag (spread comes last)', async () => {
      vi.mocked(toD5ScheduleUpdateInput).mockReturnValueOnce({
        reprovada: true,
      } as never);
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 0 } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), false);

      expect(tx.programacoes_d5.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { reprovada: true },
      });
    });

    it('recalculates the executed total of the note after updating the schedule', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 40 } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), false);

      expect(tx.programacoes_d5.aggregate).toHaveBeenCalledWith({
        where: { id_nota_d5: 10 },
        _sum: { exec: true },
      });
      expect(
        tx.programacoes_d5.update.mock.invocationCallOrder[0],
      ).toBeLessThan(tx.programacoes_d5.aggregate.mock.invocationCallOrder[0]);
      expect(tx.notas_d5.update).not.toHaveBeenCalled();
    });

    it.each([100, 130])(
      'completes the note using the schedule date when the executed total is %i',
      async (total) => {
        tx.programacoes_d5.aggregate.mockResolvedValue({
          _sum: { exec: total },
        });

        await repository.updateAndSyncWorkStatus(5, makeSchedule(), false);

        expect(tx.notas_d5.update).toHaveBeenCalledTimes(1);
        expect(tx.notas_d5.update).toHaveBeenCalledWith({
          where: { id: 10 },
          data: { id_status: 2, conclusao_nota: SCHEDULE_DATE },
        });
      },
    );

    it('treats a null executed sum as zero', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: null } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), false);

      expect(tx.notas_d5.update).not.toHaveBeenCalled();
    });

    it('converts a decimal executed sum to a number', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({
        _sum: { exec: { toString: () => '100' } },
      });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), false);

      expect(tx.notas_d5.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id_status: 2 }),
        }),
      );
    });

    it('reopens a rejected note as scheduled', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 40 } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), true);

      expect(tx.notas_d5.update).toHaveBeenCalledTimes(1);
      expect(tx.notas_d5.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { id_status: 35 },
      });
    });

    it('overrides the completed status when a rejected note reaches 100% (current behaviour)', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 100 } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), true);

      expect(tx.notas_d5.update).toHaveBeenCalledTimes(2);
      expect(tx.notas_d5.update).toHaveBeenNthCalledWith(1, {
        where: { id: 10 },
        data: { id_status: 2, conclusao_nota: SCHEDULE_DATE },
      });
      expect(tx.notas_d5.update).toHaveBeenNthCalledWith(2, {
        where: { id: 10 },
        data: { id_status: 35 },
      });
    });

    it('runs every write inside the transaction client', async () => {
      tx.programacoes_d5.aggregate.mockResolvedValue({ _sum: { exec: 100 } });

      await repository.updateAndSyncWorkStatus(5, makeSchedule(), true);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.programacoes_d5.update).not.toHaveBeenCalled();
      expect(prisma.notas_d5.update).not.toHaveBeenCalled();
    });
  });

  // ═══ delete ═════════════════════════════════════════════════════════

  describe('delete', () => {
    it('deletes the schedule by id', async () => {
      await repository.delete(5);

      expect(prisma.programacoes_d5.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it('propagates database errors', async () => {
      const error = new Error('record not found');
      prisma.programacoes_d5.delete.mockRejectedValue(error);

      await expect(repository.delete(5)).rejects.toBe(error);
    });
  });

  // ═══ rejectMany ═════════════════════════════════════════════════════

  describe('rejectMany', () => {
    const rejections = [
      { description: 'r1' },
      { description: 'r2' },
    ] as CreateD5ScheduleRejectionData[];

    it('stores the rejections, flags the schedules and sets the note as rejected in one transaction', async () => {
      await repository.rejectMany([1, 2], rejections, 10);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(toD5ScheduleRejectionCreateInput).toHaveBeenCalledTimes(2);
      expect(tx.programacoes_d5_reprovacoes.createMany).toHaveBeenCalledWith({
        data: [{ row: 'r1' }, { row: 'r2' }],
      });
      expect(tx.programacoes_d5.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { reprovada: true },
      });
      expect(tx.notas_d5.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { id_status: 1 },
      });
    });

    it('stores the rejections before flagging the schedules', async () => {
      await repository.rejectMany([1], [rejections[0]], 10);

      expect(
        tx.programacoes_d5_reprovacoes.createMany.mock.invocationCallOrder[0],
      ).toBeLessThan(tx.programacoes_d5.updateMany.mock.invocationCallOrder[0]);
    });

    it('propagates errors raised inside the transaction', async () => {
      const error = new Error('fk violation');
      tx.programacoes_d5.updateMany.mockRejectedValue(error);

      await expect(
        repository.rejectMany([1], [rejections[0]], 10),
      ).rejects.toBe(error);
    });
  });
});
