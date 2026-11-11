import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ExportModule } from 'src/interface/modules/export.module';

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'src/interface/modules/logger.module';

vi.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: vi.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

describe('ExportModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ExportModule, PrismaModule, LoggerModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('Should be defined', () => {
    expect(module).toBeDefined();
  });
});
