import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RdaGoalsDTO } from 'src/interface/dtos/goalsDto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class RdaGoalsService {
  constructor(private prisma: PrismaService) {}

  async get(filters: RdaGoalsDTO): Promise<any> {
    const { ano, empreendimento, parceira, regional } = filters;

    let query = Prisma.sql`SELECT empreendimento,
        tipo_obra,
        turma,
        regional,
        anocalc,
        descricao,
        jan_meta_fisico,
        fev_meta_fisico,
        mar_meta_fisico,
        abr_meta_fisico,
        mai_meta_fisico,
        jun_meta_fisico,
        jul_meta_fisico,
        ago_meta_fisico,
        set_meta_fisico,
        out_meta_fisico,
        nov_meta_fisico,
        dez_meta_fisico,
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
        FROM construcao_sp.get_view_data(NULL) AS metas_anuais
        INNER JOIN tipos ON tipos.id = metas_anuais.id_tipo
        INNER JOIN turmas ON turmas.id = metas_anuais.id_turma
        INNER JOIN regionais ON regionais.id = metas_anuais.id_regional
        INNER JOIN empreendimento ON empreendimento.id = metas_anuais.id_empreendimento
        INNER JOIN metas ON metas_anuais.id_empreendimento = metas.id_empreendimento
        WHERE anocalc IN (${Prisma.join(ano)}) AND metas_anuais.id_tipo = 49`;

    if (regional && regional.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_regional IN (${Prisma.join(regional)})`;
    }

    if (empreendimento && empreendimento.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_empreendimento IN (${Prisma.join(empreendimento)})`;
    }

    if (parceira && parceira.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_turma IN (${Prisma.join(parceira)})`;
    }

    query = Prisma.sql`${query} GROUP BY empreendimento, tipo_obra, turma, regional, anocalc, descricao, jan_meta_fisico, fev_meta_fisico, mar_meta_fisico, abr_meta_fisico, 
    mai_meta_fisico, jun_meta_fisico, jul_meta_fisico, ago_meta_fisico, set_meta_fisico, out_meta_fisico, nov_meta_fisico, dez_meta_fisico ORDER BY turma, empreendimento, descricao`;

    const result: any[] = await this.prisma.$queryRaw(query);

    // return result;
    return this.sumTotals(result);
  }

  private sumTotals(data: any[]) {
    const enterprises: string[] = [];
    let totalGoals = 0;
    let totalScheduled = 0;
    let totalAccomplished = 0;

    const result = data.map((item: any) => {
      Object.keys(item).forEach((key) => {
        const alreadyExists = enterprises.includes(
          `${item['empreendimento']}_${item[key]}`,
        );

        if (key.includes('meta') && typeof item[key] === 'number') {
          totalGoals += item[key];
        }

        if (
          key.includes('prog') &&
          typeof item[key] === 'number' &&
          !alreadyExists &&
          item[key] !== 0
        ) {
          totalScheduled += item[key];
          enterprises.push(`${item['empreendimento']}_${item[key]}`);
        }

        if (
          key.includes('real') &&
          typeof item[key] === 'number' &&
          !alreadyExists &&
          item[key] !== 0
        ) {
          totalAccomplished += item[key];
          enterprises.push(`${item['empreendimento']}_${item[key]}`);
        }
      });

      return {
        empreendimento: item.empreendimento,
        tipo_obra: item.tipo_obra,
        turma: item.turma,
        regional: item.regional,
        anocalc: item.anocalc,
        descricao: item.descricao,
        jan_meta_fisico: item.jan_meta_fisico,
        fev_meta_fisico: item.fev_meta_fisico,
        mar_meta_fisico: item.mar_meta_fisico,
        abr_meta_fisico: item.abr_meta_fisico,
        mai_meta_fisico: item.mai_meta_fisico,
        jun_meta_fisico: item.jun_meta_fisico,
        jul_meta_fisico: item.jul_meta_fisico,
        ago_meta_fisico: item.ago_meta_fisico,
        set_meta_fisico: item.set_meta_fisico,
        out_meta_fisico: item.out_meta_fisico,
        nov_meta_fisico: item.nov_meta_fisico,
        dez_meta_fisico: item.dez_meta_fisico,
        carteira: item.carteira,
      };
    });

    return {
      works: result,
      totalGoals,
      totalScheduled,
      totalAccomplished,
    };
  }
}
