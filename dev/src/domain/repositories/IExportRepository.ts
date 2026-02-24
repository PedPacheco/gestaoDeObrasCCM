export interface IExportRepository {
  exportWorksInPortfolio(): Promise<any>;
  exportCompletedWorks(): Promise<any>;
  exportSchedules(): Promise<any>;
  exportFinedWorks(startDate: Date, endData: Date): Promise<any>;
  exportExecutionCapacity(): Promise<any>;
  exportSuspensions(): Promise<any>;
  exportSuspensionsRemoved(): Promise<any>;
  exportExecutionReport(): Promise<any>;
  exportForecast(): Promise<any>;
  exportRejections(): Promise<any>;
}

export const EXPORT_REPOSITORY = Symbol('ExportRepository');
