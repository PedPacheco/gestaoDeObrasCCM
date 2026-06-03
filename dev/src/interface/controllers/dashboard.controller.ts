import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from 'src/application/usecases/dashboard.service';
import { DashboardFiltersDTO } from '../dtos/dashboardDTO';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getDashboard(@Query() filters: DashboardFiltersDTO) {
    const data = await this.dashboardService.getDashboardData(filters);
    return data;
  }
}
