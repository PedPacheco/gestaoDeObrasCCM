import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../domain/services/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../domain/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../domain/services/export/exportWorksInPortfolio.service';
import { ExportController } from '../controllers/export.controller';
import { ScheduleModule } from './schedule.module';
import { WorksModule } from './works.module';

@Module({
  imports: [WorksModule, ScheduleModule],
  controllers: [ExportController],
  providers: [
    ExportScheduleService,
    ExportWorksInPortfolioService,
    ExportCompletedWorksService,
  ],
})
export class ExportModule {}
