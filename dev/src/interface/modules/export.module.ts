import { ExportExecutionCapacityService } from '../../application/services/export/exportExecutionCapacity.service';
import { ExportCompletedWorksBIService } from 'src/application/services/export/BI/exportCompletedWorksBI.service';
import { ExportWorksInPortfolioBI } from 'src/application/services/export/BI/exportWorkInPortfolioBI.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';
import { ExportRepository } from 'src/infra/repositories/exportRepository';

import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../application/services/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../application/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../application/services/export/exportWorksInPortfolio.service';
import { ExportController } from '../controllers/export.controller';
import { ScheduleModule } from './schedule.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { ExportSchedulesBIService } from 'src/application/services/export/BI/exportSchedulesBI.service';
import { ExportFinedWorksService } from 'src/application/services/export/exportFinedWorks.service';
import { ExportSuspensionsService } from 'src/application/services/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/services/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/services/export/exportForecast.service';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { ExportRejectionsService } from 'src/application/services/export/exportRejections.service';

@Module({
  imports: [WorksModule, ScheduleModule, UsersModule],
  controllers: [ExportController],
  providers: [
    ExportScheduleService,
    ExportWorksInPortfolioService,
    ExportCompletedWorksService,
    ExportWorksInPortfolioBI,
    ExportCompletedWorksBIService,
    ExportSchedulesBIService,
    ExportFinedWorksService,
    ExportExecutionCapacityService,
    ExportSuspensionsService,
    ExportExecutionReportService,
    ExportForecastService,
    DeadlineStatusService,
    ExportRejectionsService,
    {
      provide: EXPORT_REPOSITORY,
      useClass: ExportRepository,
    },
  ],
})
export class ExportModule {}
