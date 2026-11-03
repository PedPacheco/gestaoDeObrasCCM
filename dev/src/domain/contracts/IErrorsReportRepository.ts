import {
  DivergentConclusionResponse,
  ExecutionDifferentialResponse,
  RepeatedWorksResponse,
  ScheduleErrorResponse,
  UndefinedItemsResponse,
  WorksWithoutYearPlanResponse,
  ZeroCapexResponse,
} from 'src/interface/types/errorsReportInterface';

export interface IErrorsReportRepository {
  findUndefinedItems(idRegional?: number): Promise<UndefinedItemsResponse[]>;
  findScheduleError(idRegional?: number): Promise<ScheduleErrorResponse[]>;
  findZeroCapex(idRegional?: number): Promise<ZeroCapexResponse[]>;
  findExecutionDifferential(
    idRegional?: number,
  ): Promise<ExecutionDifferentialResponse[]>;
  findDivergentConclusion(
    idRegional?: number,
  ): Promise<DivergentConclusionResponse[]>;
  findWorksWithoutYearPlan(
    idRegional?: number,
  ): Promise<WorksWithoutYearPlanResponse[]>;
  findRepeatedWorks(idRegional?: number): Promise<RepeatedWorksResponse[]>;
}

export const ERRORS_REPORT_REPOSITORY = Symbol('ErrorsReportRepository');
