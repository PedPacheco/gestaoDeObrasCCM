import { UsersService } from 'src/domain/services/users.service';
import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { GoalsService } from '../../domain/services/goals/goals.service';
import { RdaGoalsService } from '../../domain/services/goals/rdaGoals.service';
import { GoalsController } from '../controllers/goals.controller';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [GoalsService, UsersService, RdaGoalsService],
})
export class GoalsModule {}
