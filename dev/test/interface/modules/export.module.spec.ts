import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ExportModule } from 'src/interface/modules/export.module';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: jest.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

describe('ExportModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ExportModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('Should be defined', () => {
    expect(module).toBeDefined();
  });
});
