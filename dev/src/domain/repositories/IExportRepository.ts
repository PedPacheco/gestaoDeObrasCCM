export interface IExportRepository {
  exportWorksInPortfolio(): Promise<any>;
  exportCompletedWorks(): Promise<any>;
  exportSchedules(): Promise<any>;
  exportFinedWorks(startDate: Date, endData: Date): Promise<any>;
  exportExecutionCapacity(): Promise<any>;
  exportSuspensions(): Promise<any>;
  exportSuspensionsRemoved(): Promise<any>;
}

export const EXPORT_REPOSITORY = Symbol('ExportRepository');
