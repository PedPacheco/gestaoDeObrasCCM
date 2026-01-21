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

    const totalsFormatted: totalsWorksInPortfolio = {
      total_obras: Number(totals[0].total_obras),
      total_mo_planejada: totals[0].total_mo_planejada || 0,
      total_mo_exec: totals[0].total_mo_exec || 0,
      total_mo_suspensa: totals[0].total_mo_suspensa || 0,
      total_qtde_planejada: totals[0].total_qtde_planejada || 0,
      total_qtde_pend: totals[0].total_qtde_pend || 0,
    };

    const worksWithDeadlineStatus = works.map((work) => {
      const { prazo_fim, id_grupo } = work;

      let status_prazo: string;

      if (id_grupo === 1) {
        const prazoFim = moment(prazo_fim).utc();
        const daysRemaining = prazoFim.diff(moment(), 'days');

        if (daysRemaining < 0) {
          status_prazo = 'Prazo vencido';
        } else if (daysRemaining <= 16) {
          status_prazo = `Crítico: ${daysRemaining} dia(s) restante(s)`;
        } else if (daysRemaining <= 30 && daysRemaining >= 17) {
          status_prazo = `Atenção: ${daysRemaining} dias restantes`;
        } else {
          status_prazo = `No prazo: (${daysRemaining} dias restantes)`;
        }
      }

      return {
        ...work,
        status_prazo,
      };
    });

    const response: worksInPortfolioResponseService = {
      works: worksWithDeadlineStatus,
      totals: totalsFormatted,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
