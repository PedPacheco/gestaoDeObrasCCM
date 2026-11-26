import { UsersService } from 'src/application/usecases/users.service';
import { USER_REPOSITORY } from 'src/domain/contracts/IUserRepository';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { UsersController } from 'src/interface/controllers/users.controller';
import { UsersModule } from 'src/interface/modules/users.module';

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule, PrismaModule],
    })
      .overrideProvider(DbSchema)
      .useValue({
        table: (name: string) => Prisma.raw(`schema_teste.${name}`),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide UsersService', () => {
    expect(module.get(UsersService)).toBeInstanceOf(UsersService);
  });

  it('should provide USER_REPOSITORY', () => {
    expect(module.get(USER_REPOSITORY)).toBeDefined();
  });

  it('should register UsersController', () => {
    expect(module.get(UsersController)).toBeInstanceOf(UsersController);
  });
});
