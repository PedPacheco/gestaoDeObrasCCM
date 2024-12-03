import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { WorksController } from './works.controller';
import { CacheModule } from 'src/cache/cache.module';
import { GetAllWorksService } from './services/getAllWorks.service';
import { GetWorksInPortfolioService } from './services/getWorksInPortfolio.service';
import { GetCompletedWorksService } from './services/getCompletedWorks.service';
import { GetWorkDetailsService } from './services/getWorkDetails.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [CacheModule],
  controllers: [WorksController],
  providers: [
    PrismaService,
    GetWorksInPortfolioService,
    GetAllWorksService,
    GetCompletedWorksService,
    GetWorkDetailsService,
    UsersService,
  ],
})
export class WorksModule {}
