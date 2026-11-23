import { Injectable } from '@nestjs/common';

import moment from 'moment';

import {
  IContingencyRepository,
  MonthPeriod,
} from 'src/domain/contracts/IContingencyRepository';

import {
  CapacityByYearMonth,
  ContingencyFilter,
  ContingencyGroupField,
  ContingencyGroupItem,
  CountItem,
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import { Prisma } from '../generated/prisma/client';
import {
  GROUP_FIELD_COLUMN,
  toCapacityByYearMonth,
  toContingencyGroupItem,
  toCreateContingencyInput,
  toCsdCountItem,
  toEmergencyTeam,
  toPartnerCountItems,
  toRecentContingency,
} from '../mappers/contingencyResources.mapper';
import { PrismaService } from '../prisma/prisma.service';
import {
  CapacityByYearMonthRow,
  EmergencyTeamRow,
  GROUP_BY_FIELD_SELECT,
  PARTNER_NAME_SELECT,
  RECENT_CONTINGENCY_SELECT,
} from '../types';

@Injectable()
export class ContingencyRepository implements IContingencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContingencyData): Promise<void> {
    console.log(toCreateContingencyInput(data));
    await this.prisma.recursos_contingencia.create({
      data: toCreateContingencyInput(data),
    });
  }

  async findRecent(
    filter: ContingencyFilter = {},
  ): Promise<RecentContingency[]> {
    const rows = await this.prisma.recursos_contingencia.findMany({
      where: this.buildWhere(filter),
      orderBy: { criado_em: 'desc' },
      select: RECENT_CONTINGENCY_SELECT,
    });

    return rows.map(toRecentContingency);
  }

  async groupByField(
    field: ContingencyGroupField,
    filter: ContingencyFilter = {},
  ): Promise<ContingencyGroupItem[]> {
    const column = GROUP_FIELD_COLUMN[field];

    const rows = await this.prisma.recursos_contingencia.findMany({
      where: this.buildWhere(filter),
      select: GROUP_BY_FIELD_SELECT,
    });

    return rows.flatMap((row) => toContingencyGroupItem(row, column) ?? []);
  }

  async groupByPartner(filter: ContingencyFilter = {}): Promise<CountItem[]> {
    const groups = await this.prisma.recursos_contingencia.groupBy({
      by: ['id_parceira'],
      where: this.buildWhere(filter),
      _count: { _all: true },
    });

    if (!groups.length) return [];

    const partners = await this.prisma.turmas.findMany({
      where: { id: { in: groups.map((g) => g.id_parceira) } },
      select: PARTNER_NAME_SELECT,
    });

    return toPartnerCountItems(groups, partners);
  }

  async groupByCsd(filter: ContingencyFilter = {}): Promise<CountItem[]> {
    const groups = await this.prisma.recursos_contingencia.groupBy({
      by: ['disponibilizado_csd'],
      where: this.buildWhere(filter),
      _count: { _all: true },
    });

    return groups.map(toCsdCountItem);
  }

  async getCapacityByYearMonth(
    filter: ContingencyFilter = {},
  ): Promise<CapacityByYearMonth[]> {
    const { start, endExclusive } = this.resolvePeriod(filter);
    const conditions: Prisma.Sql[] = [];

    // Compara o 1.º dia de cada mês da capacidade com o período pedido
    if (start) {
      conditions.push(
        Prisma.sql`make_date(ce.ano::int, m.mes, 1) >= ${start}::date`,
      );
    }
    if (endExclusive) {
      conditions.push(
        Prisma.sql`make_date(ce.ano::int, m.mes, 1) < ${endExclusive}::date`,
      );
    }
    if (filter.idParceira?.length) {
      conditions.push(Prisma.sql`t.id IN (${Prisma.join(filter.idParceira)})`);
    }

    const rows = await this.prisma.$queryRaw<
      CapacityByYearMonthRow[]
    >(Prisma.sql`
      SELECT
        ce.ano,
        m.mes AS mes,
        SUM(COALESCE(m.valor, 0))::int AS capacidade,
        SUM(ce.should_cost * COALESCE(m.valor, 0))::float8 AS valor
      FROM public.capacidade_execucao ce
      JOIN public.turmas t ON t.id = ce.id_turma
      CROSS JOIN LATERAL (VALUES
        (1, jan), (2, fev), (3, mar), (4, abr),
        (5, mai), (6, jun), (7, jul), (8, ago),
        (9, set), (10, "out"), (11, nov), (12, dez)
      ) AS m(mes, valor)
      ${this.toWhere(conditions)}
      GROUP BY ce.ano, m.mes
      ORDER BY ce.ano, m.mes
    `);

    return rows.map(toCapacityByYearMonth);
  }

  async getEmergencyTeamsWithValue(
    filter: ContingencyFilter = {},
  ): Promise<EmergencyTeam[]> {
    const { start, endExclusive, startYear, endYear } =
      this.resolvePeriod(filter);
    const idParceiras = filter.idParceira?.length ? filter.idParceira : null;

    const teamConditions: Prisma.Sql[] = [];
    if (start)
      teamConditions.push(Prisma.sql`rc.dia_disponibilidade >= ${start}::date`);
    if (endExclusive)
      teamConditions.push(
        Prisma.sql`rc.dia_disponibilidade < ${endExclusive}::date`,
      );
    if (idParceiras)
      teamConditions.push(
        Prisma.sql`rc.id_parceira IN (${Prisma.join(idParceiras)})`,
      );

    const valueConditions: Prisma.Sql[] = [];
    if (startYear) valueConditions.push(Prisma.sql`ano::int >= ${startYear}`);
    if (endYear) valueConditions.push(Prisma.sql`ano::int <= ${endYear}`);
    if (idParceiras)
      valueConditions.push(
        Prisma.sql`id_turma IN (${Prisma.join(idParceiras)})`,
      );

    const rows = await this.prisma.$queryRaw<EmergencyTeamRow[]>(Prisma.sql`
      WITH equipes AS (
        SELECT
          EXTRACT(YEAR FROM rc.dia_disponibilidade)::int AS ano,
          EXTRACT(MONTH FROM rc.dia_disponibilidade)::int AS mes,
          rc.tipo_recurso_equipe AS tipo,
          rc.id_parceira,
          SUM(rc.quantidade_equipe)::int AS quantidade
        FROM public.recursos_contingencia rc
        ${this.toWhere(teamConditions)}
        GROUP BY 1, 2, rc.tipo_recurso_equipe, rc.id_parceira
      ),
      valores AS (
        SELECT
          ano::int AS ano,
          tipo,
          id_turma AS id_parceira,
          should_cost / 22 AS valor_diario
        FROM public.capacidade_execucao
        ${this.toWhere(valueConditions)}
      )
      SELECT
        e.ano,
        e.mes,
        e.tipo,
        SUM(e.quantidade)::int AS quantidade,
        COALESCE(SUM(e.quantidade * v.valor_diario), 0)::float8 AS valor
      FROM equipes e
      LEFT JOIN valores v
        ON v.ano = e.ano
        AND v.tipo = e.tipo
        AND v.id_parceira = e.id_parceira
      GROUP BY e.ano, e.mes, e.tipo
      ORDER BY e.ano, e.mes, e.tipo
    `);

    return rows.map(toEmergencyTeam);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private buildWhere(
    filter: ContingencyFilter = {},
  ): Prisma.recursos_contingenciaWhereInput {
    const where: Prisma.recursos_contingenciaWhereInput = {};
    const { csd, equipe, idParceira, maoObra } = filter;

    const { start, endExclusive } = this.resolvePeriod(filter);

    if (start || endExclusive) {
      where.dia_disponibilidade = {
        ...(start && { gte: new Date(start) }),
        ...(endExclusive && { lt: new Date(endExclusive) }),
      };
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

  private resolvePeriod({
    mesInicial,
    mesFinal,
  }: ContingencyFilter = {}): MonthPeriod {
    const parse = (value?: string) => {
      if (!value) return null;
      const month = moment.utc(value, 'YYYY-MM', true);
      return month.isValid() ? month.startOf('month') : null;
    };

    const start = parse(mesInicial);
    const end = parse(mesFinal);

    return {
      start: start?.format('YYYY-MM-DD') ?? null,
      endExclusive: end
        ? end.clone().add(1, 'month').format('YYYY-MM-DD')
        : null,
      startYear: start?.year() ?? null,
      endYear: end?.year() ?? null,
    };
  }

  private toWhere(conditions: Prisma.Sql[]): Prisma.Sql {
    return conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;
  }
}
