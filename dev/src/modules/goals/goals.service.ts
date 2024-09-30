import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { GoalsDTO } from 'src/config/dto/goalsDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { Goals } from 'src/types/goalsInterface';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getGoals(filters: GoalsDTO): Promise<Goals[]> {
    const { parceira, regional, tipo, ano } = filters;

    let query = Prisma.sql`SELECT
      id_tipo,
      tipo_obra,
      turma,
      regional,
      anocalc,
      SUM(janfismeta) AS janfismeta,
      SUM(fevfismeta) AS fevfismeta,
      SUM(marfismeta) AS marfismeta,
      SUM(abrfismeta) AS abrfismeta,
      SUM(maifismeta) AS maifismeta,
      SUM(junfismeta) AS junfismeta,
      SUM(julfismeta) AS julfismeta,
      SUM(agofismeta) AS agofismeta,
      SUM(setfismeta) AS setfismeta,
      SUM(outfismeta) AS outfismeta,
      SUM(novfismeta) AS novfismeta,
      SUM(dezfismeta) AS dezfismeta,
      SUM(janfisprog) AS janfisprog,
      SUM(fevfisprog) AS fevfisprog,
      SUM(marfisprog) AS marfisprog,
      SUM(abrfisprog) AS abrfisprog,
      SUM(maifisprog) AS maifisprog,
      SUM(junfisprog) AS junfisprog,
      SUM(julfisprog) AS julfisprog,
      SUM(agofisprog) AS agofisprog,
      SUM(setfisprog) AS setfisprog,
      SUM(outfisprog) AS outfisprog,
      SUM(novfisprog) AS novfisprog,
      SUM(dezfisprog) AS dezfisprog,
      SUM(janfisreal) AS janfisreal,
      SUM(fevfisreal) AS fevfisreal,
      SUM(marfisreal) AS marfisreal,
      SUM(abrfisreal) AS abrfisreal,
      SUM(maifisreal) AS maifisreal,
      SUM(junfisreal) AS junfisreal,
      SUM(julfisreal) AS julfisreal,
      SUM(agofisreal) AS agofisreal,
      SUM(setfisreal) AS setfisreal,
      SUM(outfisreal) AS outfisreal,
      SUM(novfisreal) AS novfisreal,
      SUM(dezfisreal) AS dezfisreal,
      SUM(carteira) AS carteira
      FROM metas_anuais
      INNER JOIN tipos ON tipos.id = metas_anuais.id_tipo
      INNER JOIN turmas ON turmas.id = metas_anuais.id_turma
      INNER JOIN regionais ON regionais.id = metas_anuais.id_regional
      WHERE anocalc = 2024`;

    if (regional) {
      query = Prisma.sql`${query} AND id_regional IN (${Prisma.join(regional)})`;
    }

    if (tipo) {
      query = Prisma.sql`${query} AND id_tipo IN (${Prisma.join(tipo)})`;
    }

    if (parceira) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(parceira)})`;
    }

    if (ano) {
      query = Prisma.sql`${query} AND anocalc IN (${Prisma.join(ano)})`;
    }

    query = Prisma.sql`${query} GROUP BY tipo_obra, turma, regional, anocalc, id_tipo;`;

    const result: Goals[] = await this.prisma.$queryRaw(query);

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
