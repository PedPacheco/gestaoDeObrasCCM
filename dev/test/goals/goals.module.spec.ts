import { Test, TestingModule } from '@nestjs/testing';
import { GoalsModule } from 'src/modules/goals/goals.module';

describe('MetasModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GoalsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
