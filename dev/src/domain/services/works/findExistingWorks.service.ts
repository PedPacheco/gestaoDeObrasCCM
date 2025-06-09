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

  async findExistingMarketWorks(marketEntry: string[]): Promise<string[]> {
    return await this.findExistingWorksRepository.findExistingMarketWorks(
      marketEntry,
    );
  }

  async findExistingNotes(notes: string[]) {
    return await this.findExistingWorksRepository.findExistingNotes(notes);
  }

  async findExistingOrders(orders: filtersOrders[]) {
    return await this.findExistingWorksRepository.findExistingOrders(orders);
  }
}
