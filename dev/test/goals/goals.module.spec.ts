import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { GoalsModule } from 'src/modules/goals/goals.module';
import { UsersService } from 'src/modules/users/users.service';

describe('MetasModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GoalsModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
