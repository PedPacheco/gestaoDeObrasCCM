import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { DELETE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GET_PENDING_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetPendingScheduleValuesRepository';
import { GET_SCHEDULE_RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GET_TOTAL_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';
import { GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY } from 'src/domain/repositories/schedule/IGetValuesWeeklyScheduleRepository';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { AddSchedulesService } from 'src/domain/services/schedule/addSchedules.service';
import { DeleteSchedulesService } from 'src/domain/services/schedule/deleteSchedules.service';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import { AddSchedulesRepository } from 'src/infra/repositories/schedule/addSchedulesRepository';
import { DeleteSchedulesRepository } from 'src/infra/repositories/schedule/deleteSchedulesRepository';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';
import { GetPendingScheduleValuesRepository } from 'src/infra/repositories/schedule/getPendingScheduleValuesRepository';
import { GetScheduleRestrictionsRespository } from 'src/infra/repositories/schedule/getScheduleRestrictionsRepository';
import { GetScheduleValuesRepository } from 'src/infra/repositories/schedule/getScheduleValuesRepository';
import { GetTotalValueScheduleRepository } from 'src/infra/repositories/schedule/getTotalValuesScheduleRepository';
import { GetValuesWeeklyScheduleRepository } from 'src/infra/repositories/schedule/getValuesWeeklyScheduleRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';

import { forwardRef, Module } from '@nestjs/common';

import { GetMonthlySummaryService } from '../../domain/services/schedule/getMonthlySummary.service';
import { GetPendingScheduleValuesService } from '../../domain/services/schedule/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from '../../domain/services/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from '../../domain/services/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from '../../domain/services/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from '../../domain/services/schedule/getValuesWeeklySchedule.service';
import { ScheduleController } from '../controllers/schedule.controller';
import { UsersModule } from './users.module';
import { UpdateSchedulesApplicationService } from 'src/application/updateSchedulesApplication.service';
import { ExecutionReportModule } from './executionReport.module';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';

@Module({
  imports: [UsersModule, forwardRef(() => ExecutionReportModule)],
  controllers: [ScheduleController],
  providers: [
    AddSchedulesService,
    UpdateSchedulesService,
    DeleteSchedulesService,
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    GetValuesWeeklyScheduleService,
    GetPendingScheduleValuesService,
    GetScheduleRestrictionsService,
    GetMonthlySummaryService,
    UpdateSchedulesApplicationService,
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
      provide: GET_PENDING_SCHEDULE_VALUES_REPOSITORY,
      useClass: GetPendingScheduleValuesRepository,
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
  ],
  exports: [GetScheduleValuesService, FIND_SCHEDULE_BY_ID_REPOSITORY],
})
export class ScheduleModule {}
