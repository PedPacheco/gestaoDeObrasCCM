import { Inject, Injectable } from '@nestjs/common';
import {
  filtersOrders,
  FIND_EXISITING_WORKS_REPOSITORY,
  IFindExistingWorksRepository,
} from 'src/domain/contracts/works/IFindExistingWorksRepository';

@Injectable()
export class FindExistingWorksService {
  constructor(
    @Inject(FIND_EXISITING_WORKS_REPOSITORY)
    private readonly findExistingWorksRepository: IFindExistingWorksRepository,
  ) {}

  async findExistingWorks(
    works: string[],
  ): Promise<{ id: number; ovnota: string }[]> {
    return await this.findExistingWorksRepository.findExistingWorks(works);
  }

  async findExistingNotes(filters: any[]): Promise<
    {
      id: number;
      ovnota: string;
      ordemDci: string;
      ordemDcd: string;
      ordemDca: string;
      ordemDcim: string;
    }[]
  > {
    return await this.findExistingWorksRepository.findExistingNotes(filters);
  }

  async findExistingOrders(orders: filtersOrders[]) {
    return await this.findExistingWorksRepository.findExistingOrders(orders);
  }
}
