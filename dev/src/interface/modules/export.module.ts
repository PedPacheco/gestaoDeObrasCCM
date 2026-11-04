import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { EXPORT_REPOSITORY } from 'src/domain/contracts/IExportRepository';
import { ExportRepository } from 'src/infra/repositories/exportRepository';
import { ExportExecutionCapacityService } from '../../application/usecases/export/exportExecutionCapacity.service';

import { Module } from '@nestjs/common';

import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';
import { ExportD5NotesService } from 'src/application/usecases/export/exportD5Notes.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportFeasibilityService } from 'src/application/usecases/export/exportFeasibility.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportExcelServicesService } from 'src/application/usecases/export/services/exportExcelServices.service';
import { ExportPdfServicesService } from 'src/application/usecases/export/services/exportPdfServices.service';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { ExportCompletedWorksService } from '../../application/usecases/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../application/usecases/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../application/usecases/export/exportWorksInPortfolio.service';
import { ExportBIController } from '../controllers/export/exportBi.controller';
import { ExportD5NotesController } from '../controllers/export/exportD5.controller';
import { ExportFeasibilityController } from '../controllers/export/exportFeasibility.controller';
import { ExportPublicationsController } from '../controllers/export/exportPublication.controller';
import { ExportScheduleController } from '../controllers/export/exportSchedule.controller';
import { ExportServicesController } from '../controllers/export/exportServices.controller';
import { ExportWorksController } from '../controllers/export/exportWorks.controller';
import { D5NotesModule } from './d5Notes.module';
import { FeasibilityModule } from './feasibility.module';
import { GoalsModule } from './goals.module';
import { RestrictionsModule } from './restrictions.module';
import { ScheduleModule } from './schedule.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { WorksServicesModule } from './worksServices.module';

@Module({
  imports: [
    WorksModule,
    ScheduleModule,
    UsersModule,
    GoalsModule,
    RestrictionsModule,
    WorksServicesModule,
    FeasibilityModule,
    D5NotesModule,
  ],
  controllers: [
    ExportWorksController,
    ExportScheduleController,
    ExportPublicationsController,
    ExportServicesController,
    ExportFeasibilityController,
    ExportBIController,
    ExportD5NotesController,
  ],
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
    ExportPdfServicesService,
    ExportExcelServicesService,
    ExportFeasibilityService,
    ExportD5NotesService,
    {
      provide: EXPORT_REPOSITORY,
      useClass: ExportRepository,
    },
  ],
})
export class ExportModule {}
