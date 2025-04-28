import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GetAllWorksService } from 'src/domain/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { CacheModule } from 'src/infra/cache/cache.module';
import { GetAllWorksRepository } from 'src/infra/repositories/works/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';

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
    { provide: GET_ALL_WORKS_REPOSITORY, useClass: GetAllWorksRepository },
    {
      provide: GET_COMPLETED_WORKS_REPOSITORY,
      useClass: GetCompletedWorksRepository,
    },
  ],
  exports: [GetWorksInPortfolioService, GetCompletedWorksService],
})
export class WorksModule {}
