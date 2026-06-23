import { ContingencyService } from 'src/application/usecases/contingency.service';
import { CONTINGENCY_REPOSITORY } from 'src/domain/repositories/IContingencyRepository';
import { ContingencyRepository } from 'src/infra/repositories/contingencyRepository';

import { Module } from '@nestjs/common';

import { ContingencyController } from '../controllers/contingency.controller';

@Module({
  controllers: [ContingencyController],
  providers: [
    ContingencyService,
    {
      provide: CONTINGENCY_REPOSITORY,
      useClass: ContingencyRepository,
    },
  ],
  exports: [ContingencyService],
})
export class ContingencyModule {}
