import { UsersService } from 'src/domain/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ScheduleModule } from 'src/interface/modules/shedule.module';

import { Test, TestingModule } from '@nestjs/testing';

describe('ScheduleModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
