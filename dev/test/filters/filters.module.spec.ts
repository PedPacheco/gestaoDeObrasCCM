import { Test, TestingModule } from '@nestjs/testing';
import { FiltersModule } from 'src/modules/filters/filters.module';

describe('FiltersModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FiltersModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
