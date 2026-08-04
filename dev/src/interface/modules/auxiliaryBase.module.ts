import { forwardRef, Module } from '@nestjs/common';
import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { AuxiliaryMarketInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertMarket.service';
import { AuxiliaryNotesInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertNotes.service';
import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';
import { AuxiliaryBaseController } from '../controllers/auxiliaryBase.controller';
import { CapexGatewayModule } from './capex-gateway.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';

@Module({
  imports: [
    UsersModule,
    CapexGatewayModule, // Provê o CapexGateway para o controller
    forwardRef(() => WorksModule), // Necessário para o CapexFullPipelineService acessar UpdateCapexService
  ],
  controllers: [AuxiliaryBaseController],
  providers: [
    AuxiliaryBaseService,
    CapexProcessingService,
    CapexFullPipelineService, // Orquestrador do fluxo único
    AuxiliaryNotesInsertService,
    AuxiliaryMarketInsertService,
    {
      provide: AUXILIARY_BASE_REPOSITORY,
      useClass: AuxiliaryBaseRepository,
    },
  ],
  exports: [
    AuxiliaryBaseService,
    CapexProcessingService, // Exportado para uso eventual pelo WorksModule
    {
      provide: AUXILIARY_BASE_REPOSITORY,
      useClass: AuxiliaryBaseRepository,
    },
  ],
})
export class AuxiliaryBaseModule {}
