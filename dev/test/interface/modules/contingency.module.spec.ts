import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import { Test, TestingModule } from '@nestjs/testing';
import { ContingencyModule } from 'src/interface/modules/contingency.module';

describe('ContingencyModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ContingencyModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
