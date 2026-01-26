import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { FeasibilityController } from '../controllers/feasibility.controller';
import { FeasibilityService } from 'src/application/feasibility.service';
import { FEASIBILITY_REPOSITORY } from 'src/domain/repositories/IFeasibilityRepository';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { FileService } from 'src/application/file.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    FeasibilityService,
    {
      provide: FEASIBILITY_REPOSITORY,
      useClass: FeasibilityRepository,
    },
  ],
  exports: [],
})
export class FeasibilityModule {}
