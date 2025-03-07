import { GetAllWorksService } from 'src/domain/services/works/services/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/services/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/services/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/services/getWorksInPortfolio.service';
import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { WorksController } from '../controllers/works.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [WorksController],
  providers: [
    GetWorksInPortfolioService,
    GetAllWorksService,
    GetCompletedWorksService,
    GetWorkDetailsService,
  ],
  exports: [GetWorksInPortfolioService, GetCompletedWorksService],
})
export class WorksModule {}
