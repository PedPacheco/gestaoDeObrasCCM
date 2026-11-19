import { AuthService } from 'src/application/usecases/auth.service';
import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { AuthController } from '../controllers/auth.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule, CacheModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
