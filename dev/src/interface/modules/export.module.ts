import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../application/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../application/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../application/export/exportWorksInPortfolio.service';
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
