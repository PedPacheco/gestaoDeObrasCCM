import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ExportModule } from 'src/interface/modules/export.module';

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/application/users.service';

describe('ExportModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ExportModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('Should be defined', () => {
    expect(module).toBeDefined();
  });
});
