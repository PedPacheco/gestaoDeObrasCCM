import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { WorksServicesModule } from 'src/interface/modules/worksServices.module';

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/application/usecases/users.service';

jest.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: jest.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

describe('WorksModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WorksServicesModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
