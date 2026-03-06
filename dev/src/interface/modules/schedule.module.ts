import { HandleAddScheduleService } from 'src/application/services/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/services/orchestrators/handleSchedulesUpdate.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { DELETE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GET_TOTAL_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';
import { REJECTION_OF_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IRejectionsOfSchedules';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { AddSchedulesRepository } from 'src/infra/repositories/schedule/addSchedulesRepository';
import { DeleteSchedulesRepository } from 'src/infra/repositories/schedule/deleteSchedulesRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';
import { GetScheduleValuesRepository } from 'src/infra/repositories/schedule/getScheduleValuesRepository';
import { GetTotalValueScheduleRepository } from 'src/infra/repositories/schedule/getTotalValuesScheduleRepository';
import { RejectionsOfSchedulesRepository } from 'src/infra/repositories/schedule/rejectionsOfSchedulesRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { ValidateAndConfirmSchedulesRepository } from 'src/infra/repositories/schedule/validateAndConfirmSchedulesRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';

import { forwardRef, Module } from '@nestjs/common';

import { ScheduleController } from '../controllers/schedules/schedule.controller';
import { SchedulesActionsController } from '../controllers/schedules/schedulesActions.controller';
import { ExecutionReportModule } from './executionReport.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { ExecutionCapacityRepository } from 'src/infra/repositories/executionCapacityRepository';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/services/schedule/validateAndConfirmSchedules.service';
import { ScheduleExecutionValidatorService } from 'src/application/services/schedule/scheduleExecutionValidator.service';
import { RejectionsOfSchedulesService } from 'src/application/services/schedule/rejectionOfSchedules.service';
import { GetMonthlySummaryService } from 'src/application/services/schedule/getMonthlySummary.service';
import { GetScheduleValuesService } from 'src/application/services/schedule/getScheduleValues.service';
import { DeleteSchedulesService } from 'src/application/services/schedule/deleteSchedules.service';
import { GetTotalValuesScheduleService } from 'src/application/services/schedule/getTotalValuesSchedule.service';
import { AddSchedulesService } from 'src/application/services/schedule/addSchedules.service';
import { UpdateSchedulesService } from 'src/application/services/schedule/updateSchedules.service';
import { GetMonthlySummaryForecastService } from 'src/application/services/schedule/getMonthlySummaryForecast.service';
import { GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { GetMonthlySummaryForecastRepository } from 'src/infra/repositories/schedule/getMonthlySummaryForecastRepository';

// import { UpdateRestrictionsService } from 'src/application/schedule/updateRestrictions.service';
// import { UPDATE_RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateRestrictionsRepository';
// import { UpdateRestrictionsRepository } from 'src/infra/repositories/schedule/updateRestrictionsRepository';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ExecutionReportModule),
    WorksModule,
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
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
    }),
  ],
  controllers: [ScheduleController, SchedulesActionsController],
  providers: [
    AddSchedulesService,
    UpdateSchedulesService,
    DeleteSchedulesService,
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    GetMonthlySummaryService,
    HandleSchedulesUpdateService,
    HandleAddScheduleService,
    ValidateConfirmAndRejectSchedulesService,
    ScheduleExecutionValidatorService,
    RejectionsOfSchedulesService,
    DeadlineStatusService,
    GetMonthlySummaryForecastService,
    // UpdateRestrictionsService,
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
    // {
    //   provide: UPDATE_RESTRICTIONS_REPOSITORY,
    //   useClass: UpdateRestrictionsRepository,
    // },
  ],
  exports: [GetScheduleValuesService, FIND_SCHEDULE_BY_ID_REPOSITORY],
})
export class ScheduleModule {}
