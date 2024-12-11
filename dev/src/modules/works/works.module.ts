import { Module } from '@nestjs/common';
import { WorksController } from './works.controller';
import { CacheModule } from 'src/cache/cache.module';
import { GetAllWorksService } from './services/getAllWorks.service';
import { GetWorksInPortfolioService } from './services/getWorksInPortfolio.service';
import { GetCompletedWorksService } from './services/getCompletedWorks.service';
import { GetWorkDetailsService } from './services/getWorkDetails.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CacheModule, UsersModule],
  controllers: [WorksController],
  providers: [
    GetWorksInPortfolioService,
    GetAllWorksService,
    GetCompletedWorksService,
    GetWorkDetailsService,
  ],
  exports: [GetWorksInPortfolioService, GetCompletedWorksService],
})
export class WorksModule {}
