import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GET_PENDING_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetPendingScheduleValuesRepository';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';
import { GetPendingScheduleValuesRepository } from 'src/infra/repositories/schedule/getPendingScheduleValuesRepository';

import { Module } from '@nestjs/common';

import { GetMonthlySummaryService } from '../../domain/services/schedule/getMonthlySummary.service';
import { GetPendingScheduleValuesService } from '../../domain/services/schedule/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from '../../domain/services/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from '../../domain/services/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from '../../domain/services/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from '../../domain/services/schedule/getValuesWeeklySchedule.service';
import { ScheduleController } from '../controllers/schedule.controller';
import { UsersModule } from './users.module';
import { GET_SCHEDULE_RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';
import { GetScheduleRestrictionsRespository } from 'src/infra/repositories/schedule/getScheduleRestrictionsRepository';

@Module({
  imports: [UsersModule],
  controllers: [ScheduleController],
  providers: [
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    GetValuesWeeklyScheduleService,
    GetPendingScheduleValuesService,
    GetScheduleRestrictionsService,
    GetMonthlySummaryService,
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
  ],
  exports: [GetScheduleValuesService],
})
export class ScheduleModule {}
