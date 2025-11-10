import { Module } from '@nestjs/common';
import { ExecutionCapacityController } from '../controllers/executionCapacity.controller';
import { ExecutionCapacityService } from 'src/application/executionCapacity.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { ExecutionCapacityRepository } from 'src/infra/repositories/executionCapacityRepository';

@Module({
  controllers: [ExecutionCapacityController],
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
