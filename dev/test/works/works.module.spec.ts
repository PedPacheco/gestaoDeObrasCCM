import { Test, TestingModule } from '@nestjs/testing';
import { WorksModule } from 'src/modules/works/works.module';

describe('WorksModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WorksModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
