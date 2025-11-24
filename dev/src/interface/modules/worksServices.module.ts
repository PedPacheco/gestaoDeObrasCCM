import { WorksServicesService } from 'src/application/worksServices.service';
import { WORKS_SERVICE_REPOSITORY } from 'src/domain/repositories/IWorksServiceRepository';
import { WorksServicesRepository } from 'src/infra/repositories/worksServicesRepository';

import { Module } from '@nestjs/common';

import { ServicesController } from '../controllers/worksServices.controller';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';

@Module({
  imports: [UsersModule, WorksModule],
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
