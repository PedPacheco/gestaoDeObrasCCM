import { Injectable } from '@nestjs/common';
import { IRestrictionsRepository } from 'src/domain/repositories/IRestrictionsRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';
import moment from 'moment';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';

@Injectable()
export class RestrictionsRepository implements IRestrictionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private applyFilters(
    query: Prisma.Sql,
    filters: GetRestrictionsDTO,
    typeRestriction: string,
  ) {
    const {
      dataInicial,
      dataFinal,
      executado,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      idRestricao,
      ovnota,
    } = filters;

    const ini = dataInicial
      ? moment(dataInicial, 'DD/MM/YYYY').toDate()
      : undefined;
    const fim = dataFinal
      ? moment(dataFinal, 'DD/MM/YYYY').toDate()
      : undefined;

    if (ini && fim && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND programacoes.data_prog BETWEEN ${ini} AND ${fim}`;
    }

    if (ini && fim && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND data_conclusao BETWEEN ${ini} AND ${fim}`;
    }

    if (executado && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND restricoes_publicacoes.data_resolucao IS NOT NULL`;
    }

    if (!executado && typeRestriction === 'publication') {
      query = Prisma.sql`${query} AND restricoes_publicacoes.data_resolucao IS NULL`;
    }

    if (executado && typeRestriction === 'schedule') {
      query = Prisma.sql`${query} AND programacoes.exec IS NOT NULL`;
    }

    if (!executado && typeRestriction === 'schedule') {
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
    filters: GetRestrictionsDTO,
  ): Promise<{ works: GetScheduleRestrictions[]; totals: any[] }> {
    const { page } = filters;
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
      await this.prisma.$queryRaw<GetScheduleRestrictions[]>(query),
      await this.prisma.$queryRaw<any[]>(countQuery),
    ]);

    return { works, totals };
  }

  async getPublicationRestricion(
    filters: GetRestrictionsDTO,
  ): Promise<{ works: any[] }> {
    try {
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
        regionais.id as id_regional,
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
    } catch (error) {
      throw error;
    }
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
}
