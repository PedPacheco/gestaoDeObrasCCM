import * as moment from 'moment';
import {
  GET_WORKS_IN_PORTFOLIO_REPOSITORY,
  IGetWorksInPortfolioRepository,
} from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import {
  totalsWorksInPortfolio,
  worksInPortfolioResponseService,
} from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

enum DeadlineStatus {
  OVERDUE = 'Prazo vencido',
  CRITICAL = 'Crítico',
  ATTENTION = 'Atenção',
  ON_TIME = 'No prazo',
}

const DEADLINE_THRESHOLDS = {
  CRITICAL_DAYS: 16,
  ATTENTION_DAYS: 30,
  ATTENTION_MIN_DAYS: 17,
} as const;

@Injectable()
export class GetWorksInPortfolioService {
  constructor(
    @Inject(GET_WORKS_IN_PORTFOLIO_REPOSITORY)
    private readonly getWorksInPortfolioRepository: IGetWorksInPortfolioRepository,
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
        status_prazo: this.calculateDeadlineStatus(work),
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
      total_mo_suspensa: totals[0].total_mo_suspensa || 0,
      total_qtde_planejada: totals[0].total_qtde_planejada || 0,
      total_qtde_pend: totals[0].total_qtde_pend || 0,
    };
  }

  private calculateDeadlineStatus(work: any): string | undefined {
    if (work.id_grupo !== 1) {
      return undefined;
    }
    const deadlineMoment = moment(work.prazo_fim).utc();
    const daysRemaining = deadlineMoment.diff(moment(), 'days');

    if (daysRemaining < 0) {
      return DeadlineStatus.OVERDUE;
    }

    if (daysRemaining <= DEADLINE_THRESHOLDS.CRITICAL_DAYS) {
      return `${DeadlineStatus.CRITICAL}: ${daysRemaining} dia(s) restante(s)`;
    }

    if (
      daysRemaining >= DEADLINE_THRESHOLDS.ATTENTION_MIN_DAYS &&
      daysRemaining <= DEADLINE_THRESHOLDS.ATTENTION_DAYS
    ) {
      return `${DeadlineStatus.ATTENTION}: ${daysRemaining} dias restantes`;
    }

    return `${DeadlineStatus.ON_TIME}: (${daysRemaining} dias restantes)`;
  }
}
