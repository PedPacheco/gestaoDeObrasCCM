import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import { GetMonthlySummaryInterface } from 'src/interface/types/schedule/monthlySummaryInterface';

export interface IGetMonthlySummaryRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryInterface[]>;
}

export const GET_MONTHLY_SUMMARY_REPOSITORY = Symbol(
  'GetMonthlySummaryRepository',
);
