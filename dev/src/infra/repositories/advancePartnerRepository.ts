import {
  IAdvancePartnerRepository,
  ProcessedEliminacaoFilters,
} from 'src/domain/contracts/IAdvancePartnerRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdvancePartnerRepository implements IAdvancePartnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly excludedPartners = [1, 6, 10, 11, 14, 15, 16];

  async getRestrictionsAdvancePartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira, responsabilidade } =
      filters;

    // Filtro base: exclui REPROVADO e REPROG. PREVISTA — validado contra BI em 05/05/2026
    let where = Prisma.sql`WHERE 
    (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA')) 
    AND parceira NOT IN (SELECT turmaFROM construcao_sp.turmasWHERE id IN (${Prisma.join(this.excludedPartners)}))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;
    if (responsabilidade)
      where = Prisma.sql`${where} AND nome_do_responsavel_execucao = ${responsabilidade}`;

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
    const { dataInicial, dataFinal, idRegional, idParceira, responsabilidade } =
      filters;

    // Usa a view exportacao_programacoes_obras (mesma fonte do BI via Access).
    // Exclui: REPROVADO (admin), REPROG. PREVISTA (execução), "Obra não programada executada" (prog=0).
    let where = Prisma.sql`WHERE
      UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROVADA')
      AND UPPER(TRIM(COALESCE(restricao_execucao, ''))) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA')
      AND prog IS NOT NULL AND prog > 0 AND parceira NOT IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(this.excludedPartners)}))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;
    if (responsabilidade)
      where = Prisma.sql`${where} AND nome_do_responsavel_execucao = ${responsabilidade}`;

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

  async getReaschedulingReasons(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira, responsabilidade } =
      filters;

    // Motivos = restricao_execucao (razão pela qual a obra não foi executada).
    // Exclui REPROVADO, REPROG. PREVISTA e valores nulos/vazios.
    // JOIN em programacoes + restricoes para obter tipo_restricao (EDP/PARCEIRA/TERCEIRO).
    let where = Prisma.sql`WHERE
      (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA'))
      AND restricao_execucao IS NOT NULL
      AND TRIM(restricao_execucao) != ''
      AND UPPER(TRIM(restricao_execucao)) NOT IN ('REPROG. PREVISTA', 'REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA')
      AND parceira NOT IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(this.excludedPartners)}))
    `;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;
    if (responsabilidade)
      where = Prisma.sql`${where} AND nome_do_responsavel_execucao = ${responsabilidade}`;

    const query = Prisma.sql`
      SELECT ovnota, restricao_execucao AS motivo, observacao_execucao, data_prog, id_obra,
      nome_do_responsavel_execucao AS responsavel, mo_planejada * (GREATEST(prog - COALESCE(exec, 0), 0)::numeric / 100) AS mo_nao_executada
      FROM construcao_sp.exportacao_programacoes_obras
      ${where}
      ORDER BY ovnota
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getSparklinesByPartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<{ aderencia: any[]; eliminacao: any[] }> {
    const { dataInicial, dataFinal, idRegional, idParceira, responsabilidade } =
      filters;

    // ── Base WHERE: usa a view exportacao_programacoes_obras (mesma fonte do BI via Access) ──
    // Exclui REPROVADO (status admin), REPROG. PREVISTA (restrição execução) e "Obra não programada executada" (prog = 0).
    let where = Prisma.sql`WHERE
      UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROVADA')
      AND UPPER(TRIM(COALESCE(restricao_execucao, ''))) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA')
      AND prog IS NOT NULL AND prog > 0 AND parceira NOT IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(this.excludedPartners)}))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where}
        AND data_prog BETWEEN ${dataInicial}::date AND ${dataFinal}::date`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;
    if (responsabilidade)
      where = Prisma.sql`${where} AND nome_do_responsavel_execucao = ${responsabilidade}`;

    // ── Aderência: agrupado por parceira + domingo da semana (Dom-Sáb = WEEKNUM padrão DAX) ──
    const adQuery = Prisma.sql`
      SELECT
        parceira,
        TO_CHAR((data_prog - EXTRACT(DOW FROM data_prog)::integer), 'DD/MM/YYYY') AS semana,
        COUNT(*) AS total,
        SUM(CASE
          WHEN exec IS NULL  THEN 0
          WHEN exec = 0      THEN 0
          WHEN exec < prog   THEN 0
          ELSE 1
        END) AS executada
      FROM construcao_sp.exportacao_programacoes_obras
      ${where}
      GROUP BY parceira, (data_prog - EXTRACT(DOW FROM data_prog)::integer)
      ORDER BY parceira
    `;

    // ── Eliminação: por semana (Dom-Sáb = WEEKNUM padrão DAX) e parceira, dedup por ovnota ──
    const elQuery = Prisma.sql`
      SELECT
        parceira,
        semana,
        COUNT(*) AS total,
        SUM(CASE WHEN has_restricao = 0 THEN 1 ELSE 0 END) AS sem_restricao
      FROM (
        SELECT
          parceira,
          TO_CHAR((data_prog - EXTRACT(DOW FROM data_prog)::integer), 'DD/MM/YYYY') AS semana,
          ovnota,
          MAX(CASE
            WHEN restricao_programacao IS NOT NULL
              AND TRIM(restricao_programacao) != ''
              AND (status_restricao IS NULL
                   OR UPPER(TRIM(status_restricao)) NOT IN ('RESOLVIDO','RESOLVIDA','CONCLUIDO','CONCLUIDA','CONCLUÍDO','CONCLUÍDA'))
            THEN 1 ELSE 0
          END) AS has_restricao
        FROM construcao_sp.exportacao_programacoes_obras
        ${where}
        GROUP BY parceira, (data_prog - EXTRACT(DOW FROM data_prog)::integer), ovnota
      ) sub
      GROUP BY parceira, semana
      ORDER BY parceira
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
      AND (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROG. PREVISTA'))
      AND parceira NOT IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(this.excludedPartners)}))`;

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
            AND semana_inicio >= (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer)::date
        ) + 1 AS semanas
      FROM semana_com_cap
      GROUP BY parceira
      ORDER BY parceira
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }
}
