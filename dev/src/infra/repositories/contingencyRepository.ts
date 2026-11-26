import { Injectable, Logger } from '@nestjs/common';
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
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';

import { toRepositoryError } from '../errors/prismaError.handler';
import { RepositoryError } from '../errors/repository.error';
import { Prisma } from '../generated/prisma/client';
import {
  GROUP_FIELD_COLUMN,
  toCapacityByYearMonth,
  toContingencyGroupItem,
  toContingencyResourceDispatchesRow,
  toCreateContingencyInput,
  toCsdQuantityItem,
  toEmergencyTeam,
  toPartnerQuantityItems,
  toRecentContingency,
} from '../mappers/contingencyResources.mapper';
import { PrismaService } from '../prisma/prisma.service';
import {
  CapacityByYearMonthRow,
  CSD_QUANTITY_SELECT,
  EmergencyTeamRow,
  FIND_CONTINGENCY_RESOURCE_DISPATCHES_SELECT,
  GROUP_BY_FIELD_SELECT,
  PARTNER_NAME_SELECT,
  PARTNER_QUANTITY_SELECT,
  RECENT_CONTINGENCY_SELECT,
} from '../types';

@Injectable()
export class ContingencyRepository implements IContingencyRepository {
  private readonly logger = new Logger(ContingencyRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContingencyData): Promise<void> {
    await this.execute(
      'create',
      async () => {
        await this.prisma.recursos_contingencia.create({
          data: toCreateContingencyInput(data),
        });
      },
      { idParceira: data?.['idParceira'], idUsuario: data?.['idUsuario'] },
    );
  }

  async findRecent(
    filter: ContingencyFilter = {},
  ): Promise<RecentContingency[]> {
    return this.execute(
      'findRecent',
      async () => {
        const rows = await this.prisma.recursos_contingencia.findMany({
          where: this.buildWhere(filter),
          orderBy: { criado_em: 'desc' },
          select: RECENT_CONTINGENCY_SELECT,
        });
        return rows.map(toRecentContingency);
      },
      filter,
    );
  }

  async groupByField(
    field: ContingencyGroupField,
    filter: ContingencyFilter = {},
  ): Promise<ContingencyGroupItem[]> {
    return this.execute(
      'groupByField',
      async () => {
        const column = GROUP_FIELD_COLUMN[field];
        if (!column) {
          throw new RepositoryError(
            `Campo de agrupamento inválido: ${field}`,
            'INVALID_DATA',
            'groupByField',
          );
        }

        const rows = await this.prisma.recursos_contingencia.findMany({
          where: this.buildWhere(filter),
          select: GROUP_BY_FIELD_SELECT,
        });
        return rows.flatMap((row) => toContingencyGroupItem(row, column) ?? []);
      },
      { field, ...filter },
    );
  }

  /** Um item por registo, com o nome da parceira. A soma é feita no use case. */
  async groupByPartner(
    filter: ContingencyFilter = {},
  ): Promise<ContingencyGroupItem[]> {
    return this.execute(
      'groupByPartner',
      async () => {
        const rows = await this.prisma.recursos_contingencia.findMany({
          where: this.buildWhere(filter),
          select: PARTNER_QUANTITY_SELECT,
        });
        if (!rows.length) return [];

        const partnerIds = [...new Set(rows.map((r) => r.id_parceira))];
        const partners = await this.prisma.turmas.findMany({
          where: { id: { in: partnerIds } },
          select: PARTNER_NAME_SELECT,
        });

        return toPartnerQuantityItems(rows, partners);
      },
      filter,
    );
  }

  /** Um item por registo, com o valor do CSD. A soma é feita no use case. */
  async groupByCsd(
    filter: ContingencyFilter = {},
  ): Promise<ContingencyGroupItem[]> {
    return this.execute(
      'groupByCsd',
      async () => {
        const rows = await this.prisma.recursos_contingencia.findMany({
          where: this.buildWhere(filter),
          select: CSD_QUANTITY_SELECT,
        });
        return rows.map(toCsdQuantityItem);
      },
      filter,
    );
  }

