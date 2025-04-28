import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import { worksInPortfolioResponseRepository } from 'src/interface/types/getWorksInPortfolioInterface';

export interface IGetWorksInPortfolioRepository {
  getWorksInPortfolio(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseRepository>;
}

export const GET_WORKS_IN_PORTFOLIO_REPOSITORY = Symbol('GetWorksInPortfolio');
