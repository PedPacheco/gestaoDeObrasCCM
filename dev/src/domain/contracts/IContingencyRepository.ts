import {
  CapacityByYearMonth,
  ContingencyFilter,
  ContingencyGroupField,
  ContingencyGroupItem,
  CountItem,
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from '../types';

export const CONTINGENCY_REPOSITORY = 'CONTINGENCY_REPOSITORY';

export type MonthPeriod = {
  start: string | null; // YYYY-MM-DD, inclusivo
  endExclusive: string | null; // YYYY-MM-DD, exclusivo
  startYear: number | null;
  endYear: number | null;
};

export interface IContingencyRepository {
  create(data: CreateContingencyData): Promise<void>;
  findRecent(filter: ContingencyFilter): Promise<RecentContingency[]>;
  groupByField(
    field: ContingencyGroupField,
    filter: ContingencyFilter,
  ): Promise<ContingencyGroupItem[]>;
  groupByPartner(filter: ContingencyFilter): Promise<CountItem[]>;
  groupByCsd(filter: ContingencyFilter): Promise<CountItem[]>;
  getCapacityByYearMonth(
    filter: ContingencyFilter,
    month?: number,
  ): Promise<CapacityByYearMonth[]>;
  getEmergencyTeamsWithValue(
    filter: ContingencyFilter,
    month?: number,
  ): Promise<EmergencyTeam[]>;
}
