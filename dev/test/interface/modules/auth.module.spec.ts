import { AuthService } from 'src/application/usecases/auth.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { AuthController } from 'src/interface/controllers/auth.controller';
import { AuthModule } from 'src/interface/modules/auth.module';

import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AuthModule,
        PrismaModule,
        JwtModule.register({
          global: true,
          secret: 'jwtConstants.secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    })
      .overrideProvider(DbSchema)
      .useValue({
        table: (name: string) => Prisma.raw(`schema_teste.${name}`),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it('should provide AuthController', () => {
    const authController = module.get<AuthController>(AuthController);
    expect(authController).toBeDefined();
  });
});
