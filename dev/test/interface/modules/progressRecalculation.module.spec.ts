import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ProgressRecalculationModule } from 'src/interface/modules/progressRecalculation.module';

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/application/usecases/users.service';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

describe('ProgressRecalculationModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ProgressRecalculationModule, PrismaModule],
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
