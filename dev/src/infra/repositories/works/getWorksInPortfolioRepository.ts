import { IGetWorksInPortfolioRepository } from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import {
  totalsWorksInPortfolio,
  worksInPortfolioInterface,
  worksInPortfolioResponseRepository,
} from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetWorksInPortfolioRepository implements IGetWorksInPortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildBaseQuery() {
    return Prisma.sql`
      FROM construcao_sp.obras 
      INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
      INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
      INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
      INNER JOIN construcao_sp.status ON status.id = obras.id_status 
      INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
      INNER JOIN construcao_sp.empreendimento ON obras.id_empreendimento = empreendimento.id
      INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
      INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
    `;
  }

  private withProgramacoes(base: Prisma.Sql) {
    return Prisma.sql`
      ${base}
      LEFT JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
      LEFT JOIN (
        SELECT id_obra, COUNT(*)::int AS contagem_ocorrencias
        FROM construcao_sp.programacoes
        WHERE data_prog > current_date
        GROUP BY id_obra
      ) AS prog_count ON prog_count.id_obra = obras.id
    `;
  }

  private applyBaseWhere(query: Prisma.Sql) {
    return Prisma.sql`${query} WHERE (obras.id_status = 2 AND obras.executado < 100) OR obras.id_status NOT IN (2, 3)`;
  }

  private applyFilters(query: Prisma.Sql, filters: GetWorksDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      ovnota,
      idCircuito,
      idConjunto,
      idEmpreendimento,
      insufficientPermission,
      idStatusSap,
    } = filters;

    if (insufficientPermission) {
      query = Prisma.sql`${query} AND status.id != 42 AND status.id != 4`;
    }

    if (idRegional?.length) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idTipo?.length) {
      query = Prisma.sql`${query} AND obras.id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idParceira?.length) {
      query = Prisma.sql`${query} AND obras.id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo?.length) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (idMunicipio?.length) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idStatus?.length) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    if (idCircuito?.length) {
      query = Prisma.sql`${query} AND obras.id_circuito IN (${Prisma.join(idCircuito)})`;
    }

    if (idConjunto?.length) {
      query = Prisma.sql`${query} AND circuitos.id_conjunto IN (${Prisma.join(idConjunto)})`;
    }

    if (idEmpreendimento?.length) {
      query = Prisma.sql`${query} AND obras.id_empreendimento IN (${Prisma.join(idEmpreendimento)})`;
    }

    if (ovnota) {
      query = Prisma.sql`${query} AND obras.ovnota = ${ovnota}`;
    }

    if (idStatusSap?.length) {
      query = Prisma.sql`${query} 
        AND obras.status_ov_sap IN (${Prisma.join(idStatusSap)}) 
        AND tipos.id_grupo = 1`;
    }

    return query;
  }

  async getWorksInPortfolio(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseRepository> {
    const { page } = filters;

    let base = this.buildBaseQuery();
    base = this.withProgramacoes(base);
    base = this.applyBaseWhere(base);

    let query = Prisma.sql`
      SELECT
        obras.id,
        obras.ovnota,
        COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordem_principal,
        ordem_dca,
        ordem_dcd,
        ordem_dcim,
        status_ov_sap,
        pep,
        mun,
        obras.id_status,
        prazo,
        entrada + prazo AS prazo_fim,
        abrev_regional,
        tipo_obra,
        tipos.id_grupo,
        qtde_planejada,
        prog_count.contagem_ocorrencias,
        qtde_pend,
        circuito,
        mo_planejada,
        status,
        conjunto,
        data_empreitamento,
        empreendimento,
        turma,
        ano_plan,

        COALESCE(SUM(prog) FILTER (WHERE exec IS NULL), 0)::int AS total_prog,
        SUM(exec)::int AS total_exec,
        (100 - (SUM(exec) + COALESCE(SUM(prog) FILTER (WHERE exec IS NULL), 0)))::int AS total_pend,

        SUM(equipe_linha_morta)::int AS total_equipe_lm,
        SUM(equipe_linha_viva)::int AS total_equipe_lv,
        SUM(equipe_regularizacao)::int AS total_equipe_reg

        ${base}
    `;

    let baseCount = this.buildBaseQuery();
    baseCount = this.applyBaseWhere(baseCount);

    let countQuery = Prisma.sql`
      SELECT 
        COUNT(obras.id) as total_obras,
        SUM(mo_planejada) AS total_mo_planejada,
        SUM(mo_planejada * executado::int / 100) as total_mo_exec,
        SUM(CASE WHEN obras.id_status = 4 THEN mo_planejada * executado::int / 100 ELSE 0 END) AS total_mo_suspensa,
        SUM(qtde_planejada) as total_qtde_planejada,
        SUM(qtde_pend) AS total_mo_pend
        ${baseCount}
    `;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`
      ${query}
      GROUP BY 
        obras.id, obras.ovnota, diagrama, ordem_dci, ordem_dcim, ordem_dca, ordem_dcd,
        status_ov_sap, pep, mun, obras.id_status, prazo, abrev_regional, tipo_obra,
        tipos.id_grupo, qtde_planejada, qtde_pend, circuito, mo_planejada, status,
        conjunto, empreendimento, turma, ano_plan, prog_count.contagem_ocorrencias
      ORDER BY status DESC, entrada + prazo
    `;

    if (page !== undefined) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const [works, totals] = await Promise.all([
      this.prisma.$queryRaw<worksInPortfolioInterface[]>(query),
      this.prisma.$queryRaw<totalsWorksInPortfolio[]>(countQuery),
    ]);

    return { works, totals };
  }
}
