import { Module } from '@nestjs/common';
import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';

@Module({
  providers: [
    ProgressRecalculationService,
    { provide: WORK_SERVICES_REPOSITORY, useClass: WorkServicesRepository },
  ],
  exports: [ProgressRecalculationService, WORK_SERVICES_REPOSITORY],
})
export class ProgressRecalculationModule {}
