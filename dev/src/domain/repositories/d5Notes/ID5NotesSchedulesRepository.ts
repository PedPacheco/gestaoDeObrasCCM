import {
  D5NoteScheduleCreateData,
  SchedulesD5NotesByIdQueryResult,
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
  getByD5NoteId(id: number): Promise<SchedulesD5NotesByIdQueryResult[]>;
  create(data: D5NoteScheduleCreateData): Promise<void>;
  update(id: number, data: any): Promise<void>;
  delete(id: number): Promise<void>;
}

export const D5_NOTES_SCHEDULES_REPOSITORY = Symbol(
  'ID5NotesSchedulesRepository',
);
