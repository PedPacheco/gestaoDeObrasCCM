import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IDashboardRepository } from 'src/domain/contracts/IDashboardRepository';
import {
  findMonthlyTrendResponse,
  FindPartnerStatus,
  FindRecentWorks,
  FindTopPartners,
  FindWorksByRegional,
  FindWorksByStatus,
} from 'src/domain/types';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';
import { DashboardFiltersBuilder } from 'src/utils/dashboardFilters.builder';

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countTotalWorks(filters: DashboardFiltersDTO): Promise<number> {
    return await this.prisma.obras.count({
      where: DashboardFiltersBuilder.buildObrasWhere(filters),
    });
  }

  async countConcludedThisMonth(filters: DashboardFiltersDTO): Promise<number> {
    return await this.prisma.obras.count({
      where: {
        ...DashboardFiltersBuilder.buildObrasWhere(filters, 'data_conclusao'),
      },
    });
  }

  async countWithoutSchedule(filters: DashboardFiltersDTO): Promise<number> {
    return await this.prisma.obras.count({
      where: {
        ...DashboardFiltersBuilder.buildObrasWhere(filters),
        programacoes: {
          none: {},
        },
      },
    });
  }

  async countTotalConcluded(filters: DashboardFiltersDTO): Promise<number> {
    return await this.prisma.obras.count({
      where: {
        ...DashboardFiltersBuilder.buildObrasWhere(filters, 'data_conclusao'),
        data_conclusao: {
          not: null,
        },
      },
    });
  }

  async countPortfolio(filters: DashboardFiltersDTO): Promise<number> {
    const result = await this.prisma.obras.aggregate({
      where: {
        ...DashboardFiltersBuilder.buildObrasWhere(filters),
        programacoes: {
          none: {},
        },
      },
      _sum: {
        mo_pend: true,
      },
    });

    return Number(result._sum.mo_pend ?? 0);
  }

  async countExecutedValue(filters: DashboardFiltersDTO): Promise<number> {
    const result = await this.prisma.obras.aggregate({
      where: DashboardFiltersBuilder.buildObrasWhere(filters),
      _sum: {
        mo_planejada: true,
      },
    });

    return Number(result._sum.mo_planejada ?? 0);
  }

  async findWorksByStatus(
    filters: DashboardFiltersDTO,
  ): Promise<FindWorksByStatus[]> {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(filters);

    return await this.prisma.$queryRaw<
      { status: string; count: number }[]
    >(Prisma.sql`
        SELECT
          s.status,
          COUNT(o.id)::int AS count
        FROM construcao_sp.obras o
        JOIN construcao_sp.status s
          ON o.id_status = s.id
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        WHERE 1=1
        ${whereFilters}
        GROUP BY s.id, s.status
        ORDER BY count DESC
      `);
  }

  async findWorksByRegional(filters: DashboardFiltersDTO) {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(filters);

    return await this.prisma.$queryRaw<FindWorksByRegional[]>(Prisma.sql`
        SELECT
          r.regional,
          COUNT(o.id)::int AS total,
          SUM(
            CASE
              WHEN o.data_conclusao IS NOT NULL
                THEN 1
              ELSE 0
            END
          )::int AS concluded
        FROM construcao_sp.obras o
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        JOIN construcao_sp.regionais r
          ON m.id_regional = r.id
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        WHERE 1=1
        ${whereFilters}
        GROUP BY r.id, r.regional
        ORDER BY total DESC
      `);
  }

  async findMonthlyTrend(filters: DashboardFiltersDTO) {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(
      filters,
      'o.entrada',
    );

    return await this.prisma.$queryRaw<findMonthlyTrendResponse[]>(Prisma.sql`
        SELECT
          TO_CHAR(
            DATE_TRUNC('month', o.entrada),
            'YYYY-MM'
          ) AS month,
          COUNT(*)::int AS entered,
          SUM(
            CASE
              WHEN o.data_conclusao IS NOT NULL
                THEN 1
              ELSE 0
            END
          )::int AS concluded
        FROM construcao_sp.obras o
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        WHERE 1=1
        ${whereFilters}
        GROUP BY DATE_TRUNC('month', o.entrada)
        ORDER BY DATE_TRUNC('month', o.entrada)
      `);
  }

  async findTopPartners(filters: DashboardFiltersDTO) {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(filters);

    return await this.prisma.$queryRaw<FindTopPartners[]>(Prisma.sql`
        SELECT
          t.turma AS partner,
          COUNT(o.id)::int AS total
        FROM construcao_sp.obras o
        JOIN construcao_sp.turmas t
          ON o.id_turma = t.id
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        WHERE 1=1
        ${whereFilters}
        GROUP BY t.id, t.turma
        ORDER BY total DESC
        LIMIT 5
      `);
  }

  async findRecentWorks(filters: DashboardFiltersDTO) {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(filters);

    return await this.prisma.$queryRaw<FindRecentWorks[]>(Prisma.sql`
        SELECT
          o.ovnota,
          s.status,
          t.turma AS partner,
          m.municipio,
          o.executado,
          o.entrada
        FROM construcao_sp.obras o
        JOIN construcao_sp.status s
          ON o.id_status = s.id
        JOIN construcao_sp.turmas t
          ON o.id_turma = t.id
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        WHERE 1=1
        ${whereFilters}
        ORDER BY o.id DESC
        LIMIT 10
      `);
  }

  async findPartnerStatus(filters: DashboardFiltersDTO) {
    const whereFilters = DashboardFiltersBuilder.buildSQLWhere(filters);

    return await this.prisma.$queryRaw<FindPartnerStatus[]>(Prisma.sql`
        SELECT
          t.turma AS partner,
          s.status,
          COUNT(o.id)::int AS count
        FROM construcao_sp.obras o
        JOIN construcao_sp.turmas t
          ON o.id_turma = t.id
        JOIN construcao_sp.status s
          ON o.id_status = s.id
        JOIN construcao_sp.tipos tp
          ON o.id_tipo = tp.id
        JOIN construcao_sp.municipios m
          ON o.id_gpm = m.id
        WHERE 1=1
        ${whereFilters}
        GROUP BY
          t.turma,
          s.id,
          s.status
        ORDER BY
          t.turma,
          count DESC
      `);
  }
}
