import { Work } from 'src/domain/entities/works.entity';

export interface IInsertMarketWorksRepository {
  insert(works: Work[]): Promise<void>;
}

export const INSERT_MARKET_WORKS_REPOSITORY = Symbol(
  'InsertMarketWorksRepository',
);
