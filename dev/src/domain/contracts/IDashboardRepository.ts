import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';

export interface IDashboardRepository {
  countTotalWorks(filters: DashboardFiltersDTO): Promise<any>;
  countConcludedThisMonth(filters: DashboardFiltersDTO): Promise<any>;
  countWithoutSchedule(filters: DashboardFiltersDTO): Promise<any>;
  countTotalConcluded(filters: DashboardFiltersDTO): Promise<any>;
  countPortfolio(filters: DashboardFiltersDTO): Promise<any>;
  countExecutedValue(filters: DashboardFiltersDTO): Promise<any>;
  findWorksByStatus(filters: DashboardFiltersDTO): Promise<any>;
  findWorksByRegional(filters: DashboardFiltersDTO): Promise<any>;
  findMonthlyTrend(filters: DashboardFiltersDTO): Promise<any>;
  findTopPartners(filters: DashboardFiltersDTO): Promise<any>;
  findRecentWorks(filters: DashboardFiltersDTO): Promise<any>;
  findPartnerStatus(filters: DashboardFiltersDTO): Promise<any>;
}

export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');
