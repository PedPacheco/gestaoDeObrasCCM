import { forwardRef, Module } from '@nestjs/common';
import { HandleWorkUpdateService } from 'src/application/usecases/orchestrators/handleWorkUpdate.service';
import { ContractUpdateService } from 'src/application/usecases/works/management/contractUpdate.service';
import { FindExistingWorksService } from 'src/application/usecases/works/management/findExistingWorks.service';
import { GetAllWorksService } from 'src/application/usecases/works/management/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/management/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/usecases/works/management/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/application/usecases/works/management/getWorksInPortfolio.service';
import { InsertWorksService } from 'src/application/usecases/works/management/insertWorks.service';
import { SuspensionWorkService } from 'src/application/usecases/works/management/suspensionWork.service';
import { UpdateNoteService } from 'src/application/usecases/works/management/updateNote.service';
import { UpdateOvService } from 'src/application/usecases/works/management/updateOv.service';
import { UpdateWorkService } from 'src/application/usecases/works/management/updateWork.service';

import { STATUS_FLOW_REPOSITORY } from 'src/domain/contracts/IStatusFlowRepository';
import { CONTRACT_UPDATE_REPOSITORY } from 'src/domain/contracts/works/management/IContractUpdateRepository';
import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/contracts/works/management/IFindExistingWorksRepository';
import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/contracts/works/management/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/contracts/works/management/IGetCompletedWorksRepository';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/contracts/works/management/IGetWorksDetailsRepository';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/contracts/works/management/IGetWorksInPortfolioRepository';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/contracts/works/management/IInsertWorksRepository';
import { SUSPENSION_WORK_REPOSITORY } from 'src/domain/contracts/works/management/ISuspensionWorkRepository';
import { UPDATE_NOTE_REPOSITORY } from 'src/domain/contracts/works/management/IUpdateNoteRepository';
import { UPDATE_OV_REPOSITORY } from 'src/domain/contracts/works/management/IUpdateOvRepository';
import { UPDATE_WORK_REPOSITORY } from 'src/domain/contracts/works/management/IUpdateWorkRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { CacheModule } from 'src/infra/cache/cache.module';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { ContractUpdateRepository } from 'src/infra/repositories/works/management/contractUpdateRepository';
import { FindExistingWorksRepository } from 'src/infra/repositories/works/management/findExistingWorksRepository';
import { GetAllWorksRepository } from 'src/infra/repositories/works/management/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/management/getCompletedWorksRepository';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/management/getWorksDetailsRepository';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/management/getWorksInPortfolioRepository';
import { InsertWorksRepository } from 'src/infra/repositories/works/management/InsertWorksRepository';
import { SuspensionWorkRepository } from 'src/infra/repositories/works/management/suspensionWorkRepository';
import { UpdateNoteRepository } from 'src/infra/repositories/works/management/updateNoteRepository';
import { UpdateOvRepository } from 'src/infra/repositories/works/management/updateOvRepository';
import { UpdateWorkRepository } from 'src/infra/repositories/works/management/updateWorkRepository';
import { WorksController } from '../controllers/works/works.controller';
import { WorksInsertController } from '../controllers/works/worksInsert.controller';
import { WorksUpdateController } from '../controllers/works/worksUpdate.controller';
import { AuxiliaryBaseModule } from './auxiliaryBase.module';
import { UsersModule } from './users.module';
import { WorksServicesModule } from './worksServices.module';

@Module({
  imports: [
    CacheModule,
    UsersModule,
    forwardRef(() => WorksServicesModule),
    forwardRef(() => AuxiliaryBaseModule),
  ],
  controllers: [WorksController, WorksUpdateController, WorksInsertController],
  providers: [
    FindExistingWorksService,
    GetWorksInPortfolioService,
    GetAllWorksService,
    GetCompletedWorksService,
    GetWorkDetailsService,
    InsertWorksService,
    UpdateWorkService,
    HandleWorkUpdateService,
    ContractUpdateService,
    UpdateOvService,
    UpdateNoteService,
    SuspensionWorkService,
    DeadlineStatusService,
    { provide: CONTRACT_UPDATE_REPOSITORY, useClass: ContractUpdateRepository },
    { provide: UPDATE_OV_REPOSITORY, useClass: UpdateOvRepository },
    { provide: UPDATE_NOTE_REPOSITORY, useClass: UpdateNoteRepository },
    { provide: UPDATE_WORK_REPOSITORY, useClass: UpdateWorkRepository },
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
    { provide: INSERT_WORKS_REPOSITORY, useClass: InsertWorksRepository },
    {
      provide: FIND_EXISITING_WORKS_REPOSITORY,
      useClass: FindExistingWorksRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
    { provide: SUSPENSION_WORK_REPOSITORY, useClass: SuspensionWorkRepository },
  ],
  exports: [
    GET_WORKS_DETAILS_REPOSITORY,
    GetWorksInPortfolioService,
    GetCompletedWorksService,
    FindExistingWorksService,
    GetWorkDetailsService,
  ],
})
export class WorksModule {}
