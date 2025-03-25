import * as moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import {
  totalsWorksInPortfolio,
  worksInPortfolioInterface,
  worksInPortfolioResponse,
} from 'src/interface/types/getWorksInPortfolioInterface';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetWorksInPortfolioService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private applyFilters(query: Prisma.Sql, filters: GetWorksDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      idOvnota,
      idCircuito,
      idConjunto,
      idEmpreendimento,
      data,
      tipoFiltro,
    } = filters;

    const [month, year] = data ? data.split('/') : [null, null];

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

    if (idOvnota && idOvnota.length > 0) {
      query = Prisma.sql`${query} AND obras.id IN (${Prisma.join(idOvnota)})`;
    }

    if (tipoFiltro === 'month' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM first_data_prog) = ${parseInt(month)} AND EXTRACT(YEAR FROM first_data_prog) = ${parseInt(year)}`;
    }

    if (tipoFiltro === 'day' && data) {
      query = Prisma.sql`${query} AND first_data_prog = ${moment(data, 'DD/MM/YYYY', true).toDate()}`;
    }

    return query;
  }

  async getWorksInPortfolio(
    filters: GetWorksDTO,
  ): Promise<worksInPortfolioResponse> {
    const { page } = filters;

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    const responseData: worksInPortfolioResponse =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const baseQuery = Prisma.sql`FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
        INNER JOIN construcao_sp.empreendimento ON obras.id_empreendimento = empreendimento.id
        INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
        INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id = obras.id
        LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id 
        WHERE data_conclusao IS NULL`;

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, 
        executado, mun, id_status, entrada, prazo, entrada + prazo AS prazo_fim, abrev_regional, tipo_obra, qtde_planejada, contagem_ocorrencias,
        qtde_pend, circuito, mo_planejada, first_data_prog, status.status, hora_ini, hora_ter, tipo_servico, datas_programacao.chi,
        conjuntos.conjunto, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, data_empreitamento, empreendimento, turma
        ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada) AS total_mo_planejada, SUM(mo_planejada*executado/100) as total_mo_exec, 
        SUM(CASE WHEN id_status = 4 THEN mo_planejada*executado/100 ELSE 0 END) AS total_mo_suspensa, SUM(qtde_planejada) as total_qtde_planejada,
        SUM(qtde_pend) AS total_mo_pend ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY first_data_prog, status DESC, entrada + prazo`;

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
