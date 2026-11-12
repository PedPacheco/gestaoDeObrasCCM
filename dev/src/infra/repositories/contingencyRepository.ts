import { Injectable } from '@nestjs/common';

import moment from 'moment';
import {
  ContingencyInput,
  CountItem,
  GroupByFieldRow,
} from 'src/application/types';
import { IContingencyRepository } from 'src/domain/contracts/IContingencyRepository';
import {
  CapacityByYearMonthResponse,
  ContingencyGroupField,
  EmergencyTeamResponse,
  RecentContingencyResponse,
} from 'src/domain/types';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContingencyRepository implements IContingencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.recursos_contingenciaUncheckedCreateInput,
  ): Promise<void> {
    await this.prisma.recursos_contingencia.create({ data });
  }

  async findRecent(
    filter: ContingencyInput | undefined,
  ): Promise<RecentContingencyResponse[]> {
    return this.prisma.recursos_contingencia.findMany({
      where: this.buildWhere(filter),
      orderBy: { criado_em: 'desc' },
      select: {
        dia_disponibilidade: true,
        novo_tabela_usuarios: { select: { nome: true } },
        turmas: { select: { turma: true } },
      },
    });
  }

  async groupByField(
    field: ContingencyGroupField,
    filter: ContingencyInput = {},
  ): Promise<GroupByFieldRow[]> {
    const result = await this.prisma.recursos_contingencia.findMany({
      where: this.buildWhere(filter),
      select: {
        [field]: true,
        quantidade_mao_obra: true,
        quantidade_equipe: true,
        disponibilizado_csd: true,
      },
    });

    return result
      .filter((row) => row[field] != null)
      .map((row) => ({
        name: row[field] as string,
        laborQuantity: row.quantidade_mao_obra ?? 0,
        teamsQuantity: row.quantidade_equipe ?? 0,
        allocatedCsd: row.disponibilizado_csd ?? 0,
      }));
  }

  async groupByPartner(filter: ContingencyInput = {}): Promise<CountItem[]> {
    const result = await this.prisma.recursos_contingencia.groupBy({
      by: ['id_parceira'],
      where: this.buildWhere(filter),
      _count: { _all: true },
    });

    const ids = result.map((r) => r.id_parceira);

    const turmas = await this.prisma.turmas.findMany({
      where: { id: { in: ids } },
      select: { id: true, turma: true },
    });

    const turmaMap = new Map(turmas.map((t) => [t.id, t.turma]));

    return result.map((row) => ({
      name: turmaMap.get(row.id_parceira) ?? String(row.id_parceira),
      value: row._count._all,
    }));
  }

  async groupByCsd(filter: ContingencyInput = {}): Promise<CountItem[]> {
    const result = await this.prisma.recursos_contingencia.groupBy({
      by: ['disponibilizado_csd'],
      where: this.buildWhere(filter),
      _count: { _all: true },
    });

    return result.map((row) => ({
      name: row['disponibilizado_csd'] as string,
      value: row._count._all,
    }));
  }

  async getCapacityByYearMonth(
    filter: ContingencyInput = {},
    month?: number,
  ): Promise<CapacityByYearMonthResponse[]> {
    let where = Prisma.sql`WHERE 1 = 1`;

    const dataFinal = filter.dataFinal
      ? moment(filter.dataFinal, 'DD/MM/YYYY', true) // parsing estrito
      : null;

    if (dataFinal?.isValid()) {
      where = Prisma.sql`${where} AND ano = ${dataFinal.year().toString()}`;
    }
    if (month) {
      where = Prisma.sql`${where} AND m.mes = ${month}`;
    }
    if (filter.idParceira?.length) {
      where = Prisma.sql`${where} AND t.id IN (${Prisma.join(filter.idParceira)})`;
    }

    return this.prisma.$queryRaw<CapacityByYearMonthResponse[]>(Prisma.sql`
    SELECT ano, m.mes AS mes, SUM(COALESCE(m.valor, 0))::int AS capacidade, SUM(should_cost * COALESCE(m.valor, 0)) AS valor
    FROM construcao_sp.capacidade_execucao ce
    JOIN construcao_sp.turmas t ON t.id = id_turma
    CROSS JOIN LATERAL (VALUES
      (1, jan), (2, fev), (3, mar), (4, abr),
      (5, mai), (6, jun), (7, jul), (8, ago),
      (9, set), (10, "out"), (11, nov), (12, dez)
    ) AS m(mes, valor)
    ${where}
    GROUP BY ano, m.mes
  `);
  }

  async getEmergencyTeamsWithValue(
    filter: ContingencyInput = {},
    month?: number,
  ): Promise<EmergencyTeamResponse[]> {
    const dataFinal = filter.dataFinal
      ? moment.utc(filter.dataFinal, 'DD/MM/YYYY', true)
      : null;

    const ano = dataFinal?.isValid() ? dataFinal.year().toString() : null;
    const idParceiras = filter.idParceira?.length ? filter.idParceira : null;

    return this.prisma.$queryRaw<EmergencyTeamResponse[]>(Prisma.sql`
    WITH equipes AS (
      SELECT
        EXTRACT(YEAR FROM rc.dia_disponibilidade)::int AS ano,
        EXTRACT(MONTH FROM rc.dia_disponibilidade)::int AS mes,
        rc.tipo_recurso_equipe AS tipo,
        rc.id_parceira,
        SUM(rc.quantidade_equipe)::int AS quantidade
      FROM public.recursos_contingencia rc
      WHERE 1 = 1
        ${ano ? Prisma.sql`AND EXTRACT(YEAR FROM rc.dia_disponibilidade)::text = ${ano}` : Prisma.empty}
        ${month ? Prisma.sql`AND EXTRACT(MONTH FROM rc.dia_disponibilidade)::int = ${month}` : Prisma.empty}
        ${idParceiras ? Prisma.sql`AND rc.id_parceira IN (${Prisma.join(idParceiras)})` : Prisma.empty}
      GROUP BY 1, 2, rc.tipo_recurso_equipe, rc.id_parceira
    ),
    valores AS (
      SELECT
        ano::int AS ano,
        tipo,
        id_turma AS id_parceira,
        should_cost / 22 AS valor_diario
      FROM public.capacidade_execucao
      WHERE 1 = 1
        ${ano ? Prisma.sql`AND ano::text = ${ano}` : Prisma.empty}
        ${idParceiras ? Prisma.sql`AND id_turma IN (${Prisma.join(idParceiras)})` : Prisma.empty}
    )
    SELECT
      e.ano,
      e.mes,
      e.tipo,
      SUM(e.quantidade)::int AS quantidade,
      COALESCE(SUM(e.quantidade * v.valor_diario), 0) AS valor
    FROM equipes e
    LEFT JOIN valores v
      ON v.ano = e.ano
      AND v.tipo = e.tipo
      AND v.id_parceira = e.id_parceira
    GROUP BY e.ano, e.mes, e.tipo
    ORDER BY e.ano, e.mes, e.tipo
  `);
  }

  private buildWhere(
    filter: ContingencyInput = {},
  ): Prisma.recursos_contingenciaWhereInput {
    const where: Prisma.recursos_contingenciaWhereInput = {};
    const { csd, dataFinal, dataInicial, equipe, idParceira, maoObra } = filter;

    if (dataInicial || dataFinal) {
      where.dia_disponibilidade = {};
      if (dataInicial) {
        where.dia_disponibilidade.gte = moment
          .utc(dataInicial, 'DD/MM/YYYY')
          .toDate();
      }
      if (dataFinal) {
        where.dia_disponibilidade.lte = moment
          .utc(dataFinal, 'DD/MM/YYYY')
          .toDate();
      }
    }

    if (idParceira?.length) where.id_parceira = { in: idParceira };
    if (maoObra?.length) {
      where.tipo_recurso_mao_obra = { in: maoObra };
    }
    if (equipe?.length) {
      where.tipo_recurso_equipe = { in: equipe };
    }
    if (csd?.length) where.disponibilizado_csd = { in: csd };

    return where;
  }
}
