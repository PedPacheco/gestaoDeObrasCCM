import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../domain/services/export/services/exportCompletedWorks.service';
import { ExportScheduleService } from '../../domain/services/export/services/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../domain/services/export/services/exportWorksInPortfolio.service';
import { ExportController } from '../controllers/export.controller';
import { ScheduleModule } from './shedule.module';
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
