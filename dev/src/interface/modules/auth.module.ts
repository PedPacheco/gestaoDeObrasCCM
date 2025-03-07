import { AuthService } from 'src/domain/services/auth.service';
import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { AuthController } from '../controllers/auth.controller';
import { EmailModule } from './email.module';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule, EmailModule, CacheModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
