import {
  GetPortfolioSummaryResponse,
  GetMonthlySummaryResponse,
  GetContractValueResponse,
} from 'src/domain/types';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

export interface IGetMonthlySummaryRepository {
  getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryResponse[]>;
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
