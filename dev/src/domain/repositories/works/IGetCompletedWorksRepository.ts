import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import { worksInPortfolioResponseRepository } from 'src/interface/types/works/getWorksInPortfolioInterface';

export interface IGetCompletedWorksRepository {
  getCompletedWorks(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseRepository>;
}

export const GET_COMPLETED_WORKS_REPOSITORY = Symbol(
  'GetCompletedWorksRepository',
);
