import { Test, TestingModule } from '@nestjs/testing';
import { EntryModule } from 'src/modules/entry/entry.module';

describe('EntryModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EntryModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
