// src/interface/modules/file.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DownloadFileService } from 'src/application/usecases/downloadFile.service';
import { FILE_STORAGE } from 'src/domain/contracts/storage/IFileStorage';
import { LocalFileStorage } from 'src/infra/storage/localFileStorage';
import { FilesController } from '../controllers/files.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [
    { provide: FILE_STORAGE, useClass: LocalFileStorage },
    DownloadFileService,
  ],
  exports: [FILE_STORAGE],
})
export class FileModule {}
