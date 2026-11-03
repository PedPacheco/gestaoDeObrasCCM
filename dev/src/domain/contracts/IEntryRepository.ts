import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';
import {
  EntryDayResponse,
  entryResponse,
} from 'src/interface/types/entryInterface';

export interface IEntryRepository {
  getValuesFromEntry(filters: GetEntryOfWorksDTO): Promise<entryResponse[]>;
  getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayDTO,
    dateRange: Record<string, Date>,
  ): Promise<EntryDayResponse[]>;
}

export const ENTRY_REPOSITORY = Symbol('EntryRepository');
