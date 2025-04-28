import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

import { FiltersService } from '../../domain/services/filters.service';
import { FiltersController } from '../controllers/filters.controller';
import { UsersModule } from './users.module';
import { FILTERS_REPOSITORY } from 'src/domain/repositories/IFiltersRepository';
import { FiltersRepository } from 'src/infra/repositories/filtersRepository';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [FiltersController],
  providers: [
    FiltersService,
    { provide: FILTERS_REPOSITORY, useClass: FiltersRepository },
  ],
})
export class FiltersModule {}
