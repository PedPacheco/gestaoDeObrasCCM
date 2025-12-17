import { UsersService } from 'src/application/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import { Test, TestingModule } from '@nestjs/testing';
import { RestrictionsModule } from 'src/interface/modules/restrictions.module';

describe('RestrictionsModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RestrictionsModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
