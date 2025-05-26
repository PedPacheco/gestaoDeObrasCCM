import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { INSERT_MARKET_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertMarketWorksRepository';
import { GetAllWorksService } from 'src/domain/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { InsertMarketWorksService } from 'src/domain/services/works/InsertMarketWorks.service';
import { CacheModule } from 'src/infra/cache/cache.module';
import { GetAllWorksRepository } from 'src/infra/repositories/works/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/getWorksDetailsRepository';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/getWorksInPortfolioRepository';
import { InsertMarketWorksRepository } from 'src/infra/repositories/works/InsertMarketWorksRepository';

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
    InsertMarketWorksService,
    { provide: GET_ALL_WORKS_REPOSITORY, useClass: GetAllWorksRepository },
    {
      provide: GET_COMPLETED_WORKS_REPOSITORY,
      useClass: GetCompletedWorksRepository,
    },
    {
      provide: GET_WORKS_DETAILS_REPOSITORY,
      useClass: GetWorksDetailsRepository,
    },
    {
      provide: GET_WORKS_IN_PORTFOLIO_REPOSITORY,
      useClass: GetWorksInPortfolioRepository,
    },
    {
      provide: INSERT_MARKET_WORKS_REPOSITORY,
      useClass: InsertMarketWorksRepository,
    },
  ],
  exports: [GetWorksInPortfolioService, GetCompletedWorksService],
})
export class WorksModule {}
