import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { EntryDayResponse } from '../types';

export interface IEntryRepository {
  getValuesFromEntry(filters: GetEntryOfWorksDTO): Promise<EntryDayResponse[]>;
  getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayDTO,
    dateRange: Record<string, Date>,
  ): Promise<EntryDayResponse[]>;
}

export const ENTRY_REPOSITORY = Symbol('EntryRepository');
