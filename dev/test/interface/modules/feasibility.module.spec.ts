import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { FeasibilityModule } from 'src/interface/modules/feasibility.module';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: jest.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

describe('MetasModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FeasibilityModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
