import {
  CapacidadePorAnoMesRow,
  ContingencyAggregateSums,
  ContingencyGroupField,
  DashboardFilter,
  IContingencyRepository,
  NamedCount,
  RecentContingencyRow,
} from 'src/domain/repositories/IContingencyRepository';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContingencyRepository implements IContingencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.recursos_contingenciaUncheckedCreateInput,
  ): Promise<void> {
    await this.prisma.recursos_contingencia.create({ data });
  }

  async count(filter?: DashboardFilter): Promise<number> {
    return this.prisma.recursos_contingencia.count({
      where: this.buildWhere(filter),
    });
  }

  async aggregateSums(
    filter?: DashboardFilter,
  ): Promise<ContingencyAggregateSums> {
    const result = await this.prisma.recursos_contingencia.aggregate({
      where: this.buildWhere(filter),
      _sum: { quantidade_mao_obra: true, quantidade_equipe: true },
      _min: { dia_disponibilidade: true },
      _max: { dia_disponibilidade: true },
    });

    return {
      totalMaoObra: result._sum.quantidade_mao_obra ?? 0,
      totalEquipe: result._sum.quantidade_equipe ?? 0,
      minDate: result._min.dia_disponibilidade,
      maxDate: result._max.dia_disponibilidade,
    };
  }

  async findRecent(
    filter: DashboardFilter | undefined,
    take: number,
  ): Promise<RecentContingencyRow[]> {
    return this.prisma.recursos_contingencia.findMany({
      where: this.buildWhere(filter),
      orderBy: { criado_em: 'desc' },
      take,
      select: {
        dia_disponibilidade: true,
        usuario: { select: { nome: true } },
        turmas: { select: { turma: true } },
      },
    });
  }

  async groupByField(
    field: ContingencyGroupField,
    filter?: DashboardFilter,
  ): Promise<NamedCount[]> {
    const result = await this.prisma.recursos_contingencia.groupBy({
      by: [field],
      where: this.buildWhere(filter),
      _count: { _all: true },
    });

    return result.map((row) => ({
      name: row[field] as string,
      value: row._count._all,
    }));
  }

  async groupByParceira(filter?: DashboardFilter): Promise<NamedCount[]> {
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

  async getCapacidadePorAnoMes(
    anos: string[],
    turmas: number[],
  ): Promise<CapacidadePorAnoMesRow[]> {
    if (!anos.length || !turmas.length) return [];

    return this.prisma.$queryRaw<CapacidadePorAnoMesRow[]>(Prisma.sql`
      SELECT ce.ano AS ano, m.mes AS mes, SUM(COALESCE(m.valor, 0))::int AS capacidade
      FROM construcao_sp.capacidade_execucao ce
      JOIN construcao_sp.turmas t ON t.id = ce.id_turma
      CROSS JOIN LATERAL (VALUES
        (1, ce.jan), (2, ce.fev), (3, ce.mar), (4, ce.abr),
        (5, ce.mai), (6, ce.jun), (7, ce.jul), (8, ce.ago),
        (9, ce.set), (10, ce."out"), (11, ce.nov), (12, ce.dez)
      ) AS m(mes, valor)
      WHERE ce.ano IN (${Prisma.join(anos)})
        AND t.id IN (${Prisma.join(turmas)})
      GROUP BY ce.ano, m.mes
    `);
  }

  private buildWhere(
    filter?: DashboardFilter,
  ): Prisma.recursos_contingenciaWhereInput {
    const where: Prisma.recursos_contingenciaWhereInput = {};

    if (filter?.dataInicial || filter?.dataFinal) {
      where.dia_disponibilidade = {};
      if (filter.dataInicial) {
        where.dia_disponibilidade.gte = new Date(filter.dataInicial);
      }
      if (filter.dataFinal) {
        where.dia_disponibilidade.lte = new Date(filter.dataFinal);
      }
    }

    if (filter?.idParceira?.length)
      where.id_parceira = { in: filter.idParceira };
    if (filter?.maoObra?.length) {
      where.tipo_recurso_mao_obra = { in: filter.maoObra };
    }
    if (filter?.equipe?.length) {
      where.tipo_recurso_equipe = { in: filter.equipe };
    }
    if (filter?.csd?.length) where.disponibilizado_csd = { in: filter.csd };

    return where;
  }
}
