import { ExecutionCapacityService } from 'src/application/usecases/executionCapacity.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { ExecutionCapacityRepository } from 'src/infra/repositories/executionCapacityRepository';

import { Module } from '@nestjs/common';

import { ExecutionCapacityController } from '../controllers/executionCapacity.controller';
import { UsersModule } from './users.module';

@Module({
  controllers: [ExecutionCapacityController],
  imports: [UsersModule],
  providers: [
    ExecutionCapacityService,
    {
      provide: EXECUTION_CAPACITY_REPOSITORY,
      useClass: ExecutionCapacityRepository,
    },
  ],
  exports: [],
})
export class ExecutionCapacityModule {}
