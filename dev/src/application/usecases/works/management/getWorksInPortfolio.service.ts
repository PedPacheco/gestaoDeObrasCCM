import {
  GET_WORKS_IN_PORTFOLIO_REPOSITORY,
  IGetWorksInPortfolioRepository,
} from 'src/domain/contracts/works/IGetWorksInPortfolioRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import {
  totalsWorksInPortfolio,
  worksInPortfolioResponseService,
} from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

@Injectable()
export class GetWorksInPortfolioService {
  constructor(
    @Inject(GET_WORKS_IN_PORTFOLIO_REPOSITORY)
    private readonly getWorksInPortfolioRepository: IGetWorksInPortfolioRepository,
    private readonly deadlineStatusService: DeadlineStatusService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getWorksInPortfolio(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseService> {
    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    const responseData: worksInPortfolioResponseService =
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

    const response: worksInPortfolioResponseService = {
      works: worksWithDeadlineStatus,
      totals: totalsFormatted,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }

  private buildTotals(totals: any): totalsWorksInPortfolio {
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
