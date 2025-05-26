import { Work } from 'src/domain/entities/works.entity';
import { IInsertMarketWorksRepository } from 'src/domain/repositories/works/IInsertMarketWorksRepository';

export class InsertMarketWorksRepository
  implements IInsertMarketWorksRepository
{
  constructor() {}

  async insert(works: Work[]): Promise<void> {
    console.log(works);
  }
}
