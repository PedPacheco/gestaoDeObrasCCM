import { NoteWorks } from 'src/domain/entities/works.entity';

export interface IUpdateNoteRepository {
  update(data: Partial<NoteWorks>[]): Promise<void>;
}

export const UPDATE_NOTE_REPOSITORY = Symbol('UpdateNoteRepository');
