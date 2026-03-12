import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import { GetMonthlySummaryForecastInterface } from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

export interface IGetMonthlySummaryForecastRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastInterface[]>;
}

export const GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY = Symbol(
  'GetMonthlySummaryForecastRepository',
);
