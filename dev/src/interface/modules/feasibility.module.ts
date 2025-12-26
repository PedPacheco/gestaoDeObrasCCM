import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { FeasibilityController } from '../controllers/feasibility.controller';
import { FeasibilityService } from 'src/application/feasibility.service';
import { FEASIBILITY_REPOSITORY } from 'src/domain/repositories/IFeasibilityRepository';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { FileService } from 'src/application/file.service';

@Module({
  imports: [
    MulterModule.register(
      createMulterConfig({
        destination: process.env.UPLOAD_DEST,
        allowedMimeTypes: ['application/pdf', 'image/jpeg'],
        maxSize: 5 * 1024 * 1024,
        maxFiles: 3,
      }),
    ),
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
