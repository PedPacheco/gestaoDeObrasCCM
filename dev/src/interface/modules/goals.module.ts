import { GoalsService } from 'src/application/usecases/goals.service';
import { GOALS_REPOSITORY } from 'src/domain/contracts/IGoalsRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { GoalsRepository } from 'src/infra/repositories/goalsRepository';

import { Module } from '@nestjs/common';

import { GoalsController } from '../controllers/goals.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    { provide: GOALS_REPOSITORY, useClass: GoalsRepository },
  ],
  exports: [GoalsService],
})
export class GoalsModule {}
