import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetMonthlySummaryInterface,
  GetSecondMonthlySummaryInterface,
} from 'src/interface/types/schedule/getMonthlySummaryInterface';

export interface IGetMonthlySummaryRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryInterface[]>;
  getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetSecondMonthlySummaryInterface[]>;
}

export const GET_MONTHLY_SUMMARY_REPOSITORY = Symbol(
  'GetMonthlySummaryRepository',
);
