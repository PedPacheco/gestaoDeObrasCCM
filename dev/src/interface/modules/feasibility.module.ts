import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FileService } from 'src/application/usecases/file.service';
import { FEASIBILITY_REPOSITORY } from 'src/domain/contracts/IFeasibilityRepository';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/contracts/IStatusFlowRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { DOCUMENT_UPLOAD_PRESET } from 'src/shared/upload/uploadPresets';
import { FeasibilityController } from '../controllers/feasibility.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createMulterConfig({
          destination: config.get<string>('UPLOAD_DEST'),
          ...DOCUMENT_UPLOAD_PRESET,
        }),
    }),
  ],
  controllers: [FeasibilityController],
  providers: [
    FileService,
    HandleFeasibilityService,
    FeasibilityService,
    {
      provide: FEASIBILITY_REPOSITORY,
      useClass: FeasibilityRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
  ],
  exports: [FeasibilityService],
})
export class FeasibilityModule {}
