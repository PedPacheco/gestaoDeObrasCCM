import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from 'src/application/usecases/dashboard.service';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @UseGuards(VisualizationGuard)
  async getDashboard() {
    return this.dashboardService.getDashboardData();
  }
}
