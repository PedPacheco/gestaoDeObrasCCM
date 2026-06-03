// dashboard.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';

import { DashboardService } from 'src/application/usecases/dashboard.service';
import { UsersService } from 'src/application/usecases/users.service';
import { DashboardController } from 'src/interface/controllers/dashboard.controller';
import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    getDashboardData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  describe('getDashboard', () => {
    it('should call dashboardService.getDashboardData with filters and return the result', async () => {
      const filters: DashboardFiltersDTO = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      } as DashboardFiltersDTO;

      const dashboardResponse = {
        kpis: {
          total: 100,
          concludedThisMonth: 15,
          executionRate: 80,
        },

        byStatus: [
          {
            status: 'Concluído',
            count: 80,
          },
        ],

        byRegional: [
          {
            regional: 'Sul',
            count: 50,
          },
        ],

        trend: [],

        topPartners: [],

        partnerDetails: {},

        recentWorks: [],
      };

      mockDashboardService.getDashboardData.mockResolvedValue(
        dashboardResponse,
      );

      const result = await controller.getDashboard(filters);

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledTimes(1);

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
        filters,
      );

      expect(result).toEqual(dashboardResponse);
    });

    it('should return empty dashboard data correctly', async () => {
      const filters: DashboardFiltersDTO = {} as DashboardFiltersDTO;

      const emptyResponse = {
        kpis: {
          total: 0,
          concludedThisMonth: 0,
          executionRate: 0,
        },

        byStatus: [],
        byRegional: [],
        trend: [],
        topPartners: [],
        partnerDetails: {},
        recentWorks: [],
      };

      mockDashboardService.getDashboardData.mockResolvedValue(emptyResponse);

      const result = await controller.getDashboard(filters);

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
        filters,
      );

      expect(result).toEqual(emptyResponse);
    });

    it('should propagate service errors', async () => {
      const filters: DashboardFiltersDTO = {
        startDate: '2026-01-01',
      } as DashboardFiltersDTO;

      mockDashboardService.getDashboardData.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getDashboard(filters)).rejects.toThrow(
        'Service error',
      );

      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith(
        filters,
      );
    });
  });
});
