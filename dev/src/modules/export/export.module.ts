import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportScheduleService } from './services/exportSchedule.service';
import { exportWorksInPortfolioService } from './services/exportWorksInPortfolio.service';
import { CacheModule } from 'src/cache/cache.module';
import { WorksModule } from '../works/works.module';
import { ScheduleModule } from '../schedule/shedule.module';

@Module({
  imports: [CacheModule, WorksModule, ScheduleModule],
  controllers: [ExportController],
  providers: [ExportScheduleService, exportWorksInPortfolioService],
})
export class ExportModule {}
