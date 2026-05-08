import { DashboardService } from 'src/application/usecases/dashboard.service';

import { Module } from '@nestjs/common';

import { DashboardController } from '../controllers/dashboard.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
