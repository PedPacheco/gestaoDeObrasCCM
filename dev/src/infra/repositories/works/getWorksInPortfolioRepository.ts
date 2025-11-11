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
export class GetWorksInPortfolioRepository
  implements IGetWorksInPortfolioRepository
{
  constructor(private readonly prisma: PrismaService) {}

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
    } = filters;

    if (insufficientPermission) {
      query = Prisma.sql`${query} AND status.id != 42 AND status.id != 4`;
    }

    if (idRegional && idRegional.length > 0) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idTipo && idTipo.length > 0) {
      query = Prisma.sql`${query} AND id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idParceira && idParceira.length > 0) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo && idGrupo.length > 0) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (idMunicipio && idMunicipio.length > 0) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idStatus && idStatus.length > 0) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    if (idCircuito && idCircuito.length > 0) {
      query = Prisma.sql`${query} AND id_circuito IN (${Prisma.join(idCircuito)})`;
    }

    if (idConjunto && idConjunto.length > 0) {
      query = Prisma.sql`${query} AND circuitos.id_conjunto IN (${Prisma.join(idConjunto)})`;
    }

    if (idEmpreendimento && idEmpreendimento.length > 0) {
      query = Prisma.sql`${query} AND id_empreendimento IN (${Prisma.join(idEmpreendimento)})`;
    }

    if (ovnota) {
      query = Prisma.sql`${query} AND obras.ovnota = ${ovnota}`;
    }

    return query;
  }

  async getWorksInPortfolio(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseRepository> {
    const { page } = filters;

    const baseQuery = Prisma.sql`FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
        INNER JOIN construcao_sp.empreendimento ON obras.id_empreendimento = empreendimento.id
        INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
        INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
        LEFT JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
        LEFT JOIN (SELECT id_obra, COUNT(*)::int AS contagem_ocorrencias FROM construcao_sp.programacoes WHERE data_prog > current_date GROUP BY id_obra) AS prog_count ON prog_count.id_obra = obras.id 
        WHERE data_conclusao IS NULL`;

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, 
        executado, mun, id_status, entrada, prazo, entrada + prazo AS prazo_fim, abrev_regional, tipo_obra, qtde_planejada, contagem_ocorrencias,
        qtde_pend, circuito, mo_planejada,  status, conjunto, data_empreitamento, empreendimento, turma, ano_plan,
        COALESCE(SUM(prog) FILTER (WHERE exec IS NULL), 0)::int AS total_prog,
        SUM(exec)::int AS total_exec, (100 - (SUM(exec) + COALESCE(SUM(prog) FILTER (WHERE exec IS NULL), 0)))::int AS total_pend,
        SUM(equipe_linha_morta)::int as total_equipe_lm, SUM(equipe_linha_viva)::int as total_equipe_lv, SUM(equipe_regularizacao)::int as total_equipe_reg
        ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada) AS total_mo_planejada, SUM(mo_planejada*executado/100) as total_mo_exec, 
        SUM(CASE WHEN id_status = 4 THEN mo_planejada*executado/100 ELSE 0 END) AS total_mo_suspensa, SUM(qtde_planejada) as total_qtde_planejada,
        SUM(qtde_pend) AS total_mo_pend ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} GROUP BY obras.id, ovnota, diagrama, ordem_dci, ordem_dcim, ordem_dca, ordem_dcd, status_ov_sap, pep, executado,
        mun, id_status, entrada, prazo, abrev_regional, tipo_obra, qtde_planejada, qtde_pend, 
        circuito, mo_planejada, status, conjunto, empreendimento, turma, ano_plan, prog_count.contagem_ocorrencias
        ORDER BY status DESC, entrada + prazo`;

    if (page !== undefined) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200};`;
    }

    const [works, totals] = await Promise.all([
      this.prisma.$queryRaw<worksInPortfolioInterface[]>(query),
      this.prisma.$queryRaw<totalsWorksInPortfolio[]>(countQuery),
    ]);

    return { works, totals };
  }
}
