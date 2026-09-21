import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';
import {
  D5NoteByIdQueryResult,
  FindD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';

export interface ProcessedEliminacaoFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  idRegional?: number[];
  idParceira?: number[];
  responsabilidade?: string;
}

export type D5NotePagination = {
  skip?: number;
  take?: number;
};

export interface ID5NotesRepository {
  get(
    filters: D5NotesFiltersDTO,
    pagination?: D5NotePagination,
  ): Promise<FindD5NotesQueryResult[]>;
  getById(id: number): Promise<D5NoteByIdQueryResult>;
}

export const D5_NOTES_REPOSITORY = Symbol('ID5NotesRepository');
