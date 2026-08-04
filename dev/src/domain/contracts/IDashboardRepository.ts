import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';
import {
  findMonthlyTrendResponse,
  FindPartnerStatus,
  FindRecentWorks,
  FindTopPartners,
  FindWorksByRegional,
  FindWorksByStatus,
} from '../types';

export interface IDashboardRepository {
  countTotalWorks(filters: DashboardFiltersDTO): Promise<number>;
  countConcludedThisMonth(filters: DashboardFiltersDTO): Promise<number>;
  countWithoutSchedule(filters: DashboardFiltersDTO): Promise<number>;
  countTotalConcluded(filters: DashboardFiltersDTO): Promise<number>;
  countPortfolio(filters: DashboardFiltersDTO): Promise<number>;
  countExecutedValue(filters: DashboardFiltersDTO): Promise<number>;
  findWorksByStatus(filters: DashboardFiltersDTO): Promise<FindWorksByStatus[]>;
  findWorksByRegional(
    filters: DashboardFiltersDTO,
  ): Promise<FindWorksByRegional[]>;
  findMonthlyTrend(
    filters: DashboardFiltersDTO,
  ): Promise<findMonthlyTrendResponse[]>;
  findTopPartners(filters: DashboardFiltersDTO): Promise<FindTopPartners[]>;
  findRecentWorks(filters: DashboardFiltersDTO): Promise<FindRecentWorks[]>;
  findPartnerStatus(filters: DashboardFiltersDTO): Promise<FindPartnerStatus[]>;
}

export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');
