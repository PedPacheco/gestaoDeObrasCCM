import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [FiltersController],
  providers: [FiltersService, PrismaService],
})
export class FiltersModule {}
