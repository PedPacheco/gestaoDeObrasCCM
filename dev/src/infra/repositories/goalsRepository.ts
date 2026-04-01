import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IGoalsRepository } from 'src/domain/repositories/IGoalsRepository';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { goalsInterfaceRepository } from 'src/interface/types/goalsInterface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsRepository implements IGoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getGoals(filters: GoalsDTO): Promise<goalsInterfaceRepository[]> {
    const {
      parceira,
      regional,
      tipo,
      ano,
      anoPlan,
      btzero,
      empreendimento,
      rda,
    } = filters;

    const anoPlanIsNull = anoPlan ? Prisma.sql`${anoPlan}::integer` : null;

    let query = Prisma.sql`SELECT
      id_tipo,
      metas_anuais.id_turma as id_parceira,
      metas_anuais.id_regional,
      tipo_obra,
      turma,
      regional,
      empreendimento,
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
      FROM construcao_sp.get_view_data(${anoPlanIsNull}) AS metas_anuais
      INNER JOIN tipos ON tipos.id = metas_anuais.id_tipo
      INNER JOIN turmas ON turmas.id = metas_anuais.id_turma
      INNER JOIN regionais ON regionais.id = metas_anuais.id_regional
      LEFT JOIN empreendimento ON empreendimento.id = metas_anuais.id_empreendimento
      WHERE anocalc IN (${Prisma.join(ano)})`;

    if (btzero) {
      query = Prisma.sql`${query} AND (id_tipo = 48 OR id_tipo = 25 OR id_tipo = 50)`;
    }

    if (rda) {
      query = Prisma.sql`${query} AND (id_tipo = 54 OR id_tipo = 55 OR id_tipo = 35) AND empreendimento IS NOT NULL`;
    }

    if (!rda && !btzero) {
      query = Prisma.sql`${query} 
      AND (metas_anuais.id_tipo != 48 
      AND metas_anuais.id_tipo != 49 
      AND metas_anuais.id_tipo != 54 
      AND metas_anuais.id_tipo != 55 
      AND metas_anuais.id_tipo != 35
      AND metas_anuais.id_tipo != 25
      AND metas_anuais.id_tipo != 50)`;
    }

    if (regional && regional.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_regional IN (${Prisma.join(regional)})`;
    }

    if (tipo && tipo.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_tipo IN (${Prisma.join(tipo)})`;
    }

    if (parceira && parceira.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_turma IN (${Prisma.join(parceira)})`;
    }

    if (empreendimento && empreendimento.length > 0) {
      query = Prisma.sql`${query} AND metas_anuais.id_empreendimento IN (${Prisma.join(empreendimento)})`;
    }

    query = Prisma.sql`${query} GROUP BY tipo_obra, turma, regional, empreendimento, anocalc, id_tipo, metas_anuais.id_turma, metas_anuais.id_regional;`;

    const result: goalsInterfaceRepository[] =
      await this.prisma.$queryRaw(query);

    return result;
  }
}
