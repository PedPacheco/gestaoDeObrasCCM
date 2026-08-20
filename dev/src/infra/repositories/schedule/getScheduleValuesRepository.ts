import moment from 'moment';
import { IGetScheduleValuesRepository } from 'src/domain/contracts/schedule/IGetScheduleValuesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetScheduleValuesInterface,
  GetScheduleValuesResponseRepository,
  totalsGetScheduleValues,
} from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetScheduleValuesRepository implements IGetScheduleValuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private applyFilters(query: Prisma.Sql, filters: GetScheduleValuesDTO) {
    const {
      executado,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      idStatus,
      idStatusProgramacao,
      dataFinal,
      dataInicial,
      ovnota,
      pendente,
      idStatusSap,
    } = filters;

    if (dataInicial && dataFinal) {
      const ini = moment(dataInicial, 'DD/MM/YYYY').toDate();
      const fim = moment(dataFinal, 'DD/MM/YYYY').toDate();
      query = Prisma.sql`${query} AND programacoes.data_prog BETWEEN ${ini} AND ${fim}`;
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

    if (idStatus && idStatus.length > 0) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    if (idStatusProgramacao && idStatusProgramacao.length > 0) {
      query = Prisma.sql`${query} AND status_programacao.id IN (${Prisma.join(idStatusProgramacao)})`;
    }

    if (ovnota) {
      query = Prisma.sql`${query} AND obras.ovnota = ${ovnota}`;
    }

    if (idStatusSap) {
      query = Prisma.sql`${query} AND obras.status_ov_sap IN (${Prisma.join(idStatusSap)}) AND tipos.id_grupo = 1`;
    }

    if (executado && !pendente) {
      query = Prisma.sql`${query} AND exec IS NOT NULL`;
    } else {
      query = Prisma.sql`${query} AND exec IS NULL`;
    }

    if (pendente) {
      query = Prisma.sql`${query} AND data_prog < CURRENT_DATE`;
    }

    return query;
  }

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponseRepository> {
    const { page } = filters;
    const baseQuery = Prisma.sql`FROM construcao_sp.obras
        INNER JOIN construcao_sp.circuitos ON circuitos.id = obras.id_circuito
        INNER JOIN construcao_sp.conjuntos ON conjuntos.id = circuitos.id_conjunto
        INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
        INNER JOIN construcao_sp.status ON status.id = obras.id_status
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
        INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
        INNER JOIN construcao_sp.tecnicos ON tecnicos.id = programacoes.id_tecnico
        INNER JOIN construcao_sp.status_programacao ON status_programacao.id = programacoes.id_status_programacao
        LEFT JOIN construcao_sp.relatorio ON relatorio.id_obra = obras.id
        WHERE status.id NOT IN (3, 4)`;

    let query = Prisma.sql`SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim, ordem_dcd, ordem_dca) AS ordemdiagrama, diagrama, mun, regional, entrada + prazo AS prazo_fim, 
        turma, status_ov_sap, executado, data_prog, prog, exec, mo_planejada::int*prog/100 AS mo_prog, mo_planejada::int*COALESCE(exec, 100)/100 AS mo_exec, capex_mat_pend, capex_mo_pend, tipo_obra, 
        id_grupo, qtde_planejada, qtde_pend, num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, tecnico, conjunto, circuito, 
        status_programacao, status, id_restricao_prog1, id_restricao_prog2, data_resolucao1, data_resolucao2, status_restricao1, status_restricao2, encontrado
        ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras, SUM(mo_planejada*prog::numeric/100) as total_mo_planejada, SUM(mo_planejada*executado/100) as total_mo_exec, 
        SUM(qtde_planejada * (prog::numeric/100)) as total_qtde_planejada ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY data_prog, ovnota`;

    if (page !== undefined) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const [works, resultTotals] = await Promise.all([
      this.prisma.$queryRaw<GetScheduleValuesInterface[]>(query),
      this.prisma.$queryRaw<totalsGetScheduleValues[]>(countQuery),
    ]);

    return { works, resultTotals };
  }
}
