import { AuxiliaryBaseService } from 'src/application/auxiliaryBase/auxiliaryBase.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';

import { forwardRef, Module } from '@nestjs/common';

import { AuxiliaryBaseController } from '../controllers/auxiliaryBase.controller';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { AuxiliaryNotesInsertService } from 'src/application/auxiliaryBase/auxiliaryBaseInsertNotes.service';
import { AuxiliaryMarketInsertService } from 'src/application/auxiliaryBase/auxiliaryBaseInsertMarket.service';

@Module({
  imports: [UsersModule, forwardRef(() => WorksModule)],
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
  exports: [
    AuxiliaryBaseService,
    {
      provide: AUXILIARY_BASE_REPOSITORY,
      useClass: AuxiliaryBaseRepository,
    },
  ],
})
export class AuxiliaryBaseModule {}
