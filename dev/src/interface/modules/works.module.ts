import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';
import { FindExistingWorksService } from 'src/domain/services/works/findExistingWorks.service';
import { GetAllWorksService } from 'src/domain/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { InsertWorksService } from 'src/domain/services/works/InsertWorks.service';
import { CacheModule } from 'src/infra/cache/cache.module';
import { FindExistingWorksRepository } from 'src/infra/repositories/works/findExistingWorksRepository';
import { GetAllWorksRepository } from 'src/infra/repositories/works/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/getWorksDetailsRepository';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/getWorksInPortfolioRepository';
import { InsertWorksRepository } from 'src/infra/repositories/works/InsertWorksRepository';

import { forwardRef, Module } from '@nestjs/common';

import { WorksController } from '../controllers/works.controller';
import { AuxiliaryBaseModule } from './auxiliaryBase.module';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule, forwardRef(() => AuxiliaryBaseModule)],
  controllers: [WorksController],
  providers: [
    FindExistingWorksService,
    GetWorksInPortfolioService,
    GetAllWorksService,
    GetCompletedWorksService,
    GetWorkDetailsService,
    InsertWorksService,

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
      provide: INSERT_WORKS_REPOSITORY,
      useClass: InsertWorksRepository,
    },
    {
      provide: FIND_EXISITING_WORKS_REPOSITORY,
      useClass: FindExistingWorksRepository,
    },
  ],
  exports: [
    GetWorksInPortfolioService,
    GetCompletedWorksService,
    FindExistingWorksService,
  ],
})
export class WorksModule {}
