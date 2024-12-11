import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { ExportModule } from 'src/modules/export/export.module';
import { UsersService } from 'src/modules/users/users.service';

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
