import { MonthlySummaryForecastMapper } from 'src/application/mappers/monthlySummaryForecastMapper';
import { MonthlySummaryMapper } from 'src/application/mappers/monthlySummaryMapper';
import { HandleAddScheduleService } from 'src/application/usecases/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/usecases/orchestrators/handleSchedulesUpdate.service';
import { AddSchedulesService } from 'src/application/usecases/schedule/addSchedules.service';
import { DeleteSchedulesService } from 'src/application/usecases/schedule/deleteSchedules.service';
import { ExecMonitoringService } from 'src/application/usecases/schedule/execMonitoring.service';
import { MonthlySummaryService } from 'src/application/usecases/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';
import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/application/usecases/schedule/getTotalValuesSchedule.service';
import { RejectionsOfSchedulesService } from 'src/application/usecases/schedule/rejectionOfSchedules.service';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/schedule/scheduleExecutionValidator.service';
import { UpdateSchedulesService } from 'src/application/usecases/schedule/updateSchedules.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/usecases/schedule/validateAndConfirmSchedules.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { FORECAST_SNAPSHOT } from 'src/domain/repositories/IForecastSnapshotRepository';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { DELETE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';
import { EXEC_MONITORING_REPOSITORY } from 'src/domain/repositories/schedule/IExecMonitoringRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GET_TOTAL_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';
import { REJECTION_OF_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IRejectionsOfSchedules';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import {
  MONTHLY_SUMMARY_CALCULATOR,
  MonthlySummaryCalculator,
} from 'src/domain/services/monthlySummaryCalculator.service';
import {
  MONTHLY_SUMMARY_FORECAST_CALCULATOR,
  MonthlySummaryForecastCalculator,
} from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { TeamAggregationService } from 'src/domain/services/teamAggregator.service';
import { ExecutionCapacityRepository } from 'src/infra/repositories/executionCapacityRepository';
import { AddSchedulesRepository } from 'src/infra/repositories/schedule/addSchedulesRepository';
import { DeleteSchedulesRepository } from 'src/infra/repositories/schedule/deleteSchedulesRepository';
import { ExecMonitoringRepository } from 'src/infra/repositories/schedule/execMonitoringRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import { ForecastSnapshotRepository } from 'src/infra/repositories/schedule/forecastSnapshotRepository';
import { GetMonthlySummaryForecastRepository } from 'src/infra/repositories/schedule/getMonthlySummaryForecastRepository';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';
import { GetScheduleValuesRepository } from 'src/infra/repositories/schedule/getScheduleValuesRepository';
import { GetTotalValueScheduleRepository } from 'src/infra/repositories/schedule/getTotalValuesScheduleRepository';
import { RejectionsOfSchedulesRepository } from 'src/infra/repositories/schedule/rejectionsOfSchedulesRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { ValidateAndConfirmSchedulesRepository } from 'src/infra/repositories/schedule/validateAndConfirmSchedulesRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { WorkServicesQueryRepository } from 'src/infra/repositories/worksServices/workServicesQueryRepository';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { ScheduleController } from '../controllers/schedules/schedule.controller';
import { SchedulesActionsController } from '../controllers/schedules/schedulesActions.controller';
import { ExecutionReportModule } from './executionReport.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';
import { WorksServicesModule } from './worksServices.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => WorksModule),
    forwardRef(() => WorksServicesModule),
    forwardRef(() => ExecutionReportModule),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const multerCfg = createMulterConfig({
          destination: config.get<string>('UPLOAD_AS_BUILD'),
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/png',
            'image/heic',
            'image/heif',
          ],
          allowedExtensions: [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.tiff',
            '.heic',
            '.heif',
          ],
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
    }),
  ],
  controllers: [ScheduleController, SchedulesActionsController],
  providers: [
    TeamAggregationService,
    ExecMonitoringService,
    AddSchedulesService,
    UpdateSchedulesService,
    DeleteSchedulesService,
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    HandleSchedulesUpdateService,
    HandleAddScheduleService,
    ValidateConfirmAndRejectSchedulesService,
    ScheduleExecutionValidatorService,
    RejectionsOfSchedulesService,
    WorksServicesService,
    DeadlineStatusService,
    GetMonthlySummaryForecastService,
    MonthlySummaryForecastCalculator,
    MonthlySummaryForecastMapper,
    MonthlySummaryMapper,
    MonthlySummaryService,
    ScheduleProgressCalculatorService,
    // UpdateRestrictionsService,
    {
      provide: WORK_SERVICES_REPOSITORY,
      useClass: WorkServicesRepository,
    },
    {
      provide: WORK_SERVICES_QUERY_REPOSITORY,
      useClass: WorkServicesQueryRepository,
    },
    {
      provide: MONTHLY_SUMMARY_FORECAST_CALCULATOR,
      useClass: MonthlySummaryForecastCalculator,
    },
    {
      provide: MONTHLY_SUMMARY_CALCULATOR,
      useClass: MonthlySummaryCalculator,
    },
    { provide: ADD_SCHEDULES_REPOSITORY, useClass: AddSchedulesRepository },
    {
      provide: UPDATE_SCHEDULES_REPOSITORY,
      useClass: UpdateSchedulesRepository,
    },
    {
      provide: DELETE_SCHEDULES_REPOSITORY,
      useClass: DeleteSchedulesRepository,
    },
    {
      provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
      useClass: FindScheduleByIdRepository,
    },
    {
      provide: GET_MONTHLY_SUMMARY_REPOSITORY,
      useClass: GetMonthlySummaryRepository,
    },
    {
      provide: GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
      useClass: GetMonthlySummaryForecastRepository,
    },
    {
      provide: GET_SCHEDULE_VALUES_REPOSITORY,
      useClass: GetScheduleValuesRepository,
    },
    {
      provide: GET_TOTAL_SCHEDULE_VALUES_REPOSITORY,
      useClass: GetTotalValueScheduleRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
    {
      provide: VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
      useClass: ValidateAndConfirmSchedulesRepository,
    },
    {
      provide: REJECTION_OF_SCHEDULES_REPOSITORY,
      useClass: RejectionsOfSchedulesRepository,
    },
    {
      provide: EXECUTION_CAPACITY_REPOSITORY,
      useClass: ExecutionCapacityRepository,
    },
    {
      provide: FORECAST_SNAPSHOT,
      useClass: ForecastSnapshotRepository,
    },
    {
      provide: EXEC_MONITORING_REPOSITORY,
      useClass: ExecMonitoringRepository,
    },
    // {
    //   provide: UPDATE_RESTRICTIONS_REPOSITORY,
    //   useClass: UpdateRestrictionsRepository,
    // },
  ],
  exports: [
    GetScheduleValuesService,
    MonthlySummaryService,
    GetMonthlySummaryForecastService,
    FIND_SCHEDULE_BY_ID_REPOSITORY,
  ],
})
export class ScheduleOfWorksModule {}
