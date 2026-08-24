import {
  GetContractValueResponse,
  GetPortfolioSummaryResponse,
} from 'src/domain/types';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import { GetMonthlySummaryInterface } from 'src/interface/types/schedule/monthlySummaryInterface';

export interface IGetMonthlySummaryRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryInterface[]>;
  getPortfolioSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetPortfolioSummaryResponse[]>;
  getContractValue(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetContractValueResponse[]>;
}

export const GET_MONTHLY_SUMMARY_REPOSITORY = Symbol(
  'GetMonthlySummaryRepository',
);
