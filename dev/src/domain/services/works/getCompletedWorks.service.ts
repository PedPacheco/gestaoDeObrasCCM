import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import { worksInPortfolioResponse } from 'src/interface/types/getWorksInPortfolioInterface';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCompletedWorksService {
  constructor(
    @Inject(GET_COMPLETED_WORKS_REPOSITORY)
    private getCompletedWorksRepository: GetCompletedWorksRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getCompletedWorks(filters: GetWorksDTO) {
    const cacheKey = `completedWorks-${JSON.stringify(filters)}`;

    const responseData: worksInPortfolioResponse =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const { works, result } =
      await this.getCompletedWorksRepository.getCompletedWorks(filters);

    const totals = {
      total_obras: Number(result[0].total_obras),
      total_mo_planejada: result[0].total_mo_planejada || 0,
      total_mo_exec: result[0].total_mo_exec || 0,
      total_mo_suspensa: result[0].total_mo_suspensa || 0,
      total_qtde_planejada: result[0].total_qtde_planejada || 0,
      total_qtde_pend: result[0].total_qtde_pend || 0,
    };

    const response: worksInPortfolioResponse = {
      works,
      totals,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
