import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

describe('PrismaModule', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(DbSchema)
      .useValue({
        table: (name: string) => Prisma.raw(`schema_teste.${name}`),
      })
      .compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });
});
