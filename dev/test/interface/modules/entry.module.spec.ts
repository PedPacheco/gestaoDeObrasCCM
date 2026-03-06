import { UsersService } from 'src/application/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { EntryModule } from 'src/interface/modules/entry.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('EntryModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EntryModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
