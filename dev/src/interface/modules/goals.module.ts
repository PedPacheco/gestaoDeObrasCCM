import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { GoalsService } from '../../domain/services/goals.service';
import { GoalsController } from '../controllers/goals.controller';
import { GOALS_REPOSITORY } from 'src/domain/repositories/IGoalsRepository';
import { GoalsRepository } from 'src/infra/repositories/goalsRepository';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    { provide: GOALS_REPOSITORY, useClass: GoalsRepository },
  ],
})
export class GoalsModule {}
