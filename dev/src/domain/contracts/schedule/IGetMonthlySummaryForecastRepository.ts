import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetCapexPlanInterface,
  GetMonthlySummaryForecastInterface,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

export interface IGetMonthlySummaryForecastRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastInterface[]>;
  getCapexPlan(
    filters: GetMonthlySummaryDTO,
    yearPlan: number,
  ): Promise<GetCapexPlanInterface[]>;
}

export const GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY = Symbol(
  'GetMonthlySummaryForecastRepository',
);
