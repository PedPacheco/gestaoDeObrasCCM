import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { UsersService } from 'src/application/usecases/users.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { AuxiliaryBaseController } from 'src/interface/controllers/auxiliaryBase.controller';
import { AuxiliaryBaseModule } from 'src/interface/modules/auxiliaryBase.module';

import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

describe('AuxiliaryBaseModule', () => {
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
              UPLOAD_CAPEX_IMPORTS: '/tmp/capex_imports',
            }),
          ],
        }),
        JwtModule.register({ global: true, secret: 'test-secret' }),
        PrismaModule,
        AppModule,
        AuxiliaryBaseModule,
      ],
    })
      // evita instanciar o grafo completo de UsersModule/WorksModule
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuxiliaryBaseService', () => {
    expect(module.get(AuxiliaryBaseService)).toBeDefined();
  });

  it('should provide AUXILIARY_BASE_REPOSITORY', () => {
    expect(module.get(AUXILIARY_BASE_REPOSITORY)).toBeDefined();
  });

  it('should register AuxiliaryBaseController', () => {
    expect(module.get(AuxiliaryBaseController)).toBeDefined();
  });
});
