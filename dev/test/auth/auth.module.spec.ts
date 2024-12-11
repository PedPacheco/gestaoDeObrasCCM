import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/modules/email/email.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { jwtConstants } from 'src/config/costants';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthController } from 'src/modules/auth/auth.controller';
import { PrismaModule } from 'src/config/prisma/prisma.module';

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

  it('should provide EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeDefined();
  });
});
