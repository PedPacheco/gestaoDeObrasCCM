import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import {
  CreateD5ScheduleRejectionData,
  D5ScheduleDetail,
  D5ScheduleFilter,
  D5ScheduleRejection,
  D5ScheduleWithNote,
  NoteScheduledWork,
  Pagination,
} from 'src/domain/types';

export const D5_NOTES_SCHEDULES_REPOSITORY = Symbol(
  'ID5NotesSchedulesRepository',
);

export interface ID5NotesSchedulesRepository {
  get(
    filter: D5ScheduleFilter,
    pagination?: Pagination,
  ): Promise<D5ScheduleWithNote[]>;
  getTotals(filter: D5ScheduleFilter): Promise<NoteScheduledWork[]>;
  getById(id: number): Promise<D5NoteSchedule | null>;
  getByD5NoteId(noteId: number): Promise<D5ScheduleDetail[]>;
  findRejections(noteId: number): Promise<D5ScheduleRejection[]>;
  /** Cria a programação e muda a nota para o status 35. */
  create(schedule: D5NoteSchedule): Promise<void>;
  /** Atualiza, limpa a reprovação e sincroniza o status da nota (conclusão / reaberta). */
  updateAndSyncWorkStatus(
    id: number,
    schedule: D5NoteSchedule,
    isRejectedD5Note: boolean,
  ): Promise<void>;
  delete(id: number): Promise<void>;
  /** Guarda as reprovações, marca as programações como reprovadas e muda a nota para o status 1. */
  rejectMany(
    scheduleIds: number[],
    rejections: CreateD5ScheduleRejectionData[],
    noteId: number,
  ): Promise<void>;
}
