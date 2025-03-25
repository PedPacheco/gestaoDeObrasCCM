import { UsersService } from 'src/domain/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { GoalsModule } from 'src/interface/modules/goals.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('MetasModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GoalsModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
