import {
  D5NoteScheduleCreateData,
  D5NoteScheduleUpdateData,
  D5ScheduleRejectionData,
  SchedulesD5NotesByIdQueryResult,
  SchedulesD5NotesByNoteIdQueryResult,
  SchedulesD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';
import { D5NotePagination } from './ID5notesRepository';

// domain/repositories/ID5ProgramacoesRepository.ts
export const D5_PROGRAMACOES_REPOSITORY = Symbol('D5_PROGRAMACOES_REPOSITORY');

export interface ID5NotesSchedulesRepository {
  get(
    where: any,
    pagination?: D5NotePagination,
  ): Promise<SchedulesD5NotesQueryResult[]>;
  getById(id: number): Promise<SchedulesD5NotesByIdQueryResult | null>;
  getTotals(where: Record<string, any>): Promise<{ total: number }>;
  getByD5NoteId(id: number): Promise<SchedulesD5NotesByNoteIdQueryResult[]>;
  create(id: number, data: D5NoteScheduleCreateData): Promise<void>;
  updateAndSyncWorkStatus(
    id: number,
    data: D5NoteScheduleUpdateData,
    d5NoteId: number,
  ): Promise<void>;
  delete(id: number): Promise<void>;
  rejectMany(ids: number[], data: D5ScheduleRejectionData[]): Promise<void>;
}

export const D5_NOTES_SCHEDULES_REPOSITORY = Symbol(
  'ID5NotesSchedulesRepository',
);
