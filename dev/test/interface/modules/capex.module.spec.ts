import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';
import { UpdateCapexService } from 'src/application/usecases/works/management/updateCapex.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { CAPEX_FILE_PARSER } from 'src/domain/contracts/ICapexFileParser';
import { UPDATE_CAPEX_REPOSITORY } from 'src/domain/contracts/works/management/IUpdateCapexRepository';
import { CapexCalculatorService } from 'src/domain/services/capexCalculator.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { CapexController } from 'src/interface/controllers/capex.controller';
import { CapexModule } from 'src/interface/modules/capex.module';

import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

describe('CapexModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ UPLOAD_CAPEX_IMPORTS: '/tmp/capex_imports' })],
        }),
        JwtModule.register({ global: true, secret: 'test-secret' }),
        PrismaModule,
        AppModule,
        CapexModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it.each([
    ['CapexFullPipelineService', CapexFullPipelineService],
    ['CapexProcessingService', CapexProcessingService],
    ['UpdateCapexService', UpdateCapexService],
    ['CapexCalculatorService', CapexCalculatorService],
    ['CapexController', CapexController],
    ['CAPEX_FILE_PARSER', CAPEX_FILE_PARSER],
    ['AUXILIARY_BASE_REPOSITORY', AUXILIARY_BASE_REPOSITORY],
    ['UPDATE_CAPEX_REPOSITORY', UPDATE_CAPEX_REPOSITORY],
  ])('should provide %s', (_name, token) => {
    expect(module.get(token as any)).toBeDefined();
  });
});
