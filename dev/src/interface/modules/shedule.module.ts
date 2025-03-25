import { Module } from '@nestjs/common';

import { GetMonthlySummaryService } from '../../domain/services/schedule/getMonthlySummary.service';
import { GetPendingScheduleValuesService } from '../../domain/services/schedule/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from '../../domain/services/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from '../../domain/services/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from '../../domain/services/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from '../../domain/services/schedule/getValuesWeeklySchedule.service';
import { ScheduleController } from '../controllers/schedule.controller';
import { UsersModule } from './users.module';

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
  ],
  exports: [GetScheduleValuesService],
})
export class ScheduleModule {}
