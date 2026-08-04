import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FileService } from 'src/application/usecases/file.service';
import { FEASIBILITY_REPOSITORY } from 'src/domain/contracts/IFeasibilityRepository';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { FeasibilityController } from '../controllers/feasibility.controller';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/contracts/IStatusFlowRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const multerCfg = createMulterConfig({
          destination: config.get<string>('UPLOAD_DEST'),
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/png',
            'image/heic',
            'image/heif',
          ],
          allowedExtensions: [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.tiff',
            '.heic',
            '.heif',
          ],
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
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
  exports: [],
})
export class FeasibilityModule {}
