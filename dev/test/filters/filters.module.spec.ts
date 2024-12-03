import { Test, TestingModule } from '@nestjs/testing';
import { FiltersModule } from 'src/modules/filters/filters.module';
import { UsersService } from 'src/modules/users/users.service';

describe('FiltersModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FiltersModule],
    })

      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
