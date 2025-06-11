import { Inject, Injectable } from '@nestjs/common';
import {
  filtersOrders,
  FIND_EXISITING_WORKS_REPOSITORY,
  IFindExistingWorksRepository,
} from 'src/domain/repositories/works/IFindExistingWorksRepository';

@Injectable()
export class FindExistingWorksService {
  constructor(
    @Inject(FIND_EXISITING_WORKS_REPOSITORY)
    private readonly findExistingWorksRepository: IFindExistingWorksRepository,
  ) {}

  async findExistingWorks(works: string[]): Promise<string[]> {
    return await this.findExistingWorksRepository.findExistingWorks(works);
  }

  async findExistingOrders(orders: filtersOrders[]) {
    return await this.findExistingWorksRepository.findExistingOrders(orders);
  }
}
