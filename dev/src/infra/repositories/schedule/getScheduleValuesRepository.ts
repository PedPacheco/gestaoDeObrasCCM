import moment from 'moment';
import { IGetScheduleValuesRepository } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetScheduleValuesInterface,
  GetScheduleValuesResponseRepository,
  TotalsGetScheduleValuesRepository,
} from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/infra/generated/prisma/client';

@Injectable()
export class GetScheduleValuesRepository implements IGetScheduleValuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Equipas por programação:
   * - obras ponto a ponto: equipas distintas em programacoes_servicos (LM / LV / NR)
   * - restantes obras: campos da tabela programacoes
   * Devolve sempre uma linha por programação (agregação sem GROUP BY).
   */
  private EQUIPES_JOIN = Prisma.sql`
  LEFT JOIN LATERAL (
    SELECT
      CASE WHEN obras.programacao_ponto_a_ponto
           THEN COUNT(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'LM')
           ELSE COALESCE(programacoes.equipe_linha_morta, 0)
      END::int AS equipe_linha_morta,
      CASE WHEN obras.programacao_ponto_a_ponto
           THEN COUNT(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'LV')
           ELSE COALESCE(programacoes.equipe_linha_viva, 0)
      END::int AS equipe_linha_viva,
      CASE WHEN obras.programacao_ponto_a_ponto
           THEN COUNT(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'NR')
           ELSE COALESCE(programacoes.equipe_regularizacao, 0)
      END::int AS equipe_regularizacao
    FROM construcao_sp.programacoes_servicos ps
    JOIN construcao_sp.equipes e ON e.id = ps.id_equipe
    CROSS JOIN LATERAL (
      SELECT CASE
               WHEN UPPER(e.equipe) LIKE '%LM%' THEN 'LM'
               WHEN UPPER(e.equipe) LIKE '%LV%' THEN 'LV'
               WHEN UPPER(e.equipe) LIKE '%NR%' THEN 'NR'
             END AS tipo
    ) t
    WHERE ps.id_programacao = programacoes.id
      AND obras.programacao_ponto_a_ponto  -- não lê os serviços das obras que não são ponto a ponto
  ) eq ON TRUE`;

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
      idTecnico,
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

    if (idTecnico && idTecnico.length > 0) {
      query = Prisma.sql`${query} AND tecnicos.id IN (${Prisma.join(idTecnico)})`;
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
    ${this.EQUIPES_JOIN}
    WHERE status.id NOT IN (3, 4)`;

    let query = Prisma.sql`SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim, ordem_dcd, ordem_dca) AS ordemdiagrama, diagrama, mun, regional, entrada + prazo AS prazo_fim,
    turma, status_ov_sap, executado, data_prog, prog, exec,
    CASE WHEN obras.programacao_ponto_a_ponto THEN 0 ELSE mo_planejada::int*prog/100 END AS mo_prog,
    CASE WHEN obras.programacao_ponto_a_ponto THEN 0 ELSE mo_planejada::int*exec/100 END AS mo_exec,
    capex_mat_pend, capex_mo_pend, tipo_obra,
    id_grupo, qtde_planejada, qtde_pend, num_dp, hora_ini, hora_ter, eq.equipe_linha_morta, eq.equipe_linha_viva, eq.equipe_regularizacao, tecnico, conjunto, circuito,
    status_programacao, status, id_restricao_prog1, id_restricao_prog2, data_resolucao1, data_resolucao2, status_restricao1, status_restricao2, encontrado, programacoes.id as id_programacao
    ${baseQuery}`;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras,
    SUM(CASE WHEN obras.programacao_ponto_a_ponto THEN 0 ELSE mo_planejada*prog::numeric/100 END) as total_mo_planejada,
    SUM(CASE WHEN obras.programacao_ponto_a_ponto THEN 0 ELSE mo_planejada*executado/100 END) as total_mo_exec,
    SUM(eq.equipe_linha_morta)::int AS total_equipe_linha_morta,
    SUM(eq.equipe_linha_viva)::int AS total_equipe_linha_viva,
    SUM(eq.equipe_regularizacao)::int AS total_equipe_regularizacao,
    SUM(qtde_planejada * (prog::numeric/100)) as total_qtde_planejada
    ${baseQuery}`;

    query = this.applyFilters(query, filters);
    countQuery = this.applyFilters(countQuery, filters);

    query = Prisma.sql`${query} ORDER BY data_prog, ovnota`;

    if (page !== undefined) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const [works, [resultTotals]] = await Promise.all([
      this.prisma.$queryRaw<GetScheduleValuesInterface[]>(query),
      this.prisma.$queryRaw<TotalsGetScheduleValuesRepository[]>(countQuery),
    ]);

    return { works, resultTotals };
  }
}
