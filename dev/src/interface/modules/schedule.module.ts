import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { AddSchedulesService } from 'src/application/schedule/addSchedules.service';
import { DeleteSchedulesService } from 'src/application/schedule/deleteSchedules.service';
import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { UpdateSchedulesService } from 'src/application/schedule/updateSchedules.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { DELETE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GET_SCHEDULE_RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GET_TOTAL_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';
import { GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY } from 'src/domain/repositories/schedule/IGetValuesWeeklyScheduleRepository';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { AddSchedulesRepository } from 'src/infra/repositories/schedule/addSchedulesRepository';
import { DeleteSchedulesRepository } from 'src/infra/repositories/schedule/deleteSchedulesRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';
import { GetScheduleRestrictionsRespository } from 'src/infra/repositories/schedule/getScheduleRestrictionsRepository';
import { GetScheduleValuesRepository } from 'src/infra/repositories/schedule/getScheduleValuesRepository';
import { GetTotalValueScheduleRepository } from 'src/infra/repositories/schedule/getTotalValuesScheduleRepository';
import { GetValuesWeeklyScheduleRepository } from 'src/infra/repositories/schedule/getValuesWeeklyScheduleRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { ValidateAndConfirmSchedulesRepository } from 'src/infra/repositories/schedule/validateAndConfirmSchedulesRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';

import { forwardRef, Module } from '@nestjs/common';

import { GetMonthlySummaryService } from '../../application/schedule/getMonthlySummary.service';
import { GetScheduleRestrictionsService } from '../../application/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from '../../application/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from '../../application/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from '../../application/schedule/getValuesWeeklySchedule.service';
import { ScheduleController } from '../controllers/schedule.controller';
import { ExecutionReportModule } from './executionReport.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';

@Module({
  imports: [UsersModule, forwardRef(() => ExecutionReportModule), WorksModule],
  controllers: [ScheduleController],
  providers: [
    AddSchedulesService,
    UpdateSchedulesService,
    DeleteSchedulesService,
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    GetValuesWeeklyScheduleService,
    GetScheduleRestrictionsService,
    GetMonthlySummaryService,
    HandleSchedulesUpdateService,
    HandleAddScheduleService,
    ValidateConfirmAndRejectSchedulesService,
    ScheduleExecutionValidatorService,
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
      provide: GET_SCHEDULE_RESTRICTIONS_REPOSITORY,
      useClass: GetScheduleRestrictionsRespository,
    },
    {
      provide: GET_SCHEDULE_VALUES_REPOSITORY,
      useClass: GetScheduleValuesRepository,
    },
    {
      provide: GET_TOTAL_SCHEDULE_VALUES_REPOSITORY,
      useClass: GetTotalValueScheduleRepository,
    },
    {
      provide: GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY,
      useClass: GetValuesWeeklyScheduleRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
    {
      provide: VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
      useClass: ValidateAndConfirmSchedulesRepository,
    },
  ],
  exports: [GetScheduleValuesService, FIND_SCHEDULE_BY_ID_REPOSITORY],
})
export class ScheduleModule {}
