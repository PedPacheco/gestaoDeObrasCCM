import { UsersService } from 'src/application/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ExecutionCapacityModule } from 'src/interface/modules/executionCapacity.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('ExecutionCapacityModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ExecutionCapacityModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
