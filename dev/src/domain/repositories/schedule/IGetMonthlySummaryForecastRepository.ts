import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetMonthlySummaryForecastInterface,
  GetSecondMonthlySummaryForecastInterface,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

export interface IGetMonthlySummaryForecastRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastInterface[]>;
  getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetSecondMonthlySummaryForecastInterface[]>;
}

export const GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY = Symbol(
  'GetMonthlySummaryForecastRepository',
);
