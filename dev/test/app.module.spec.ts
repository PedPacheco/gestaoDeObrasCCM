import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AppModule } from 'src/app.module';

import { Test, TestingModule } from '@nestjs/testing';

// Requer as variáveis de ambiente lidas pelo ConfigService
// (DATABASE_URL, JWT_SECRECT, UPLOAD_AS_BUILD, UPLOAD_CAPEX_IMPORTS, UPLOAD_DEST).
describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: vi.fn(), $disconnect: vi.fn() })
      .compile();
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  // TODO: validar providers globais (guards, filters, interceptors) registrados no AppModule
  it.todo('should register global providers');
});
