// dashboard.service.spec.ts

import { DashboardService } from 'src/application/usecases/dashboard.service';
import {
  DASHBOARD_REPOSITORY,
  IDashboardRepository,
} from 'src/domain/repositories/schedule/IDashboardRepository';
import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';

import { Test, TestingModule } from '@nestjs/testing';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockDashboardRepository: jest.Mocked<IDashboardRepository> = {
    countTotalWorks: jest.fn(),
    countConcludedThisMonth: jest.fn(),
    countWithoutSchedule: jest.fn(),
    countPortfolio: jest.fn(),
    countExecutedValue: jest.fn(),
    findWorksByStatus: jest.fn(),
    findWorksByRegional: jest.fn(),
    findMonthlyTrend: jest.fn(),
    findTopPartners: jest.fn(),
    findRecentWorks: jest.fn(),
    countTotalConcluded: jest.fn(),
    findPartnerStatus: jest.fn(),
  } as unknown as jest.Mocked<IDashboardRepository>;

  const filters: DashboardFiltersDTO = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  } as DashboardFiltersDTO;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DASHBOARD_REPOSITORY,
          useValue: mockDashboardRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getDashboardData', () => {
    it('should return dashboard data correctly with calculated executionRate and grouped partner details', async () => {
      mockDashboardRepository.countTotalWorks.mockResolvedValue(100);

      mockDashboardRepository.countConcludedThisMonth.mockResolvedValue(12);

      mockDashboardRepository.countWithoutSchedule.mockResolvedValue(5);

      mockDashboardRepository.countPortfolio.mockResolvedValue(250000);

      mockDashboardRepository.countExecutedValue.mockResolvedValue(175000);

      mockDashboardRepository.findWorksByStatus.mockResolvedValue([
        {
          status: 'Concluída',
          count: 80,
        },
        {
          status: 'Em andamento',
          count: 20,
        },
      ]);

      mockDashboardRepository.findWorksByRegional.mockResolvedValue([
        {
          regional: 'Sul',
          count: 40,
        },
      ]);

      mockDashboardRepository.findMonthlyTrend.mockResolvedValue([
        {
          month: '2026-01',
          total: 50,
        },
      ]);

      mockDashboardRepository.findTopPartners.mockResolvedValue([
        {
          partner: 'Parceiro A',
          total: 10,
        },
        {
          partner: 'Parceiro B',
          total: 5,
        },
      ]);

      mockDashboardRepository.findRecentWorks.mockResolvedValue([
        {
          id: 1,
          name: 'Obra Teste',
        },
      ]);

      mockDashboardRepository.countTotalConcluded.mockResolvedValue(80);

      mockDashboardRepository.findPartnerStatus.mockResolvedValue([
        {
          partner: 'Parceiro A',
          status: 'Concluído',
          count: 7,
        },
        {
          partner: 'Parceiro A',
          status: 'Pendente',
          count: 3,
        },
        {
          partner: 'Parceiro B',
          status: 'Concluído',
          count: 5,
        },
      ]);

      const result = await service.getDashboardData(filters);

      expect(mockDashboardRepository.countTotalWorks).toHaveBeenCalledWith(
        filters,
      );

      expect(
        mockDashboardRepository.countConcludedThisMonth,
      ).toHaveBeenCalledWith(filters);

      expect(mockDashboardRepository.countWithoutSchedule).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.countPortfolio).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.countExecutedValue).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findWorksByStatus).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findWorksByRegional).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findMonthlyTrend).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findTopPartners).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findRecentWorks).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.countTotalConcluded).toHaveBeenCalledWith(
        filters,
      );

      expect(mockDashboardRepository.findPartnerStatus).toHaveBeenCalledWith([
        'Parceiro A',
        'Parceiro B',
      ]);

      expect(result).toEqual({
        kpis: {
          total: 100,
          concludedThisMonth: 12,
          portfoliototal: 250000,
          valueExecutedTotal: 175000,
          totalConcluded: 80,
          withoutSchedule: 5,
          executionRate: 80,
        },

        byStatus: [
          {
            status: 'Concluída',
            count: 80,
          },
          {
            status: 'Em andamento',
            count: 20,
          },
        ],

        byRegional: [
          {
            regional: 'Sul',
            count: 40,
          },
        ],

        trend: [
          {
            month: '2026-01',
            total: 50,
          },
        ],

        topPartners: [
          {
            partner: 'Parceiro A',
            total: 10,
          },
          {
            partner: 'Parceiro B',
            total: 5,
          },
        ],

        partnerDetails: {
          'Parceiro A': [
            {
              status: 'Concluído',
              count: 7,
            },
            {
              status: 'Pendente',
              count: 3,
            },
          ],

          'Parceiro B': [
            {
              status: 'Concluído',
              count: 5,
            },
          ],
        },

        recentWorks: [
          {
            id: 1,
            name: 'Obra Teste',
          },
        ],
      });
    });

    it('should return executionRate as 0 when total is 0', async () => {
      mockDashboardRepository.countTotalWorks.mockResolvedValue(0);

      mockDashboardRepository.countConcludedThisMonth.mockResolvedValue(0);

      mockDashboardRepository.countWithoutSchedule.mockResolvedValue(0);

      mockDashboardRepository.countPortfolio.mockResolvedValue(0);

      mockDashboardRepository.countExecutedValue.mockResolvedValue(0);

      mockDashboardRepository.findWorksByStatus.mockResolvedValue([]);

      mockDashboardRepository.findWorksByRegional.mockResolvedValue([]);

      mockDashboardRepository.findMonthlyTrend.mockResolvedValue([]);

      mockDashboardRepository.findTopPartners.mockResolvedValue([]);

      mockDashboardRepository.findRecentWorks.mockResolvedValue([]);

      mockDashboardRepository.countTotalConcluded.mockResolvedValue(0);

      mockDashboardRepository.findPartnerStatus.mockResolvedValue([]);

      const result = await service.getDashboardData(filters);

      expect(result.kpis.executionRate).toBe(0);

      expect(result.partnerDetails).toEqual({});
    });

    it('should group partner details correctly when multiple statuses exist for same partner', async () => {
      mockDashboardRepository.countTotalWorks.mockResolvedValue(10);

      mockDashboardRepository.countConcludedThisMonth.mockResolvedValue(2);

      mockDashboardRepository.countWithoutSchedule.mockResolvedValue(1);

      mockDashboardRepository.countPortfolio.mockResolvedValue(1000);

      mockDashboardRepository.countExecutedValue.mockResolvedValue(500);

      mockDashboardRepository.findWorksByStatus.mockResolvedValue([]);

      mockDashboardRepository.findWorksByRegional.mockResolvedValue([]);

      mockDashboardRepository.findMonthlyTrend.mockResolvedValue([]);

      mockDashboardRepository.findTopPartners.mockResolvedValue([
        {
          partner: 'Parceiro Único',
          total: 10,
        },
      ]);

      mockDashboardRepository.findRecentWorks.mockResolvedValue([]);

      mockDashboardRepository.countTotalConcluded.mockResolvedValue(5);

      mockDashboardRepository.findPartnerStatus.mockResolvedValue([
        {
          partner: 'Parceiro Único',
          status: 'A',
          count: 1,
        },
        {
          partner: 'Parceiro Único',
          status: 'B',
          count: 2,
        },
        {
          partner: 'Parceiro Único',
          status: 'C',
          count: 3,
        },
      ]);

      const result = await service.getDashboardData(filters);

      expect(result.partnerDetails).toEqual({
        'Parceiro Único': [
          {
            status: 'A',
            count: 1,
          },
          {
            status: 'B',
            count: 2,
          },
          {
            status: 'C',
            count: 3,
          },
        ],
      });
    });

    it('should propagate repository errors', async () => {
      mockDashboardRepository.countTotalWorks.mockRejectedValue(
        new Error('Repository error'),
      );

      await expect(service.getDashboardData(filters)).rejects.toThrow(
        'Repository error',
      );
    });
  });
});
