import { EntryDayResponse, ValuesFromEntryResponse } from '../types';
import {
  GetEntryOfWorksByDayInput,
  GetEntryOfWorksInput,
} from 'src/application/types';

export interface IEntryRepository {
  getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayInput,
    dateRange: Record<string, Date>,
  ): Promise<EntryDayResponse[]>;
  getValuesFromEntry(
    filters: GetEntryOfWorksInput,
  ): Promise<ValuesFromEntryResponse[]>;
}

export const ENTRY_REPOSITORY = Symbol('EntryRepository');
