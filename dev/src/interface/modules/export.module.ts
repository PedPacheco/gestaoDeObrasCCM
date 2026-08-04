import { ExportExecutionCapacityService } from '../../application/usecases/export/exportExecutionCapacity.service';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { EXPORT_REPOSITORY } from 'src/domain/contracts/IExportRepository';
import { ExportRepository } from 'src/infra/repositories/exportRepository';

import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../application/usecases/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../application/usecases/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../application/usecases/export/exportWorksInPortfolio.service';
import { ExportController } from '../controllers/export.controller';
import { ScheduleModule } from './schedule.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';
import { GoalsModule } from './goals.module';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { RestrictionsModule } from './restrictions.module';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';

@Module({
  imports: [
    WorksModule,
    ScheduleModule,
    UsersModule,
    GoalsModule,
    RestrictionsModule,
  ],
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
    ExportMonthlyMOSummaryService,
    ExportMonthlyForecastSummaryService,
    ExportGoalsService,
    ExportOrdersService,
    ExportPublicationRestrictionService,
    ExportReportToPubliationService,
    {
      provide: EXPORT_REPOSITORY,
      useClass: ExportRepository,
    },
  ],
})
export class ExportModule {}
