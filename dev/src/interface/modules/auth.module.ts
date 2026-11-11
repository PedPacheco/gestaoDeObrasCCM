import { AuthService } from 'src/application/usecases/auth.service';
import { AUTH_REPOSITORY } from 'src/domain/contracts/IAuthRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { AuthRepository } from 'src/infra/repositories/authRepository';

import { Module } from '@nestjs/common';

import { AuthController } from '../controllers/auth.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule, CacheModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
