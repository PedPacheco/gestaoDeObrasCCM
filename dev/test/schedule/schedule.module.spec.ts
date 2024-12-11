import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { ScheduleModule } from 'src/modules/schedule/shedule.module';
import { UsersService } from 'src/modules/users/users.service';

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
