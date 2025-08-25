import { FiltersService } from 'src/application/filters.service';
import { FILTERS_REPOSITORY } from 'src/domain/repositories/IFiltersRepository';
import { CacheModule } from 'src/infra/cache/cache.module';
import { FiltersRepository } from 'src/infra/repositories/filtersRepository';

import { Module } from '@nestjs/common';

import { FiltersController } from '../controllers/filters.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [FiltersController],
  providers: [
    FiltersService,
    { provide: FILTERS_REPOSITORY, useClass: FiltersRepository },
  ],
})
export class FiltersModule {}
