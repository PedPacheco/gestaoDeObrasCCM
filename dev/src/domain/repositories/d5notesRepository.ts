export interface ProcessedEliminacaoFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  idRegional?: number[];
  idParceira?: number[];
  responsabilidade?: string;
}

export interface ID5NotesRepository {
  get(filters: any): Promise<any>;
  getById(id: number): Promise<any>;
}

export const D5_NOTES_REPOSITORY = Symbol('ID5NotesRepository');
