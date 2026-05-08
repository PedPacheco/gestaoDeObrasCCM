import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentsModule } from 'src/interface/modules/equipments.module';

describe('EquipmentsModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EquipmentsModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
