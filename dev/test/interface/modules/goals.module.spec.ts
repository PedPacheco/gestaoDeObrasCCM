import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from 'src/application/usecases/users.service';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { GoalsModule } from 'src/interface/modules/goals.module';

describe('MetasModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GoalsModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .overrideProvider(DbSchema)
      .useValue({
        table: (name: string) => Prisma.raw(`schema_teste.${name}`),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
