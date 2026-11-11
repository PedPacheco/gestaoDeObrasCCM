import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { WorksModule } from 'src/interface/modules/works.module';

import 'dotenv/config';

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'src/interface/modules/logger.module';
import { beforeEach } from 'vitest';

process.env.MULTER_DESTINATION ??= './tmp/test-uploads';

describe('WorksModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WorksModule, PrismaModule, LoggerModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
