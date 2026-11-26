import { Injectable } from '@nestjs/common';
import type { ID5NotesSchedulesRepository } from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
// ajuste o caminho
import type {
  CreateD5ScheduleRejectionData,
  D5ScheduleDetail,
  D5ScheduleFilter,
  D5ScheduleRejection,
  D5ScheduleWithNote,
  NoteScheduledWork,
  Pagination,
} from 'src/domain/types';
import {
  toD5NoteSchedule,
  toD5ScheduleCreateInput,
  toD5ScheduleDetail,
  toD5ScheduleRejection,
  toD5ScheduleRejectionCreateInput,
  toD5ScheduleUpdateInput,
  toD5ScheduleWhere,
  toD5ScheduleWithNote,
  toNoteScheduledWork,
} from 'src/infra/mappers/d5Notes/d5NotesSchedules.mapper';

import { PrismaService } from 'src/infra/prisma/prisma.service'; // ajuste o caminho
import {
  D5_SCHEDULE_BY_ID_SELECT,
  D5_SCHEDULE_BY_NOTE_SELECT,
  D5_SCHEDULE_REJECTION_SELECT,
  D5_SCHEDULE_WITH_NOTE_SELECT,
} from 'src/infra/types';

// 6d: status passam a constantes nomeadas e as regras saem do repositório
const NOTE_STATUS_SCHEDULED = 35;
const NOTE_STATUS_COMPLETED = 2;
const NOTE_STATUS_REJECTED = 1;
const COMPLETED_EXEC_PERCENT = 100;

@Injectable()
export class D5NotesSchedulesRepository implements ID5NotesSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Leitura ────────────────────────────────────────────────────────

  async get(
    filter: D5ScheduleFilter,
    pagination?: Pagination,
  ): Promise<D5ScheduleWithNote[]> {
    console.dir(toD5ScheduleWhere(filter), { depth: null });
    const rows = await this.prisma.programacoes_d5.findMany({
      where: toD5ScheduleWhere(filter),
      orderBy: [{ data_prog: 'asc' }, { id: 'asc' }],
      take: pagination?.take,
      skip: pagination?.skip,
      select: D5_SCHEDULE_WITH_NOTE_SELECT,
    });
    return rows.map(toD5ScheduleWithNote);
  }

  async getTotals(filter: D5ScheduleFilter): Promise<NoteScheduledWork[]> {
    const where = toD5ScheduleWhere(filter);
    const notes = await this.prisma.notas_d5.findMany({
      where: { programacoes_d5: { some: where } },
      select: {
        id: true,
        mo_planejada: true,
        programacoes_d5: { where, select: { prog: true } },
      },
    });
    return notes.map(toNoteScheduledWork);
  }

  async getById(id: number): Promise<D5NoteSchedule | null> {
    const row = await this.prisma.programacoes_d5.findUnique({
      where: { id },
      select: D5_SCHEDULE_BY_ID_SELECT,
    });
    return row && toD5NoteSchedule(row);
  }

  async getByD5NoteId(noteId: number): Promise<D5ScheduleDetail[]> {
    const rows = await this.prisma.programacoes_d5.findMany({
      where: { id_nota_d5: noteId },
      select: D5_SCHEDULE_BY_NOTE_SELECT,
    });
    return rows.map(toD5ScheduleDetail);
  }

  async findRejections(noteId: number): Promise<D5ScheduleRejection[]> {
    const rows = await this.prisma.programacoes_d5_reprovacoes.findMany({
      where: { id_nota_d5: noteId },
      select: D5_SCHEDULE_REJECTION_SELECT,
    });
    return rows.map(toD5ScheduleRejection);
  }

  // ─── Escrita ────────────────────────────────────────────────────────

  async create(schedule: D5NoteSchedule): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notas_d5.update({
        where: { id: schedule.d5NoteId },
        data: { id_status: NOTE_STATUS_SCHEDULED },
      });
      await tx.programacoes_d5.create({
        data: toD5ScheduleCreateInput(schedule),
      });
    });
  }

  async updateAndSyncWorkStatus(
    id: number,
    schedule: D5NoteSchedule,
    isRejectedD5Note: boolean,
  ): Promise<void> {
    const noteId = schedule.d5NoteId;

    await this.prisma.$transaction(async (tx) => {
      await tx.programacoes_d5.update({
        where: { id },
        data: { reprovada: false, ...toD5ScheduleUpdateInput(schedule) },
      });

      // recalcula já com o valor gravado
      const result = await tx.programacoes_d5.aggregate({
        where: { id_nota_d5: noteId },
        _sum: { exec: true },
      });
      const totalExec = Number(result._sum.exec ?? 0);

      if (totalExec >= COMPLETED_EXEC_PERCENT) {
        await tx.notas_d5.update({
          where: { id: noteId },
          data: {
            id_status: NOTE_STATUS_COMPLETED,
            conclusao_nota: schedule.dataProg,
          },
        });
      }

      if (isRejectedD5Note) {
        await tx.notas_d5.update({
          where: { id: noteId },
          data: { id_status: NOTE_STATUS_SCHEDULED },
        });
      }
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.programacoes_d5.delete({ where: { id } });
  }

  async rejectMany(
    scheduleIds: number[],
    rejections: CreateD5ScheduleRejectionData[],
    noteId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.programacoes_d5_reprovacoes.createMany({
        data: rejections.map(toD5ScheduleRejectionCreateInput),
      });
      await tx.programacoes_d5.updateMany({
        where: { id: { in: scheduleIds } },
        data: { reprovada: true },
      });
      await tx.notas_d5.update({
        where: { id: noteId },
        data: { id_status: NOTE_STATUS_REJECTED },
      });
    });
  }
}
