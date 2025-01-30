import * as moment from 'moment';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import {
  totalsWorksInPortfolio,
  worksInPortfolioInterface,
  worksInPortfolioResponse,
} from 'src/interfaces/getWorksInPortfolioInterface';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetCompletedWorksService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private applyFilters(query: Prisma.Sql, filters: GetWorksDTO) {
    const {
      data,
      idCircuito,
      idConjunto,
      idEmpreendimento,
      idGrupo,
      idMunicipio,
      idOvnota,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      tipoFiltro,
    } = filters;

    const [month, year] = data.split('/');

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idTipo) {
      query = Prisma.sql`${query} AND id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idStatus) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    if (idCircuito) {
      query = Prisma.sql`${query} AND id_circuito IN (${Prisma.join(idCircuito)})`;
    }

    if (idConjunto) {
      query = Prisma.sql`${query} AND circuitos.id_conjunto IN (${Prisma.join(idConjunto)})`;
    }

    if (idEmpreendimento) {
      query = Prisma.sql`${query} AND id_empreendimento IN (${Prisma.join(idEmpreendimento)})`;
    }

    if (idOvnota) {
      query = Prisma.sql`${query} AND obras.id IN (${Prisma.join(idOvnota)})`;
    }

    if (tipoFiltro === 'month' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM data_conclusao) = ${parseInt(month)} AND EXTRACT(YEAR FROM data_conclusao) = ${parseInt(year)}`;
    }

    if (tipoFiltro === 'day' && data) {
      query = Prisma.sql`${query} AND data_conclusao = ${moment(data, 'DD/MM/YYYY', true).toDate()}`;
    }

    return query;
  }

  async getCompletedWorks(filters: GetWorksDTO) {
    const { page } = filters;

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    const responseData: worksInPortfolioResponse =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const baseQuery = Prisma.sql`FROM construcao_sp.obras
                INNER JOIN construcao_sp.municipios ON obras.id_gpm = municipios.id
                INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
                INNER JOIN construcao_sp.status ON obras.id_status = status.id
                INNER JOIN construcao_sp.tipos ON obras.id_tipo = tipos.id
                INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
                INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
                INNER JOIN construcao_sp.turmas ON obras.id_turma = turmas.id
                LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id
                WHERE data_conclusao IS NOT NULL`;

    let query = Prisma.sql`SELECT obras.id, obras.ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, executado, 
      mun, CASE WHEN current_date > entrada + prazo THEN 1 ELSE 0 END AS atraso, data_conclusao, tipo_obra, qtde_planejada, qtde_pend,
      circuito, mo_planejada, contagem_ocorrencias, turma, status, conjunto, abrev_regional, observ_obra
      ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada) AS total_mo_planejada, SUM(mo_planejada*executado/100) as total_mo_exec, 
      SUM(CASE WHEN id_status = 4 THEN mo_planejada*executado/100 ELSE 0 END) AS total_mo_suspensa, SUM(qtde_planejada) as total_qtde_planejada, 
      SUM(qtde_pend) AS total_mo_pend  ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY data_conclusao DESC`;

    if (page !== null) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200};`;
    }

    const [works, result] = await Promise.all([
      this.prisma.$queryRaw<worksInPortfolioInterface[]>(query),
      this.prisma.$queryRaw<totalsWorksInPortfolio[]>(countQuery),
    ]);

    const totals =
      result.length > 0
        ? {
            total_obras: Number(result[0].total_obras) || 0,
            total_mo_planejada: result[0].total_mo_planejada || 0,
            total_mo_exec: result[0].total_mo_exec || 0,
            total_mo_suspensa: result[0].total_mo_suspensa || 0,
            total_qtde_planejada: result[0].total_qtde_planejada || 0,
            total_qtde_pend: result[0].total_qtde_pend || 0,
          }
        : null;

    const response: worksInPortfolioResponse = {
      works,
      totals,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
