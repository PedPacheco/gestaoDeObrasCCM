import { UsersService } from 'src/application/services/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ScheduleModule } from 'src/interface/modules/schedule.module';

import { Test, TestingModule } from '@nestjs/testing';

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
