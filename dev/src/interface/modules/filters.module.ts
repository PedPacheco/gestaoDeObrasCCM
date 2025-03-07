import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { FiltersService } from '../../domain/services/filters.service';
import { FiltersController } from '../controllers/filters.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [FiltersController],
  providers: [FiltersService],
})
export class FiltersModule {}
