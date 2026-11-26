import {
  GetCapexPlanResponse,
  GetMonthlySummaryForecastResponse,
} from 'src/domain/types';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

export interface IGetMonthlySummaryForecastRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastResponse[]>;
  getCapexPlan(
    filters: GetMonthlySummaryDTO,
    yearPlan: number,
  ): Promise<GetCapexPlanResponse[]>;
}

export const GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY = Symbol(
  'GetMonthlySummaryForecastRepository',
);
