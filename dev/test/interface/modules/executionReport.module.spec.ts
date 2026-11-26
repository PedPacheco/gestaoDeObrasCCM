import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { UsersService } from 'src/application/usecases/users.service';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/contracts/IExecutionReportRepository';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { ExecutionReportController } from 'src/interface/controllers/executionReport.controller';
import { ExecutionReportModule } from 'src/interface/modules/executionReport.module';
import { LoggerModule } from 'src/interface/modules/logger.module';

describe('ExecutionReportModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              UPLOAD_AS_BUILD: '/tmp/as_build',
              UPLOAD_DEST: '/tmp/viabilidade',
            }),
          ],
        }),
        JwtModule.register({ global: true, secret: 'test-secret' }),
        LoggerModule,
        ExecutionReportModule,
        PrismaModule,
      ],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .overrideProvider(DbSchema)
      .useValue({
        table: (name: string) => Prisma.raw(`schema_teste.${name}`),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ExecutionReportService', () => {
    expect(module.get(ExecutionReportService)).toBeDefined();
  });

  it('should provide EXECUTION_REPORT_REPOSITORY', () => {
    expect(module.get(EXECUTION_REPORT_REPOSITORY)).toBeDefined();
  });

  it('should register ExecutionReportController', () => {
    expect(module.get(ExecutionReportController)).toBeDefined();
  });
});
