import {
  ScheduleErrorResponse,
  UndefinedItemsResponse,
} from 'src/interface/types/errorsReportInterface';

export interface IErrorsReportRepository {
  findUndefinedItems(idRegional: number): Promise<UndefinedItemsResponse[]>;
  findScheduleError(idRegional: number): Promise<ScheduleErrorResponse[]>;
}

export const ERRORS_REPORT_REPOSITORY = Symbol('ErrorsReportRepository');
