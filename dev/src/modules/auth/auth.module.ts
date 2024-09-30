import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailService } from 'src/modules/email/email.service';
import { EmailModule } from 'src/modules/email/email.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [UsersModule, EmailModule, CacheModule],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
