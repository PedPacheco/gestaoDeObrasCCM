import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [GoalsController],
  providers: [GoalsService, PrismaService],
})
export class GoalsModule {}
