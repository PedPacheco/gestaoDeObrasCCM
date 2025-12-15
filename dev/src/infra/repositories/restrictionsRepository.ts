import { Injectable } from '@nestjs/common';
import { IRestrictionsRepository } from 'src/domain/repositories/IRestrictionsRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';
import * as moment from 'moment';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
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

    if (idTipo?.length) {
      query = Prisma.sql`${query} AND restricoes.id IN (${Prisma.join(idTipo)})`;
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
  ): Promise<{ works: any[]; totals: any[] }> {
    try {
      const { page } = filters;
      const limit = 200;
      const offset = page * limit;

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
      LEFT JOIN construcao_sp.restricoes_publicacoes
        ON restricoes_publicacoes.id_obra = obras.id
      LEFT JOIN construcao_sp.restricoes
        ON restricoes.id = restricoes_publicacoes.id_restricao
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
        status.status,
        obras.data_conclusao,
        municipios.mun,
        regional,
        tipos.tipo_obra,
        turmas.turma as parceira,
        restricoes.restricao,
        restricoes_publicacoes.responsabilidade,
        restricoes_publicacoes.nome_responsavel,
        restricoes_publicacoes.status_restricao,
        restricoes_publicacoes.data_resolucao
      ${baseQuery}
    `;

      let countQuery = Prisma.sql`SELECT COUNT(*) as total_obras ${baseQuery}`;

      query = this.applyFilters(query, filters, 'publication');
      countQuery = this.applyFilters(countQuery, filters, 'publication');

      query = Prisma.sql`${query} AND data_conclusao IS NOT NULL ORDER BY obras.data_conclusao DESC`;

      query = Prisma.sql`${query} LIMIT ${limit} OFFSET ${offset}`;

      const [works, totals] = await Promise.all([
        await this.prisma.$queryRaw<any[]>(query),
        await this.prisma.$queryRaw<any[]>(countQuery),
      ]);

      return { works, totals };
    } catch (error) {
      throw error;
    }
  }

  async insertPublicationRestriction(
    data: InsertPublicationRestrictionsDTO,
  ): Promise<void> {
    await this.prisma.restricoes_publicacoes.create({
      data: {
        id_obra: data.idWork,
        id_restricao: data.idRestriction,
        responsabilidade: data.responsibility,
        nome_responsavel: data.responsibleName,
        status_restricao: data.restrictionStatus,
      },
    });
  }
}
