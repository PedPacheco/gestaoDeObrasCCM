import { NoteWorks, Work } from 'src/domain/entities/works.entity';

export interface Groups {
  id: number;
  id_grupo: number;
}

export interface IInsertWorksRepository {
  insertMarketWorks(works: Work[]): Promise<void>;
  insertNotes(data: NoteWorks[]): Promise<void>;
  getGroup(): Promise<Groups[]>;
}

export const INSERT_WORKS_REPOSITORY = Symbol('InsertWorksRepository');
