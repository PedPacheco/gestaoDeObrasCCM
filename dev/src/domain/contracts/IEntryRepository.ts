import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { EntryDayResponse, ValuesFromEntryResponse } from '../types';

export interface IEntryRepository {
  getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayDTO,
    dateRange: Record<string, Date>,
  ): Promise<EntryDayResponse[]>;
  getValuesFromEntry(
    filters: GetEntryOfWorksDTO,
  ): Promise<ValuesFromEntryResponse[]>;
}

export const ENTRY_REPOSITORY = Symbol('EntryRepository');
