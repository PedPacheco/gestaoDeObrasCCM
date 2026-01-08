import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ScheduleModule } from 'src/interface/modules/schedule.module';

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/application/users.service';

jest.mock('src/shared/multer/multer.config', () => ({
  createMulterConfig: jest.fn().mockReturnValue({
    storage: { mock: true },
  }),
}));

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
