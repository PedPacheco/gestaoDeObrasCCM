import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { GetTotalValuesScheduleService } from './services/getTotalValuesSchedule.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetScheduleValuesService } from './services/getScheduleValues.service';
import { GetValuesWeeklyScheduleService } from './services/getValuesWeeklySchedule.service';
import { GetPendingScheduleValuesService } from './services/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from './services/getScheduleRestrictions.service';

@Module({
  imports: [],
  controllers: [ScheduleController],
  providers: [
    GetTotalValuesScheduleService,
    GetScheduleValuesService,
    GetValuesWeeklyScheduleService,
    GetPendingScheduleValuesService,
    GetScheduleRestrictionsService,
    PrismaService,
  ],
})
export class ScheduleModule {}