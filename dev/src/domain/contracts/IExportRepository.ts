import {
  ExportCompletedWorksResponse,
  ExportExecutionCapacityResponse,
  ExportExecutionReportResponse,
  ExportFinedWorkResponse,
  ExportForecastResponse,
  ExportOrdersResponse,
  ExportRejectionsResponse,
  ExportSchedulesResponse,
  ExportSuspensionsRemovedResponse,
  ExportSuspensionsResponse,
  ExportWorksInPortfolioResponse,
} from '../types';

export interface IExportRepository {
  exportWorksInPortfolio(): Promise<ExportWorksInPortfolioResponse[]>;
  exportCompletedWorks(): Promise<ExportCompletedWorksResponse[]>;
  exportSchedules(): Promise<ExportSchedulesResponse[]>;
  exportFinedWorks(
    startDate: Date,
    endData: Date,
  ): Promise<ExportFinedWorkResponse[]>;
  exportExecutionCapacity(): Promise<ExportExecutionCapacityResponse[]>;
  exportSuspensions(): Promise<ExportSuspensionsResponse[]>;
  exportSuspensionsRemoved(): Promise<ExportSuspensionsRemovedResponse[]>;
  exportExecutionReport(): Promise<ExportExecutionReportResponse[]>;
  exportForecast(): Promise<ExportForecastResponse[]>;
  exportRejections(): Promise<ExportRejectionsResponse[]>;
  exportOrders(): Promise<ExportOrdersResponse[]>;
}

export const EXPORT_REPOSITORY = Symbol('ExportRepository');
