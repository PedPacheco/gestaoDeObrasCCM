import {
  GOALS_REPOSITORY,
  IGoalsRepository,
} from 'src/domain/repositories/IGoalsRepository';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { Goals } from 'src/interface/types/goalsInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GoalsService {
  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(GOALS_REPOSITORY) private goalsRepository: IGoalsRepository,
  ) {}

  async getGoals(filters: GoalsDTO): Promise<Goals[]> {
    const result = await this.goalsRepository.getGoals(filters);
    const response = this.transformData(result, filters.btzero);
    return response;
  }

  private transformData(data: any[], btzero: boolean): any[] {
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

    const grouped: Record<string, any> = {};

    for (const item of data) {
      const { id_parceira, id_regional } = item;
      const id_tipo = btzero ? 48 : item.id_tipo;
      const tipo_obra = btzero ? 'BT ZERO' : item.tipo_obra;

      // carteira NÃO faz parte da chave porque deve ser somada
      const key = `${id_tipo}-${tipo_obra}-${item.turma}-${item.regional}-${item.anocalc}-${item.empreendimento}`;

      if (!grouped[key]) {
        grouped[key] = {
          id_tipo,
          id_parceira,
          id_regional,
          tipo_obra,
          turma: item.turma,
          regional: item.regional,
          anocalc: item.anocalc,

          // inicializa carteira com zero para somar depois
          carteira: 0,

          empreendimento: item.empreendimento ?? undefined,
        };

        // meses zerados
        months.forEach((month) => {
          grouped[key][month] = {
            meta: 0,
            prog: 0,
            real: 0,
          };
        });
      }

      // soma carteira
      grouped[key].carteira += item.carteira ?? 0;

      // soma valores dos meses
      months.forEach((month) => {
        grouped[key][month].meta += item[`${month}fismeta`] ?? 0;
        grouped[key][month].prog += item[`${month}fisprog`] ?? 0;
        grouped[key][month].real += item[`${month}fisreal`] ?? 0;
      });
    }

    return Object.values(grouped);
  }
}
