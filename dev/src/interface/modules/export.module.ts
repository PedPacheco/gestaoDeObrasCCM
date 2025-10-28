import { Module } from '@nestjs/common';

import { ExportCompletedWorksService } from '../../application/export/exportCompletedWorks.service';
import { ExportScheduleService } from '../../application/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from '../../application/export/exportWorksInPortfolio.service';
import { ExportController } from '../controllers/export.controller';
import { ScheduleModule } from './schedule.module';
import { WorksModule } from './works.module';
import { UsersModule } from './users.module';
import { EXPORT_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/repositories/IExportRepository';
import { ExportWorksInPortfolioBI } from 'src/application/export/exportWorkInPortfolioBI.service';
import { ExportWorksInPortfolioRepository } from 'src/infra/repositories/export/exportWorksInPortFolioRepository';

@Module({
  imports: [WorksModule, ScheduleModule, UsersModule],
  controllers: [ExportController],
  providers: [
    ExportScheduleService,
    ExportWorksInPortfolioService,
    ExportCompletedWorksService,
    ExportWorksInPortfolioBI,
    {
      provide: EXPORT_WORKS_IN_PORTFOLIO_REPOSITORY,
      useClass: ExportWorksInPortfolioRepository,
    },
  ],
})
export class ExportModule {}
