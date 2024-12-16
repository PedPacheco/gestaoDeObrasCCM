import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportScheduleService } from './services/exportSchedule.service';
import { ExportWorksInPortfolioService } from './services/exportWorksInPortfolio.service';
import { WorksModule } from '../works/works.module';
import { ScheduleModule } from '../schedule/shedule.module';
import { ExportCompletedWorksService } from './services/exportCompletedWorks.service';

@Module({
  imports: [WorksModule, ScheduleModule],
  controllers: [ExportController],
  providers: [
    ExportScheduleService,
    ExportWorksInPortfolioService,
    ExportCompletedWorksService,
  ],
})
export class ExportModule {}
