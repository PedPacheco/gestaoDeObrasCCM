import {
  GET_COMPLETED_WORKS_REPOSITORY,
  IGetCompletedWorksRepository,
} from 'src/domain/contracts/works/IGetCompletedWorksRepository';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { WorkFiltersInput } from 'src/application/types';
import {
  CompletedWorksRepositoryResponse,
  CompletedWorkTotals,
} from 'src/domain/types';

@Injectable()
export class GetCompletedWorksService {
  constructor(
    @Inject(GET_COMPLETED_WORKS_REPOSITORY)
    private getCompletedWorksRepository: IGetCompletedWorksRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getCompletedWorks(filters: WorkFiltersInput) {
    const cacheKey = `completedWorks-${JSON.stringify(filters)}`;

    const responseData: CompletedWorksRepositoryResponse =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const { works, totals } =
      await this.getCompletedWorksRepository.getCompletedWorks(filters);

    const totalsFormatted: CompletedWorkTotals = {
      total_obras: Number(totals[0].total_obras),
      total_mo_planejada: totals[0].total_mo_planejada || 0,
      total_mo_exec: totals[0].total_mo_exec || 0,
      total_qtde_planejada: totals[0].total_qtde_planejada || 0,
      total_qtde_pend: totals[0].total_qtde_pend || 0,
    };

    const response: CompletedWorksRepositoryResponse = {
      works,
      totals: totalsFormatted,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
