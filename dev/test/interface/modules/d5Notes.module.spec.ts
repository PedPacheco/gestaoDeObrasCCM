import { UsersService } from 'src/application/usecases/users.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

import 'dotenv/config';

import { Test, TestingModule } from '@nestjs/testing';
import { D5NotesModule } from 'src/interface/modules/d5Notes.module';

process.env.UPLOAD_D5_PATH ??= './tmp/test-uploads/d5';
process.env.UPLOAD_EXECUTION_REPORT_PATH ??=
  './tmp/test-uploads/execution-report';

describe('D5NotesModule', () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [D5NotesModule, PrismaModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
