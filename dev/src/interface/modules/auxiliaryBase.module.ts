import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { AuxiliaryBaseService } from 'src/domain/services/auxiliaryBase.service';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';

import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { AuxiliaryBaseController } from '../controllers/auxiliaryBase.controller';
import { WorksModule } from './works.module';

@Module({
  imports: [UsersModule, forwardRef(() => WorksModule)],
  controllers: [AuxiliaryBaseController],
  providers: [
    AuxiliaryBaseService,
    {
      provide: AUXILIARY_BASE_REPOSITORY,
      useClass: AuxiliaryBaseRepository,
    },
  ],
  exports: [AuxiliaryBaseService],
})
export class AuxiliaryBaseModule {}
