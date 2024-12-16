import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { GetTotalValuesScheduleService } from './services/getTotalValuesSchedule.service';
import { GetScheduleValuesService } from './services/getScheduleValues.service';
import { GetValuesWeeklyScheduleService } from './services/getValuesWeeklySchedule.service';
import { GetPendingScheduleValuesService } from './services/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from './services/getScheduleRestrictions.service';
import { GetMonthlySummaryService } from './services/getMonthlySummary.service';
import { UsersModule } from '../users/users.module';

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
