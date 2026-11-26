import {
  D5NoteDetail,
  D5NoteFilter,
  D5NoteListItem,
  Pagination,
  UpdateD5NoteData,
} from 'src/domain/types';

export interface ID5NotesRepository {
  get(
    filters: D5NoteFilter,
    pagination?: Pagination,
  ): Promise<D5NoteListItem[]>;
  getTotals(
    where: Record<string, any>,
  ): Promise<{ total: number; totalMoRetida: number }>;
  getById(id: number): Promise<D5NoteDetail | null>;
  update(
    id: number,
    data: UpdateD5NoteData,
    modifyingUserId: number,
  ): Promise<void>;
}

export const D5_NOTES_REPOSITORY = Symbol('ID5NotesRepository');
