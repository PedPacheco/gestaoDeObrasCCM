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

    // Filtro base igual ao da aderência:
    // col AU: excluir REPROVADO/REPROVADA
    // col Z: excluir obras com REPROGRAMAÇÃO PREVISTA
    let where = Prisma.sql`WHERE (status_programacao IS NULL OR UPPER(TRIM(status_programacao)) NOT IN ('REPROVADO', 'REPROVADA'))
      AND (restricao_execucao IS NULL OR UPPER(TRIM(restricao_execucao)) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA'))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    // Regra col AB (restricao_programacao) + col AF (status_restricao):
    // AB null/vazio                              → SEM RESTRIÇÃO
    // AB preenchido + AF resolvido/concluído     → SEM RESTRIÇÃO
    // AB preenchido + AF outro valor ou vazio    → COM RESTRIÇÃO
    const query = Prisma.sql`
      SELECT
        mes,
        COUNT(*) AS total,
        SUM(CASE WHEN has_restricao = 0 THEN 1 ELSE 0 END) AS sem_restricao
      FROM (
        SELECT
          TO_CHAR(data_prog, 'MM/YYYY') AS mes,
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
        ${where}
        GROUP BY TO_CHAR(data_prog, 'MM/YYYY'), ovnota
      ) sub
      GROUP BY mes
      ORDER BY MIN(data_ref)
    `;

    return this.prisma.$queryRaw<any[]>(query);
  }

  async getGripPartner(filters: ProcessedEliminacaoFilters): Promise<any[]> {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    let where = Prisma.sql`WHERE
      (sp.status_programacao IS NULL OR UPPER(TRIM(sp.status_programacao)) NOT IN ('REPROVADO', 'REPROVADA'))
      AND (re.restricao IS NULL OR UPPER(TRIM(re.restricao)) NOT IN ('REPROGRAMAÇÃO PREVISTA', 'REPROGRAMACAO PREVISTA', 'REPROG. PREVISTA'))`;

    if (dataInicial && dataFinal)
      where = Prisma.sql`${where} AND p.data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      where = Prisma.sql`${where} AND r.id IN (${Prisma.join(idRegional)})`;
    if (idParceira?.length)
      where = Prisma.sql`${where} AND t.id IN (${Prisma.join(idParceira)})`;

    // Categorias via comparação prog (col P) vs exec (col Q) — por linha de programacao:
    // - exec IS NULL       → nao_informada
    // - exec = 0           → nao_executada
    // - exec < prog        → executada_parcial  (implicitamente exec > 0)
    // - exec >= prog       → executada
    // Sem GROUP BY ovnota: uma obra com 2 programacoes na mesma semana conta como 2 linhas.
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
          TO_CHAR(p.data_prog, 'IW') || '/' || TO_CHAR(p.data_prog, 'IYYY') AS semana,
          p.data_prog AS data_ref,
          CASE
            WHEN p.exec IS NULL  THEN 'nao_informada'
            WHEN p.exec = 0      THEN 'nao_executada'
            WHEN p.exec < p.prog THEN 'executada_parcial'
            ELSE                      'executada'
          END AS cat
        FROM construcao_sp.programacoes p
        JOIN construcao_sp.obras o ON o.id = p.id_obra
        JOIN construcao_sp.turmas t ON t.id = o.id_turma
        JOIN construcao_sp.municipios m ON m.id = o.id_gpm
        JOIN construcao_sp.regionais r ON r.id = m.id_regional
        LEFT JOIN construcao_sp.status_programacao sp ON sp.id = p.id_status_programacao
        LEFT JOIN construcao_sp.restricoes re ON re.id = p.id_restricao_execucao
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

    // Motivos de reprogramação = obras em status 'REPROGRAMAR' (excluídas dos KPIs).
    // Mostra ovnota + motivo (restricao_programacao) de cada obra reprogramada.
    let baseWhere = Prisma.sql`
      status_programacao IS NOT NULL AND status_programacao IN ('Parcial', 'Cancelado')
    `;

    if (dataInicial && dataFinal)
      baseWhere = Prisma.sql`${baseWhere} AND data_prog BETWEEN ${dataInicial} AND ${dataFinal}`;
    if (idRegional?.length)
      baseWhere = Prisma.sql`${baseWhere} AND regional IN (SELECT regional FROM construcao_sp.regionais WHERE id IN (${Prisma.join(idRegional)}))`;
    if (idParceira?.length)
      baseWhere = Prisma.sql`${baseWhere} AND parceira IN (SELECT turma FROM construcao_sp.turmas WHERE id IN (${Prisma.join(idParceira)}))`;

    const query = Prisma.sql`
      SELECT ovnota, motivo
      FROM (
        SELECT ovnota, restricao_programacao AS motivo
        FROM construcao_sp.exportacao_programacoes_obras
        WHERE ${baseWhere}
          AND restricao_programacao IS NOT NULL AND TRIM(restricao_programacao) != ''

        UNION ALL

        SELECT ovnota, restricao_programacao2 AS motivo
        FROM construcao_sp.exportacao_programacoes_obras
        WHERE ${baseWhere}
          AND restricao_programacao2 IS NOT NULL AND TRIM(restricao_programacao2) != ''
      ) AS motivos
      ORDER BY ovnota
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
