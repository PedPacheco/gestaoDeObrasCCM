import { Inject, Injectable } from '@nestjs/common';
import { WorkSuspensionInput } from 'src/application/types';
import {
  filtersOrders,
  FIND_EXISITING_WORKS_REPOSITORY,
  IFindExistingWorksRepository,
} from 'src/domain/contracts/works/IFindExistingWorksRepository';
import { ExistingNoteResponse, ExistingWorkResponse } from 'src/domain/types';

@Injectable()
export class FindExistingWorksService {
  constructor(
    @Inject(FIND_EXISITING_WORKS_REPOSITORY)
    private readonly findExistingWorksRepository: IFindExistingWorksRepository,
  ) {}

  async findExistingWorks(works: string[]): Promise<ExistingWorkResponse[]> {
    return await this.findExistingWorksRepository.findExistingWorks(works);
  }

  async findExistingWorksOnSuspension(
    works: WorkSuspensionInput[],
  ): Promise<ExistingWorkResponse[]> {
    return await this.findExistingWorksRepository.findExistingWorksOnSuspension(
      works,
    );
  }

  async findExistingNotes(
    filters: { ovnota: string }[],
  ): Promise<ExistingNoteResponse[]> {
    return await this.findExistingWorksRepository.findExistingNotes(filters);
  }

  async findExistingOrders(orders: filtersOrders[]): Promise<string[]> {
    return await this.findExistingWorksRepository.findExistingOrders(orders);
  }
}
