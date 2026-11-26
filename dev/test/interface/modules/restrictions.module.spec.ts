import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { RestrictionsModule } from 'src/interface/modules/restrictions.module';

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

describe('RestrictionsModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RestrictionsModule, PrismaModule],
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
