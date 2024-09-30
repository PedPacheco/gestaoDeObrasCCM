import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [WorksController],
  providers: [PrismaService, WorksService],
})
export class WorksModule {}
