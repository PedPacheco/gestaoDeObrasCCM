import { DashboardService } from 'src/application/usecases/dashboard.service';

import { Module } from '@nestjs/common';

import { DashboardController } from '../controllers/dashboard.controller';
import { UsersModule } from './users.module';
import { DASHBOARD_REPOSITORY } from 'src/domain/repositories/schedule/IDashboardRepository';
import { DashboardRepository } from 'src/infra/repositories/dashboardRepository';

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardRepository },
  ],
})
export class DashboardModule {}
