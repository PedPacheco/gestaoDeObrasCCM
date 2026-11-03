import { DashboardService } from 'src/application/usecases/dashboard.service';

import { Module } from '@nestjs/common';

import { DASHBOARD_REPOSITORY } from 'src/domain/contracts/IDashboardRepository';
import { DashboardRepository } from 'src/infra/repositories/dashboardRepository';
import { DashboardController } from '../controllers/dashboard.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardRepository },
  ],
})
export class DashboardModule {}