  async getCapacityByYearMonth(
    filter: ContingencyFilter = {},
  ): Promise<CapacityByYearMonth[]> {
    return this.execute(
      'getCapacityByYearMonth',
      async () => {
        const { start, endExclusive } = this.resolvePeriod(filter);
        const conditions: Prisma.Sql[] = [];

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
          conditions.push(
            Prisma.sql`t.id IN (${Prisma.join(filter.idParceira)})`,
          );
        }

        const rows = await this.prisma.$queryRaw<CapacityByYearMonthRow[]>(
          Prisma.sql`
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
          `,
        );

        return rows.map(toCapacityByYearMonth);
      },
      filter,
    );
  }

  async getEmergencyTeamsWithValue(
    filter: ContingencyFilter = {},
  ): Promise<EmergencyTeam[]> {
    return this.execute(
      'getEmergencyTeamsWithValue',
      async () => {
        const { start, endExclusive, startYear, endYear } =
          this.resolvePeriod(filter);
        const idParceiras = filter.idParceira?.length
          ? filter.idParceira
          : null;
        const teams = filter.equipe?.length ? filter.equipe : null;
        const csds = filter.csd?.length ? filter.csd : null;

        const teamConditions: Prisma.Sql[] = [];
        if (start)
          teamConditions.push(
            Prisma.sql`rc.dia_disponibilidade >= ${start}::date`,
          );
        if (endExclusive)
          teamConditions.push(
            Prisma.sql`rc.dia_disponibilidade < ${endExclusive}::date`,
          );
        if (idParceiras)
          teamConditions.push(
            Prisma.sql`rc.id_parceira IN (${Prisma.join(idParceiras)})`,
          );
        if (teams)
          teamConditions.push(
            Prisma.sql`rc.tipo_recurso_equipe IN (${Prisma.join(teams)})`,
          );
        if (csds)
          teamConditions.push(
            Prisma.sql`rc.disponibilizado_csd IN (${Prisma.join(csds)})`,
          );

        const valueConditions: Prisma.Sql[] = [];
        if (startYear)
          valueConditions.push(Prisma.sql`ano::int >= ${startYear}`);
        if (endYear) valueConditions.push(Prisma.sql`ano::int <= ${endYear}`);
        if (idParceiras)
          valueConditions.push(
            Prisma.sql`id_turma IN (${Prisma.join(idParceiras)})`,
          );
        if (teams)
          valueConditions.push(Prisma.sql`tipo IN (${Prisma.join(teams)})`);

        const rows = await this.prisma.$queryRaw<EmergencyTeamRow[]>(Prisma.sql`
          WITH equipes AS (
            SELECT
              EXTRACT(YEAR FROM rc.dia_disponibilidade)::int AS ano,
              EXTRACT(MONTH FROM rc.dia_disponibilidade)::int AS mes,
              rc.tipo_recurso_equipe AS tipo,
              rc.id_parceira,
              rc.disponibilizado_csd,
              SUM(rc.quantidade_equipe)::int AS quantidade
            FROM public.recursos_contingencia rc
            ${this.toWhere(teamConditions)}
            GROUP BY 1, 2, rc.tipo_recurso_equipe, rc.id_parceira, rc.disponibilizado_csd
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
            e.disponibilizado_csd,
            SUM(e.quantidade)::int AS quantidade,
            COALESCE(SUM(e.quantidade * v.valor_diario), 0)::float8 AS valor
          FROM equipes e
          LEFT JOIN valores v
            ON v.ano = e.ano
            AND v.tipo = e.tipo
            AND v.id_parceira = e.id_parceira
          GROUP BY e.ano, e.mes, e.tipo, e.disponibilizado_csd
          ORDER BY e.ano, e.mes, e.tipo
        `);

        return rows.map(toEmergencyTeam);
      },
      filter,
    );
  }

  async findContingencyResourceDispatches(filter: ContingencyFilter = {}) {
    return this.execute(
      'findContingencyResourceDispatches',
      async () => {
        const rows = await this.prisma.recursos_contingencia.findMany({
          where: this.buildWhere(filter),
          select: FIND_CONTINGENCY_RESOURCE_DISPATCHES_SELECT,
        });
        return rows.map(toContingencyResourceDispatchesRow);
      },
      filter,
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Executa a operação, regista o erro e lança-o já convertido
   * em RepositoryError.
   */
  private async execute<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: unknown,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const repoError = toRepositoryError(error, operation);
      const ctx = context ? ` | contexto: ${this.safeStringify(context)}` : '';

      const log =
        repoError.code === 'INVALID_DATA' || repoError.code === 'NOT_FOUND'
          ? this.logger.warn.bind(this.logger)
          : this.logger.error.bind(this.logger);

      log(
        `[${operation}] ${repoError.code}: ${repoError.message}${ctx}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw repoError;
    }
  }

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
    if (maoObra?.length) where.tipo_recurso_mao_obra = { in: maoObra };
    if (equipe?.length) where.tipo_recurso_equipe = { in: equipe };
    if (csd?.length) where.disponibilizado_csd = { in: csd };

    return where;
  }

  private resolvePeriod({
    mesInicial,
    mesFinal,
  }: ContingencyFilter = {}): MonthPeriod {
    const parse = (value: string | undefined, field: string) => {
      if (!value) return null;
      const month = moment.utc(value, 'YYYY-MM', true);
      if (!month.isValid()) {
        throw new RepositoryError(
          `${field} inválido: "${value}". Formato esperado: YYYY-MM.`,
          'INVALID_DATA',
          'resolvePeriod',
        );
      }
      return month.startOf('month');
    };

    const start = parse(mesInicial, 'mesInicial');
    const end = parse(mesFinal, 'mesFinal');

    if (start && end && start.isAfter(end)) {
      throw new RepositoryError(
        'mesInicial não pode ser posterior a mesFinal.',
        'INVALID_DATA',
        'resolvePeriod',
      );
    }

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

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[contexto não serializável]';
    }
  }
}
