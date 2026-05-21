import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IRestrictionsRepository } from 'src/domain/repositories/IRestrictionsRepository';
import { PrismaService } from '../prisma/prisma.service';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';
import {
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import {
  ProcessedEliminacaoFilters,
  ProcessedRestrictionsFilters,
} from 'src/application/usecases/restrictions.service';

@Injectable()
export class RestrictionsRepository implements IRestrictionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aplica os filtros já processados à query SQL.
   * Não contém regras de negócio — apenas constrói cláusulas WHERE
   * a partir de valores prontos recebidos do service.
   */
  private applyFilters(
    query: Prisma.Sql,
    filters: ProcessedRestrictionsFilters,
    typeRestriction: 'schedule' | 'publication',
  ): Prisma.Sql {
    const {
      dataInicial,
      dataFinal,
      filterExecutado,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      idRestricao,
      ovnota,
    } = filters;

    if (dataInicial && dataFinal && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND programacoes.data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    }

    if (dataInicial && dataFinal && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND data_conclusao BETWEEN ${dataInicial} AND ${dataFinal}`;
    }

    if (filterExecutado === true && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND restricoes_publicacoes.data_resolucao IS NOT NULL`;
    }

    if (filterExecutado === false && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND restricoes_publicacoes.data_resolucao IS NULL`;
    }

    if (filterExecutado === true && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND programacoes.exec IS NOT NULL`;
    }

    if (filterExecutado === false && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND programacoes.exec IS NULL`;
    }

    if (idRegional?.length) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idMunicipio?.length) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idTipo?.length) {
      query = Prisma.sql`${query} AND obras.id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idRestricao?.length && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND (restr1.id IN (${Prisma.join(idRestricao)}) OR restr2.id IN (${Prisma.join(idRestricao)}))`;
    }

    if (idRestricao?.length && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND restricoes_publicacoes.id_restricao IN (${Prisma.join(idRestricao)})`;
    }

    if (idParceira?.length) {
      query = Prisma.sql`${query} AND obras.id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo?.length) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (ovnota) {
      query = Prisma.sql`${query} AND obras.ovnota = ${ovnota}`;
    }

    return query;
  }

  async getScheduleRestrictions(
    filters: ProcessedRestrictionsFilters,
  ): Promise<{ works: GetScheduleRestrictions[]; totals: any[] }> {
    const { page = 0 } = filters;
    const limit = 200;
    const offset = page * limit;

    const baseQuery = Prisma.sql`
      FROM construcao_sp.obras
      INNER JOIN construcao_sp.programacoes 
        ON programacoes.id_obra = obras.id
      INNER JOIN construcao_sp.municipios 
        ON municipios.id = obras.id_gpm
      INNER JOIN construcao_sp.tipos 
        ON tipos.id = obras.id_tipo
      INNER JOIN construcao_sp.turmas 
        ON turmas.id = obras.id_turma
      INNER JOIN construcao_sp.restricoes AS restr1
        ON restr1.id = programacoes.id_restricao_prog1
      INNER JOIN construcao_sp.restricoes AS restr2
        ON restr2.id = programacoes.id_restricao_prog2
      WHERE 1=1
    `;

    let query = Prisma.sql`
      SELECT 
        obras.id,
        obras.ovnota,
        obras.diagrama,
        obras.ordem_dci,
        obras.ordem_dcim,
        obras.executado,
        municipios.mun,
        tipos.tipo_obra,
        turmas.turma as parceira,
        programacoes.id AS prog_id,
        programacoes.data_prog,
        programacoes.prog,
        programacoes.exec,
        programacoes.observacao_restricao,
        programacoes.id_restricao_prog1,
        restr1.restricao AS restricao1,
        programacoes.responsabilidade1,
        programacoes.nome_responsavel,
        programacoes.area_responsavel1,
        programacoes.status_restricao1,
        programacoes.data_resolucao1,
        programacoes.id_restricao_prog2,
        restr2.restricao AS restricao2,
        programacoes.responsabilidade2,
        programacoes.nome_responsavel2,
        programacoes.area_responsavel2,
        programacoes.status_restricao2,
        programacoes.data_resolucao2
      ${baseQuery}
    `;

    let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras ${baseQuery}`;

    query = this.applyFilters(query, filters, 'schedule');
    countQuery = this.applyFilters(countQuery, filters, 'schedule');

    query = Prisma.sql`${query} ORDER BY programacoes.data_prog, obras.ovnota`;
    query = Prisma.sql`${query} LIMIT ${limit} OFFSET ${offset}`;

    const [works, totals] = await Promise.all([
      this.prisma.$queryRaw<GetScheduleRestrictions[]>(query),
      this.prisma.$queryRaw<any[]>(countQuery),
    ]);

    return { works, totals };
  }

  async getPublicationRestricion(
    filters: ProcessedRestrictionsFilters,
  ): Promise<{ works: any[] }> {
    const baseQuery = Prisma.sql`
      FROM construcao_sp.obras
      INNER JOIN construcao_sp.municipios 
        ON municipios.id = obras.id_gpm
      INNER JOIN construcao_sp.regionais
        ON regionais.id = municipios.id_regional
      INNER JOIN construcao_sp.tipos 
        ON tipos.id = obras.id_tipo
      INNER JOIN construcao_sp.turmas 
        ON turmas.id = obras.id_turma
      INNER JOIN construcao_sp.status
        ON status.id = obras.id_status
      INNER JOIN construcao_sp.restricoes_publicacoes
        ON restricoes_publicacoes.id_obra = obras.id
      INNER JOIN construcao_sp.restricoes
        ON restricoes.id = restricoes_publicacoes.id_restricao
      INNER JOIN construcao_sp.usuario
        ON usuario.id = restricoes_publicacoes.criado_por
      WHERE 1=1
    `;

    let query = Prisma.sql`
      SELECT 
        obras.id,
        obras.ovnota,
        COALESCE(diagrama, ordem_dci, ordem_dcim, ordem_dcd, ordem_dca) AS ordemdiagrama,
        obras.executado,
        status.status,
        obras.data_conclusao,
        municipios.mun,
        regional,
        obras.id_turma,
        entrada + prazo AS prazo_fim,
        tipos.id_grupo,
        tipos.tipo_obra,
        turmas.turma as parceira,
        restricoes_publicacoes.id as id_restricao_publicacao,
        restricoes.restricao,
        restricoes_publicacoes.criado_em,
        restricoes.id as id_restricao,
        restricoes_publicacoes.responsabilidade,
        restricoes_publicacoes.nome_responsavel,
        restricoes_publicacoes.status_restricao,
        restricoes_publicacoes.data_resolucao,
        restricoes_publicacoes.observacao,
        restricoes_publicacoes.observacao_construcao,
        usuario.nome_usuario
      ${baseQuery}
    `;

    query = this.applyFilters(query, filters, 'publication');
    query = Prisma.sql`${query} ORDER BY obras.data_conclusao DESC`;

    const works = await this.prisma.$queryRaw<any[]>(query);

    return { works };
  }

  async getPublicationRestrictionByWorkId(id: number): Promise<any[]> {
    const value = id.toString();

    return await this.prisma.restricoes_publicacoes.findMany({
      where: {
        obras: {
          OR: [
            { id: value.length >= 10 ? undefined : id },
            { ovnota: value },
            { ordem_dci: value },
            { ordem_dcd: value },
            { ordem_dca: value },
            { ordem_dcim: value },
            { diagrama: value },
          ],
        },
      },
      select: {
        restricoes: { select: { restricao: true } },
        usuario: { select: { nome_usuario: true } },
        responsabilidade: true,
        nome_responsavel: true,
        status_restricao: true,
        data_resolucao: true,
        criado_em: true,
        observacao: true,
        observacao_construcao: true,
      },
    });
  }

  async insertPublicationRestriction(
    data: InsertPublicationRestrictionsDTO[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.restricoes_publicacoes.createMany({
        data: data.map((item) => ({
          id_obra: item.id,
          id_restricao: item.idRestriction,
          responsabilidade: item.responsibility,
          nome_responsavel: item.responsibleName,
          status_restricao: item.restrictionStatus,
          observacao: item.observation,
          observacao_construcao: item.constructionObservation,
          criado_por: item.idUser,
        })),
      });
    });
  }

  async updatePublicationRestriction(
    data: UpdatePublicationRestrictionsDTO,
  ): Promise<void> {
    await this.prisma.restricoes_publicacoes.update({
      where: { id: data.id },
      data: {
        id_restricao: data.idRestriction,
        responsabilidade: data.responsibility,
        nome_responsavel: data.responsibleName,
        status_restricao: data.restrictionStatus,
        data_resolucao: data.resolutionDate,
        observacao_construcao: data.constructionObservation,
        observacao: data.observation,
      },
    });
  }

  async deletePublicationRestriction(id: number): Promise<void> {
    await this.prisma.restricoes_publicacoes.delete({
      where: { id },
    });
  }

  async getRestrictionsAdvancePartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    // Filtro base: exclui REPROVADO e REPROG. PREVISTA — validado contra BI em 05/05/2026
    let where = Prisma.sql`WHERE (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA'))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    // Conta linhas de programação (sem GROUP BY ovnota) para alinhar com resumo-mensal.
    // Regra por linha: sem restrição = restricao_programacao vazia/nula OU status resolvido/concluído.
    const query = Prisma.sql`
      SELECT
        TO_CHAR(data_prog, 'MM/YYYY') AS mes,
        MIN(data_prog) AS data_ref,
        COUNT(*) AS total,
        SUM(CASE
          WHEN restricao_programacao IS NULL OR TRIM(restricao_programacao) = ''
            OR UPPER(TRIM(status_restricao)) IN ('RESOLVIDO','RESOLVIDA','CONCLUIDO','CONCLUIDA','CONCLUÍDO','CONCLUÍDA')
          THEN 1 ELSE 0
        END) AS sem_restricao
      FROM construcao_sp.exportacao_programacoes_obras
      ${where}
      GROUP BY TO_CHAR(data_prog, 'MM/YYYY')
      ORDER BY MIN(data_prog)
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getGripPartner(filters: ProcessedEliminacaoFilters): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    // Usa a view exportacao_programacoes_obras (mesma fonte do BI via Access).
    // Exclui: REPROVADO (admin), REPROG. PREVISTA (execução), "Obra não programada executada" (prog=0).
    let where = Prisma.sql`WHERE
      UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROVADA')
      AND UPPER(TRIM(COALESCE(restricao_execucao, ''))) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA')
      AND prog IS NOT NULL AND prog > 0`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      SELECT
        semana,
        COUNT(*) AS total,
        SUM(CASE WHEN cat = 'executada'         THEN 1 ELSE 0 END) AS executada,
        SUM(CASE WHEN cat = 'executada_parcial' THEN 1 ELSE 0 END) AS executada_parcial,
        SUM(CASE WHEN cat = 'nao_executada'     THEN 1 ELSE 0 END) AS nao_executada,
        SUM(CASE WHEN cat = 'nao_informada'     THEN 1 ELSE 0 END) AS nao_informada
      FROM (
        SELECT
          TO_CHAR((data_prog - EXTRACT(DOW FROM data_prog)::integer), 'DD/MM/YYYY') AS semana,
          data_prog AS data_ref,
          CASE
            WHEN exec IS NULL  THEN 'nao_informada'
            WHEN exec = 0      THEN 'nao_executada'
            WHEN exec < prog   THEN 'executada_parcial'
            ELSE                    'executada'
          END AS cat
        FROM construcao_sp.exportacao_programacoes_obras
        ${where}
      ) sub
      GROUP BY semana
      ORDER BY MIN(data_ref)
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getScheduledWorks(filters: ProcessedEliminacaoFilters): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    let where = Prisma.sql`WHERE (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROGRAMAR'))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      SELECT
        mes,
        COUNT(*) AS total_programadas,
        SUM(CASE WHEN has_exec_restricao = 1 THEN 1 ELSE 0 END) AS com_restricao
      FROM (
        SELECT
          TO_CHAR(data_prog, 'MM/YYYY') AS mes,
          MIN(data_prog) AS data_ref,
          ovnota,
          MAX(CASE
            WHEN restricao_execucao IS NOT NULL AND TRIM(restricao_execucao) != ''
            THEN 1 ELSE 0
          END) AS has_exec_restricao
        FROM construcao_sp.exportacao_programacoes_obras
        ${where}
        GROUP BY TO_CHAR(data_prog, 'MM/YYYY'), ovnota
      ) sub
      GROUP BY mes
      ORDER BY MIN(data_ref)
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getReaschedulingReasons(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    // Motivos = restricao_execucao (razão pela qual a obra não foi executada).
    // Exclui REPROVADO, REPROG. PREVISTA e valores nulos/vazios.
    // JOIN em programacoes + restricoes para obter tipo_restricao (EDP/PARCEIRA/TERCEIRO).
    let baseWhere = Prisma.sql`WHERE
      (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA'))
      AND restricao_execucao IS NOT NULL
      AND TRIM(restricao_execucao) != ''
      AND UPPER(TRIM(restricao_execucao)) NOT IN ('REPROG. PREVISTA', 'REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA')
    `;

    if (dataInicial && dataFinal)
      baseWhere = Prisma.sql`${baseWhere} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      baseWhere = Prisma.sql`${baseWhere} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      baseWhere = Prisma.sql`${baseWhere} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      SELECT ovnota, restricao_execucao AS motivo, NULL::text AS responsavel
      FROM construcao_sp.exportacao_programacoes_obras
      ${baseWhere}
      ORDER BY ovnota
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getSparklinesByPartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<{ aderencia: any[]; eliminacao: any[] }> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    // ── Base WHERE: usa a view exportacao_programacoes_obras (mesma fonte do BI via Access) ──
    // Exclui REPROVADO (status admin), REPROG. PREVISTA (restrição execução) e "Obra não programada executada" (prog = 0).
    let baseWhere = Prisma.sql`WHERE
      UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROVADA')
      AND UPPER(TRIM(COALESCE(restricao_execucao, ''))) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA')
      AND prog IS NOT NULL AND prog > 0`;

    if (dataInicial && dataFinal)
      baseWhere = Prisma.sql`${baseWhere}
        AND data_prog BETWEEN ${dataInicial}::date AND ${dataFinal}::date`;
    if (idRegional?.length)
      baseWhere = Prisma.sql`${baseWhere} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      baseWhere = Prisma.sql`${baseWhere} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    // ── Aderência: agrupado por parceira + domingo da semana (Dom-Sáb = WEEKNUM padrão DAX) ──
    const adQuery = Prisma.sql`
      SELECT
        parceira,
        TO_CHAR((data_prog - EXTRACT(DOW FROM data_prog)::integer), 'DD/MM/YYYY') AS semana,
        MIN(data_prog) AS data_ref,
        COUNT(*) AS total,
        SUM(CASE
          WHEN exec IS NULL  THEN 0
          WHEN exec = 0      THEN 0
          WHEN exec < prog   THEN 0
          ELSE 1
        END) AS executada
      FROM construcao_sp.exportacao_programacoes_obras
      ${baseWhere}
      GROUP BY parceira, (data_prog - EXTRACT(DOW FROM data_prog)::integer)
      ORDER BY parceira, MIN(data_prog)
    `;

    // ── Eliminação: por semana (Dom-Sáb = WEEKNUM padrão DAX) e parceira, dedup por ovnota ──
    const elQuery = Prisma.sql`
      SELECT
        parceira,
        semana,
        MIN(data_ref) AS data_ref,
        COUNT(*) AS total,
        SUM(CASE WHEN has_restricao = 0 THEN 1 ELSE 0 END) AS sem_restricao
      FROM (
        SELECT
          parceira,
          TO_CHAR((data_prog - EXTRACT(DOW FROM data_prog)::integer), 'DD/MM/YYYY') AS semana,
          MIN(data_prog) AS data_ref,
          ovnota,
          MAX(CASE
            WHEN restricao_programacao IS NOT NULL
              AND TRIM(restricao_programacao) != ''
              AND (status_restricao IS NULL
                   OR UPPER(TRIM(status_restricao)) NOT IN ('RESOLVIDO','RESOLVIDA','CONCLUIDO','CONCLUIDA','CONCLUÍDO','CONCLUÍDA'))
            THEN 1 ELSE 0
          END) AS has_restricao
        FROM construcao_sp.exportacao_programacoes_obras
        ${baseWhere}
        GROUP BY parceira, (data_prog - EXTRACT(DOW FROM data_prog)::integer), ovnota
      ) sub
      GROUP BY parceira, semana
      ORDER BY parceira, MIN(data_ref)
    `;

    const [aderencia, eliminacao] = await Promise.all([
      this.prisma.$queryRaw<any[]>(adQuery),
      this.prisma.$queryRaw<any[]>(elQuery),
    ]);

    return { aderencia, eliminacao };
  }

  async getWeeksByPartner(filters: ProcessedEliminacaoFilters): Promise<any[]> {
    const { idRegional, idParceira } = filters;

    // Replica DAX: SEMANA PROGRAMADA = equipes_alocadas / (capacidade_mes * 5) >= 0.7
    // SEMANA PROGRAMADA AJUSTADA = apenas semanas >= semana_atual - 1 (forward-looking)
    let where = Prisma.sql`WHERE data_prog >= DATE_TRUNC('year', CURRENT_DATE)::date
      AND (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA'))`;

    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      WITH semana_equipes AS (
        SELECT
          parceira,
          (data_prog - EXTRACT(DOW FROM data_prog)::integer)::date AS semana_inicio,
          SUM(
            COALESCE(equipe_linha_morta, 0) +
            COALESCE(equipe_linha_viva, 0) +
            COALESCE(equipe_regularizacao, 0)
          ) AS equipes_alocadas
        FROM construcao_sp.exportacao_programacoes_obras
        ${where}
        GROUP BY
          parceira,
          (data_prog - EXTRACT(DOW FROM data_prog)::integer)
      ),
      cap_por_mes AS (
        SELECT
          t.turma AS parceira,
          SUM(COALESCE(ce.jan, 0)) * 5   AS cap_01,
          SUM(COALESCE(ce.fev, 0)) * 5   AS cap_02,
          SUM(COALESCE(ce.mar, 0)) * 5   AS cap_03,
          SUM(COALESCE(ce.abr, 0)) * 5   AS cap_04,
          SUM(COALESCE(ce.mai, 0)) * 5   AS cap_05,
          SUM(COALESCE(ce.jun, 0)) * 5   AS cap_06,
          SUM(COALESCE(ce.jul, 0)) * 5   AS cap_07,
          SUM(COALESCE(ce.ago, 0)) * 5   AS cap_08,
          SUM(COALESCE(ce.set, 0)) * 5   AS cap_09,
          SUM(COALESCE(ce."out", 0)) * 5 AS cap_10,
          SUM(COALESCE(ce.nov, 0)) * 5   AS cap_11,
          SUM(COALESCE(ce.dez, 0)) * 5   AS cap_12
        FROM construcao_sp.capacidade_execucao ce
        JOIN construcao_sp.turmas t ON t.id = ce.id_turma
        WHERE ce.ano = TO_CHAR(CURRENT_DATE, 'YYYY')
        GROUP BY t.turma
      ),
      semana_com_cap AS (
        SELECT
          s.parceira,
          s.semana_inicio,
          s.equipes_alocadas,
          COALESCE(
            CASE EXTRACT(MONTH FROM s.semana_inicio)::integer
              WHEN 1  THEN c.cap_01
              WHEN 2  THEN c.cap_02
              WHEN 3  THEN c.cap_03
              WHEN 4  THEN c.cap_04
              WHEN 5  THEN c.cap_05
              WHEN 6  THEN c.cap_06
              WHEN 7  THEN c.cap_07
              WHEN 8  THEN c.cap_08
              WHEN 9  THEN c.cap_09
              WHEN 10 THEN c.cap_10
              WHEN 11 THEN c.cap_11
              WHEN 12 THEN c.cap_12
            END,
            0
          ) AS equipes_disponiveis
        FROM semana_equipes s
        LEFT JOIN cap_por_mes c ON c.parceira = s.parceira
      )
      SELECT
        parceira,
        COUNT(*) FILTER (
          WHERE
            equipes_disponiveis > 0
            AND equipes_alocadas::float / equipes_disponiveis >= 0.7
            AND semana_inicio >= (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 7)::date
        ) AS semanas
      FROM semana_com_cap
      GROUP BY parceira
      ORDER BY parceira
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getExecutionRestrictions(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    // Obras com restrição de execução ativa (as "com restrição" do gráfico de aderência).
    let baseWhere = Prisma.sql`
      (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROGRAMAR'))
      AND restricao_execucao IS NOT NULL AND TRIM(restricao_execucao) != ''
    `;

    if (dataInicial && dataFinal)
      baseWhere = Prisma.sql`${baseWhere} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      baseWhere = Prisma.sql`${baseWhere} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      baseWhere = Prisma.sql`${baseWhere} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      SELECT DISTINCT ovnota, restricao_execucao AS restricao
      FROM construcao_sp.exportacao_programacoes_obras
      WHERE ${baseWhere}
      ORDER BY ovnota
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }
}
