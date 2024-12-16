import { Module } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { CacheModule } from 'src/cache/cache.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [FiltersController],
  providers: [FiltersService],
})
export class FiltersModule {}
