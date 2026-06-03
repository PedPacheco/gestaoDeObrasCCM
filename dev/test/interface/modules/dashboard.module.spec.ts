import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardModule } from 'src/interface/modules/dashboard.module';

describe('DashboardModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DashboardModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
