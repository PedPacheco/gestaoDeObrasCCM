import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule } from 'src/modules/schedule/shedule.module';

describe('ScheduleModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
