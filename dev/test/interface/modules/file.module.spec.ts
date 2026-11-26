import { DownloadFileService } from 'src/application/usecases/downloadFile.service';
import { FILE_STORAGE } from 'src/domain/contracts/storage/IFileStorage';
import { FilesController } from 'src/interface/controllers/files.controller';
import { FileModule } from 'src/interface/modules/file.module';

import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('FileModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              UPLOAD_AS_BUILD: '/tmp/as_build',
              UPLOAD_DEST: '/tmp/viabilidade',
            }),
          ],
        }),
        FileModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide FILE_STORAGE', () => {
    expect(module.get(FILE_STORAGE)).toBeDefined();
  });

  it('should provide DownloadFileService', () => {
    expect(module.get(DownloadFileService)).toBeInstanceOf(DownloadFileService);
  });

  it('should register FilesController', () => {
    expect(module.get(FilesController)).toBeInstanceOf(FilesController);
  });
});
