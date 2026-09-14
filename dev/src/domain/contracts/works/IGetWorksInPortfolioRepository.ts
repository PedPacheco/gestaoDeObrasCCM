import { WorkFiltersInput } from 'src/application/types';
import { WorkSummaryRepositoryResponse } from 'src/domain/types';

export interface IGetWorksInPortfolioRepository {
  getWorksInPortfolio(
    filters: WorkFiltersInput,
  ): Promise<WorkSummaryRepositoryResponse>;
}

export const GET_WORKS_IN_PORTFOLIO_REPOSITORY = Symbol('GetWorksInPortfolio');
