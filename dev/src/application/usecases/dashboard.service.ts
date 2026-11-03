import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  IDashboardRepository,
} from 'src/domain/contracts/IDashboardRepository';
import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
  ) {}

  async getDashboardData(filters: DashboardFiltersDTO) {
    const [
      total,
      concludedThisMonth,
      withoutSchedule,
      portfoliototal,
      valueExecutedTotal,
      byStatus,
      byRegional,
      trend,
      topPartners,
      recentWorks,
      totalConcluded,
    ] = await Promise.all([
      this.dashboardRepository.countTotalWorks(filters),
      this.dashboardRepository.countConcludedThisMonth(filters),
      this.dashboardRepository.countWithoutSchedule(filters),
      this.dashboardRepository.countPortfolio(filters),
      this.dashboardRepository.countExecutedValue(filters),
      this.dashboardRepository.findWorksByStatus(filters),
      this.dashboardRepository.findWorksByRegional(filters),
      this.dashboardRepository.findMonthlyTrend(filters),
      this.dashboardRepository.findTopPartners(filters),
      this.dashboardRepository.findRecentWorks(filters),
      this.dashboardRepository.countTotalConcluded(filters),
    ]);

    const executionRate = this.calculateExecutionRate({
      total,
      totalConcluded,
    });

    const partnerNames = topPartners.map((partner) => partner.partner);

    const partnerStatus =
      await this.dashboardRepository.findPartnerStatus(partnerNames);

    const partnerDetails = this.groupPartnerDetails(partnerStatus);

    return {
      kpis: {
        total,
        concludedThisMonth,
        portfoliototal,
        valueExecutedTotal,
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

  private calculateExecutionRate(params: {
    total: number;
    totalConcluded: number;
  }) {
    const { total, totalConcluded } = params;

    if (total === 0) {
      return 0;
    }

    return Math.round((totalConcluded / total) * 100);
  }

  private groupPartnerDetails(
    rows: {
      partner: string;
      status: string;
      count: number;
    }[],
  ) {
    return rows.reduce<
      Record<
        string,
        {
          status: string;
          count: number;
        }[]
      >
    >((acc, row) => {
      if (!acc[row.partner]) {
        acc[row.partner] = [];
      }

      acc[row.partner].push({
        status: row.status,
        count: row.count,
      });

      return acc;
    }, {});
  }
}
