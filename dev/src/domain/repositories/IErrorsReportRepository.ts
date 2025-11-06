export interface IErrorsReportRepository {
  findUndefinedItems(idRegional: number): Promise<any>;
}

export const ERRORS_REPORT_REPOSITORY = Symbol('ErrorsReportRepository');
