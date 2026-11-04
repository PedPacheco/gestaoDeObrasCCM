import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';
import { UpdateCapexService } from 'src/application/usecases/works/management/updateCapex.service';

import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { CAPEX_FILE_PARSER } from 'src/domain/contracts/ICapexFileParser';
import { UPDATE_CAPEX_REPOSITORY } from 'src/domain/contracts/works/management/IUpdateCapexRepository';
import { CapexCalculatorService } from 'src/domain/services/capexCalculator.service';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';
import { UpdateCapexRepository } from 'src/infra/repositories/works/management/updateCapexRepository';
import { WorkerCapexFileParser } from 'src/infra/spreadsheet/capex/workerCapexFileParser';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { CapexController } from '../controllers/capex.controller';
import { CapexGatewayModule } from './capex-gateway.module';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Fluxo de importação + atualização do CAPEX.
 *
 * Concentra pipeline, serviços, parser, repositórios e controller num único
 * módulo, sem depender de WorksModule/AuxiliaryBaseModule (nem de forwardRef).
 * O repositório da base auxiliar é stateless (só usa o PrismaService global),
 * então este módulo tem a própria instância.
 */
@Module({
  imports: [
    CapexGatewayModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createMulterConfig({
          destination:
            config.get<string>('UPLOAD_CAPEX_IMPORTS') ?? './uploads/imports',
          allowedMimeTypes: [XLSX_MIME],
          allowedExtensions: ['.xlsx'],
          maxSize: 150 * 1024 * 1024, // 150 MB
          maxFiles: 1,
        }),
    }),
  ],
  controllers: [CapexController],
  providers: [
    CapexFullPipelineService,
    CapexProcessingService,
    UpdateCapexService,
    CapexCalculatorService,
    { provide: CAPEX_FILE_PARSER, useClass: WorkerCapexFileParser },
    { provide: AUXILIARY_BASE_REPOSITORY, useClass: AuxiliaryBaseRepository },
    { provide: UPDATE_CAPEX_REPOSITORY, useClass: UpdateCapexRepository },
  ],
})
export class CapexModule {}
