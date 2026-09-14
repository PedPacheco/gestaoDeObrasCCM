import {
  GetWorksInPortfolioOutput,
  GetWorksInPortfolioTotals,
  WorkFiltersInput,
} from 'src/application/types';
import {
  GET_WORKS_IN_PORTFOLIO_REPOSITORY,
  IGetWorksInPortfolioRepository,
} from 'src/domain/contracts/works/IGetWorksInPortfolioRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { WorkTotals } from 'src/domain/types';

@Injectable()
export class GetWorksInPortfolioService {
  constructor(
    @Inject(GET_WORKS_IN_PORTFOLIO_REPOSITORY)
    private readonly getWorksInPortfolioRepository: IGetWorksInPortfolioRepository,
    private readonly deadlineStatusService: DeadlineStatusService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getWorksInPortfolio(
    filters: WorkFiltersInput,
  ): Promise<GetWorksInPortfolioOutput> {
    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    const responseData: GetWorksInPortfolioOutput =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const { works, totals } =
      await this.getWorksInPortfolioRepository.getWorksInPortfolio(filters);

    const totalsFormatted = this.buildTotals(totals);

    const worksWithDeadlineStatus = works.map((work) => {
      return {
        ...work,
        status_prazo: this.deadlineStatusService.calculate(work),
      };
    });

    const response: GetWorksInPortfolioOutput = {
      works: worksWithDeadlineStatus,
      totals: totalsFormatted,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }

  private buildTotals(totals: WorkTotals): GetWorksInPortfolioTotals {
    return {
      total_obras: Number(totals[0].total_obras),
      total_mo_planejada: totals[0].total_mo_planejada || 0,
      total_mo_exec: totals[0].total_mo_exec || 0,
      total_mo_pend: totals[0].total_mo_planejada - totals[0].total_mo_exec,
      total_qtde_planejada: totals[0].total_qtde_planejada || 0,
      total_qtde_pend: totals[0].total_qtde_pend || 0,
    };
  }
}
