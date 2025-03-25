import { UsersService } from 'src/domain/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { FiltersModule } from 'src/interface/modules/filters.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('FiltersModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FiltersModule, PrismaModule],
    })

      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
