import {
  CapacityByYearMonth,
  ContingencyFilter,
  ContingencyGroupField,
  ContingencyGroupItem,
  ContingencyResourceDispatches,
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from '../types';

export const CONTINGENCY_REPOSITORY = Symbol('ContingencyRepository');

export type MonthPeriod = {
  start: string | null; // YYYY-MM-DD, inclusivo
  endExclusive: string | null; // YYYY-MM-DD, exclusivo
  startYear: number | null;
  endYear: number | null;
};

export interface IContingencyRepository {
  create(data: CreateContingencyData): Promise<void>;
  findRecent(filter: ContingencyFilter): Promise<RecentContingency[]>;
  findContingencyResourceDispatches(
    filter: ContingencyFilter,
  ): Promise<ContingencyResourceDispatches[]>;
  groupByField(
    field: ContingencyGroupField,
    filter: ContingencyFilter,
  ): Promise<ContingencyGroupItem[]>;
  groupByPartner(filter: ContingencyFilter): Promise<ContingencyGroupItem[]>;
  groupByCsd(filter: ContingencyFilter): Promise<ContingencyGroupItem[]>;
  getCapacityByYearMonth(
    filter: ContingencyFilter,
    month?: number,
  ): Promise<CapacityByYearMonth[]>;
  getEmergencyTeamsWithValue(
    filter: ContingencyFilter,
    month?: number,
  ): Promise<EmergencyTeam[]>;
}
