import { Cache } from 'cache-manager';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { Goals } from 'src/interface/types/goalsInterface';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import {
  GOALS_REPOSITORY,
  IGoalsRepository,
} from '../repositories/IGoalsRepository';

@Injectable()
export class GoalsService {
  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(GOALS_REPOSITORY) private goalsRepository: IGoalsRepository,
  ) {}

  async getGoals(filters: GoalsDTO): Promise<Goals[]> {
    const result = await this.goalsRepository.getGoals(filters);
    return this.transformData(result);
  }

  private transformData(data: any): any[] {
    return data.map((item: any) => {
      const months = [
        'jan',
        'fev',
        'mar',
        'abr',
        'mai',
        'jun',
        'jul',
        'ago',
        'set',
        'out',
        'nov',
        'dez',
      ];

      const transformedItem = {
        id_tipo: item.id_tipo,
        tipo_obra: item.tipo_obra,
        turma: item.turma,
        regional: item.regional,
        anocalc: item.anocalc,
        carteira: item.carteira,
      };

      if (item.empreendimento !== undefined && item.empreendimento !== null) {
        transformedItem['empreendimento'] = item.empreendimento;
      }

      months.forEach((month) => {
        transformedItem[month] = {
          meta: item[`${month}fismeta`],
          prog: item[`${month}fisprog`],
          real: item[`${month}fisreal`],
        };
      });

      return transformedItem;
    });
  }
}
