import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from 'src/application/usecases/dashboard.service';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { DashboardFiltersDTO } from '../dtos/dashboardDTO';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @UseGuards(VisualizationGuard)
  async getDashboard(@Query() filters: DashboardFiltersDTO) {
    const data = await this.dashboardService.getDashboardData(filters);
    return data;
  }
}
