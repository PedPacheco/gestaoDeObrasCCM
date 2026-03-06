import { HandleWorkUpdateService } from 'src/application/services/orchestrators/handleWorkUpdate.service';
import { ContractUpdateService } from 'src/application/services/works/contractUpdate.service';
import { FindExistingWorksService } from 'src/application/services/works/findExistingWorks.service';
import { GetAllWorksService } from 'src/application/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/application/services/works/getWorksInPortfolio.service';
import { InsertWorksService } from 'src/application/services/works/InsertWorks.service';
import { SuspensionWorkService } from 'src/application/services/works/suspensionWork.service';
import { UpdateCapexService } from 'src/application/services/works/updateCapex.service';
import { UpdateNoteService } from 'src/application/services/works/updateNote.service';
import { UpdateOvService } from 'src/application/services/works/updateOv.service';
import { UpdateWorkService } from 'src/application/services/works/updateWork.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { CONTRACT_UPDATE_REPOSITORY } from 'src/domain/repositories/works/IContractUpdateRepository';
import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/repositories/works/IGetWorksInPortfolioRepository';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';
import { SUSPENSION_WORK_REPOSITORY } from 'src/domain/repositories/works/ISuspensionWorkRepository';
import { UPDATE_CAPEX_REPOSITORY } from 'src/domain/repositories/works/IUpdateCapexRepository';
import { UPDATE_NOTE_REPOSITORY } from 'src/domain/repositories/works/IUpdateNoteRepository';
import { UPDATE_OV_REPOSITORY } from 'src/domain/repositories/works/IUpdateOvRepository';
import { UPDATE_WORK_REPOSITORY } from 'src/domain/repositories/works/IUpdateWorkRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { ContractUpdateRepository } from 'src/infra/repositories/works/contractUpdateRepository';
import { FindExistingWorksRepository } from 'src/infra/repositories/works/findExistingWorksRepository';
import { GetAllWorksRepository } from 'src/infra/repositories/works/getAllWorksRepository';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/getWorksDetailsRepository';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/getWorksInPortfolioRepository';
import { InsertWorksRepository } from 'src/infra/repositories/works/InsertWorksRepository';
import { SuspensionWorkRepository } from 'src/infra/repositories/works/suspensionWorkRepository';
import { UpdateCapexRepository } from 'src/infra/repositories/works/UpdateCapexRepository';
import { UpdateNoteRepository } from 'src/infra/repositories/works/updateNoteRepository';
import { UpdateOvRepository } from 'src/infra/repositories/works/updateOvRepository';
import { UpdateWorkRepository } from 'src/infra/repositories/works/updateWorkRepository';

import { forwardRef, Module } from '@nestjs/common';

import { WorksController } from '../controllers/works/works.controller';
import { WorksInsertController } from '../controllers/works/worksInsert.controller';
import { WorksUpdateController } from '../controllers/works/worksUpdate.controller';
import { AuxiliaryBaseModule } from './auxiliaryBase.module';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule, forwardRef(() => AuxiliaryBaseModule)],
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
    UpdateCapexService,
    SuspensionWorkService,
    { provide: CONTRACT_UPDATE_REPOSITORY, useClass: ContractUpdateRepository },
    { provide: UPDATE_OV_REPOSITORY, useClass: UpdateOvRepository },
    { provide: UPDATE_NOTE_REPOSITORY, useClass: UpdateNoteRepository },
    { provide: UPDATE_CAPEX_REPOSITORY, useClass: UpdateCapexRepository },
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
    {
      provide: INSERT_WORKS_REPOSITORY,
      useClass: InsertWorksRepository,
    },
    {
      provide: FIND_EXISITING_WORKS_REPOSITORY,
      useClass: FindExistingWorksRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
    { provide: SUSPENSION_WORK_REPOSITORY, useClass: SuspensionWorkRepository },
  ],
  exports: [
    GetWorksInPortfolioService,
    GetCompletedWorksService,
    FindExistingWorksService,
    GetWorkDetailsService,
  ],
})
export class WorksModule {}
