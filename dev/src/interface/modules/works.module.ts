import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import { GetAllWorksService } from 'src/application/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { UpdateWorkService } from 'src/application/works/updateWork.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';
import { UPDATE_WORK_REPOSITORY } from 'src/domain/repositories/works/IUpdateWorkRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { FindExistingWorksRepository } from 'src/infra/repositories/works/findExistingWorksRepository';
import { GetAllWorksRepository } from 'src/infra/repositories/works/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/getWorksDetailsRepository';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/getWorksInPortfolioRepository';
import { InsertWorksRepository } from 'src/infra/repositories/works/InsertWorksRepository';
import { UpdateWorkRepository } from 'src/infra/repositories/works/updateWorkRepository';

import { forwardRef, Module } from '@nestjs/common';

import { WorksController } from '../controllers/works.controller';
import { AuxiliaryBaseModule } from './auxiliaryBase.module';
import { UsersModule } from './users.module';
import { HandleWorkUpdateService } from 'src/application/orchestrators/handleWorkUpdate.service';

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
    UpdateWorkService,
    HandleWorkUpdateService,
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
    { provide: UPDATE_WORK_REPOSITORY, useClass: UpdateWorkRepository },
    {
      provide: FIND_EXISITING_WORKS_REPOSITORY,
      useClass: FindExistingWorksRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
  ],
  exports: [
    GetWorksInPortfolioService,
    GetCompletedWorksService,
    FindExistingWorksService,
    GetWorkDetailsService,
  ],
})
export class WorksModule {}
