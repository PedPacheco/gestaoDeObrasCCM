import * as moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetScheduleValuesInterface,
  GetScheduleValuesResponse,
  totalsGetScheduleValues,
} from 'src/interface/types/getScheduleValuesInterface';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetScheduleValuesService {
  constructor(private prisma: PrismaService) {}

  private applyFilters(query: Prisma.Sql, filters: GetScheduleValuesDTO) {
    const {
      data,
      executado,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      tipoFiltro,
    } = filters;

    const [month, year] = data.split('/');

    if (tipoFiltro === 'month' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM data_prog) = ${parseInt(month)} AND EXTRACT(YEAR FROM data_prog) = ${parseInt(year)}`;
    }

    if (tipoFiltro === 'day' && data) {
      query = Prisma.sql`${query} AND data_prog = ${moment(data, 'DD/MM/YYYY', true).toDate()}`;
    }

    if (idRegional && idRegional.length > 0) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idMunicipio && idMunicipio.length > 0) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
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

    if (executado) {
      query = Prisma.sql`${query} AND exec <> 0`;
    } else {
      query = Prisma.sql`${query} AND exec IS NULL`;
    }

    return query;
  }

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponse> {
    const { page } = filters;

    const baseQuery = Prisma.sql`FROM construcao_sp.obras
        INNER JOIN construcao_sp.circuitos ON circuitos.id = obras.id_circuito
        INNER JOIN construcao_sp.conjuntos ON conjuntos.id = circuitos.id_conjunto
        INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
        INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
        INNER JOIN construcao_sp.tecnicos ON tecnicos.id = programacoes.id_tecnico
        WHERE 1=1`;

    let query = Prisma.sql`SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
        mo_planejada, turma, executado, data_prog, prog, exec, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec,
        num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, tecnico, conjunto, circuito
        ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada) as total_mo_planejada, SUM(mo_planejada*executado/100) as total_mo_exec, 
        SUM(qtde_planejada) as total_qtde_planejada ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY data_prog, ovnota`;

    if (page !== undefined) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const [works, result] = await Promise.all([
      this.prisma.$queryRaw<GetScheduleValuesInterface[]>(query),
      this.prisma.$queryRaw<totalsGetScheduleValues[]>(countQuery),
    ]);

    const totals = {
      total_obras: Number(result[0].total_obras),
      total_mo_planejada: result[0].total_mo_planejada || 0,
      total_mo_exec: result[0].total_mo_exec || 0,
      total_qtde_planejada: result[0].total_qtde_planejada || 0,
    };

    const response: GetScheduleValuesResponse = {
      works,
      totals,
    };

    return response;
  }
}
