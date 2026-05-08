import { IGetCompletedWorksRepository } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import {
  totalsWorksInPortfolio,
  worksInPortfolioInterface,
  worksInPortfolioResponseRepository,
} from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import moment from 'moment';

@Injectable()
export class GetCompletedWorksRepository implements IGetCompletedWorksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private applyFilters(query: Prisma.Sql, filters: GetWorksDTO) {
    const {
      idCircuito,
      idConjunto,
      idEmpreendimento,
      idGrupo,
      idMunicipio,
      ovnota,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      insufficientPermission,
      dataFinal,
      dataInicial,
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

    if (dataInicial && dataFinal) {
      const ini = moment(dataInicial, 'DD/MM/YYYY').toDate();
      const fim = moment(dataFinal, 'DD/MM/YYYY').toDate();
      query = Prisma.sql`${query} AND data_conclusao BETWEEN ${ini} AND ${fim}`;
    }

    return query;
  }

  async getCompletedWorks(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponseRepository> {
    const { page } = filters;

    const baseQuery = Prisma.sql`FROM construcao_sp.obras
        INNER JOIN construcao_sp.municipios ON obras.id_gpm = municipios.id
        INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
        INNER JOIN construcao_sp.status ON obras.id_status = status.id
        INNER JOIN construcao_sp.tipos ON obras.id_tipo = tipos.id
        INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
        INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
        INNER JOIN construcao_sp.turmas ON obras.id_turma = turmas.id
        WHERE ((id_status = 2 AND executado = 100) OR id_status IN (2, 3))`;

    let query = Prisma.sql`SELECT obras.id, obras.ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, executado, 
    mun, CASE WHEN current_date > entrada + prazo THEN 1 ELSE 0 END AS atraso, data_conclusao, tipo_obra, qtde_planejada, qtde_pend,
    circuito, mo_planejada, turma, status, conjunto, abrev_regional, observ_obra, ano_plan
    ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada) AS total_mo_planejada, SUM(mo_final) as total_mo_exec, 
    SUM(mo_pend) AS total_mo_pend, SUM(qtde_planejada) as total_qtde_planejada, SUM(qtde_pend) AS total_qtde_pend  ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY data_conclusao DESC`;

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
