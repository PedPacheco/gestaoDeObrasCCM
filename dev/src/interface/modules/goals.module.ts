import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { GoalsService } from '../../domain/services/goals.service';
import { GoalsController } from '../controllers/goals.controller';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
