import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import { Test, TestingModule } from '@nestjs/testing';
import { AdvancePartnerModule } from 'src/interface/modules/advancePartner.module';

describe('AdvancePartnerModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdvancePartnerModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
