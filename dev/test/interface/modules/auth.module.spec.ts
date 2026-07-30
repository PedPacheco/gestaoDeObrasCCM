import { AuthService } from 'src/application/usecases/auth.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { AuthController } from 'src/interface/controllers/auth.controller';
import { AuthModule } from 'src/interface/modules/auth.module';
import { jwtConstants } from 'src/shared/costants';

import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AuthModule,
        PrismaModule,
        JwtModule.register({
          global: true,
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();
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
