// src/interface/modules/file.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FILE_STORAGE } from 'src/domain/contracts/storage/IFileStorage';
import { LocalFileStorage } from 'src/infra/storage/localFileStorage';

@Module({
  imports: [ConfigModule],
  providers: [{ provide: FILE_STORAGE, useClass: LocalFileStorage }],
  exports: [FILE_STORAGE],
})
export class FileModule {}
