import { Module } from '@nestjs/common';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from 'src/application/dashboard.service';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
