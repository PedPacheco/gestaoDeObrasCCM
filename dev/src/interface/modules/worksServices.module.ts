import { Module } from '@nestjs/common';
import { ServicesController } from '../controllers/worksServices.controller';
import { WorksServicesService } from 'src/application/worksServices.service';
import { WORKS_SERVICE_REPOSITORY } from 'src/domain/repositories/IWorksServiceRepository';
import { WorksServicesRepository } from 'src/infra/repositories/worksServicesRepository';

@Module({
  imports: [],
  controllers: [ServicesController],
  providers: [
    WorksServicesService,
    {
      provide: WORKS_SERVICE_REPOSITORY,
      useClass: WorksServicesRepository,
    },
  ],
})
export class WorksServicesModule {}
