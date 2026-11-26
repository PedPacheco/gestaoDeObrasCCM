import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { FeasibilityModule } from 'src/interface/modules/feasibility.module';

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

vi.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: vi.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

describe('MetasModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FeasibilityModule, PrismaModule],
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
