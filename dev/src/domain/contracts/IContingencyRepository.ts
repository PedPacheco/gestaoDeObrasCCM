import {
  ContingencyInput,
  CountItem,
  GroupByFieldRow,
} from 'src/application/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import {
  CapacityByYearMonthResponse,
  ContingencyGroupField,
  EmergencyTeamResponse,
  RecentContingencyResponse,
} from '../types';

export const CONTINGENCY_REPOSITORY = 'CONTINGENCY_REPOSITORY';

export type MonthPeriod = {
  start: string | null; // YYYY-MM-DD, inclusivo
  endExclusive: string | null; // YYYY-MM-DD, exclusivo
  startYear: number | null;
  endYear: number | null;
};

export interface IContingencyRepository {
  create(data: Prisma.recursos_contingenciaUncheckedCreateInput): Promise<void>;
  findRecent(filter: ContingencyInput): Promise<RecentContingencyResponse[]>;
  groupByField(
    field: ContingencyGroupField,
    filter: ContingencyInput,
  ): Promise<GroupByFieldRow[]>;
  groupByPartner(filter: ContingencyInput): Promise<CountItem[]>;
  groupByCsd(filter: ContingencyInput): Promise<CountItem[]>;
  getCapacityByYearMonth(
    filter: ContingencyInput,
    month?: number,
  ): Promise<CapacityByYearMonthResponse[]>;
  getEmergencyTeamsWithValue(
    filter: ContingencyInput,
    month?: number,
  ): Promise<EmergencyTeamResponse[]>;
}
