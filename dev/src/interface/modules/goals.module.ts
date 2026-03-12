import { GoalsService } from 'src/application/usecases/goals.service';
import { GOALS_REPOSITORY } from 'src/domain/repositories/IGoalsRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { GoalsRepository } from 'src/infra/repositories/goalsRepository';

import { Module } from '@nestjs/common';

import { GoalsController } from '../controllers/goals.controller';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    { provide: GOALS_REPOSITORY, useClass: GoalsRepository },
  ],
})
export class GoalsModule {}
