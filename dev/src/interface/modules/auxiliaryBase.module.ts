import { forwardRef, Module } from '@nestjs/common';
import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { AuxiliaryMarketInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertMarket.service';
import { AuxiliaryNotesInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertNotes.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';
import { AuxiliaryBaseController } from '../controllers/auxiliaryBase.controller';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';

@Module({
  imports: [
    UsersModule,
    // AuxiliaryNotesInsertService usa FindExistingWorksService (WorksModule), e o
    // WorksModule usa o AuxiliaryBaseService: o ciclo é entre notas/obras e
    // não tem relação com o CAPEX, que agora vive no CapexModule.
    forwardRef(() => WorksModule),
  ],
  controllers: [AuxiliaryBaseController],
  providers: [
    AuxiliaryBaseService,
    AuxiliaryNotesInsertService,
    AuxiliaryMarketInsertService,
    {
      provide: AUXILIARY_BASE_REPOSITORY,
      useClass: AuxiliaryBaseRepository,
    },
  ],
  exports: [AuxiliaryBaseService, AUXILIARY_BASE_REPOSITORY],
})
export class AuxiliaryBaseModule {}
