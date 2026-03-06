import { UsersService } from 'src/application/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { WorksModule } from 'src/interface/modules/works.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('WorksModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WorksModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
