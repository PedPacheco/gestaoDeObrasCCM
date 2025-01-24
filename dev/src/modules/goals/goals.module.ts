import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CacheModule } from 'src/cache/cache.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [GoalsService, UsersService],
})
export class GoalsModule {}
