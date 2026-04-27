import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      total,
      concludedThisMonth,
      withoutSchedule,
      byStatus,
      byRegional,
      trend,
      topPartners,
      recentWorks,
    ] = await Promise.all([
      // PG Total works count
      this.prisma.obras.count(),

      // PG Works concluded in current month
      this.prisma.obras.count({
        where: {
          data_conclusao: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // PG Works without any schedule entry
      this.prisma.obras.count({
        where: { programacoes: { none: {} } },
      }),

      // PG Works grouped by status
      this.prisma.$queryRaw<{ status: string; count: number }[]>`
        SELECT s.status, COUNT(o.id)::int AS count
        FROM construcao_sp.obras o
        JOIN construcao_sp.status s ON o.id_status = s.id
        GROUP BY s.id, s.status
        ORDER BY count DESC
      `,

      // PG Works grouped by regional with concluded count
      this.prisma.$queryRaw<{ regional: string; total: number; concluded: number }[]>`
        SELECT r.regional, COUNT(o.id)::int AS total,
          SUM(CASE WHEN o.data_conclusao IS NOT NULL THEN 1 ELSE 0 END)::int AS concluded
        FROM construcao_sp.obras o
        JOIN construcao_sp.municipios m ON o.id_gpm = m.id
        JOIN construcao_sp.regionais r ON m.id_regional = r.id
        GROUP BY r.id, r.regional
        ORDER BY total DESC
      `,

      // PG Monthly trend for the last 6 months (entered vs concluded)
      this.prisma.$queryRaw<{ month: string; entered: number; concluded: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', entrada), 'YYYY-MM') AS month,
          COUNT(*)::int AS entered,
          SUM(CASE WHEN data_conclusao IS NOT NULL THEN 1 ELSE 0 END)::int AS concluded
        FROM construcao_sp.obras
        WHERE entrada >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', entrada)
        ORDER BY month
      `,

      // PG Top 5 partners by total works
      this.prisma.$queryRaw<{ partner: string; total: number }[]>`
        SELECT t.turma AS partner, COUNT(o.id)::int AS total
        FROM construcao_sp.obras o
        JOIN construcao_sp.turmas t ON o.id_turma = t.id
        GROUP BY t.id, t.turma
        ORDER BY total DESC
        LIMIT 5
      `,

      // PG 10 most recently added works
      this.prisma.$queryRaw<{
        ovnota: string;
        status: string;
        partner: string;
        municipio: string;
        executado: number | null;
        entrada: Date;
      }[]>`
        SELECT
          o.ovnota,
          s.status,
          t.turma AS partner,
          m.municipio,
          o.executado,
          o.entrada
        FROM construcao_sp.obras o
        JOIN construcao_sp.status s ON o.id_status = s.id
        JOIN construcao_sp.turmas t ON o.id_turma = t.id
        JOIN construcao_sp.municipios m ON o.id_gpm = m.id
        ORDER BY o.id DESC
        LIMIT 10
      `,
    ]);

    // PG Percentage of total works that have been concluded
    const totalConcluded = await this.prisma.obras.count({
      where: { data_conclusao: { not: null } },
    });
    const executionRate = total > 0 ? Math.round((totalConcluded / total) * 100) : 0;

    // PG Status breakdown for each of the top 5 partners
    const partnerNames = topPartners.map((p) => p.partner);
    const partnerStatusRaw = await this.prisma.$queryRaw<
      { partner: string; status: string; count: number }[]
    >`
      SELECT t.turma AS partner, s.status, COUNT(o.id)::int AS count
      FROM construcao_sp.obras o
      JOIN construcao_sp.turmas t ON o.id_turma = t.id
      JOIN construcao_sp.status s ON o.id_status = s.id
      WHERE t.turma = ANY(${partnerNames}::text[])
      GROUP BY t.turma, s.id, s.status
      ORDER BY t.turma, count DESC
    `;

    // PG Group status rows by partner name
    const partnerDetails: Record<string, { status: string; count: number }[]> = {};
    for (const row of partnerStatusRaw) {
      if (!partnerDetails[row.partner]) partnerDetails[row.partner] = [];
      partnerDetails[row.partner].push({ status: row.status, count: row.count });
    }

    return {
      kpis: {
        total,
        concludedThisMonth,
        totalConcluded,
        withoutSchedule,
        executionRate,
      },
      byStatus,
      byRegional,
      trend,
      topPartners,
      partnerDetails,
      recentWorks,
    };
  }
}
