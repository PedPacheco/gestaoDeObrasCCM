import { Module } from '@nestjs/common';
import { ServicesController } from '../controllers/services.controller';
import { GetServicesByWorkIdService } from 'src/application/services/getServicesByWorkId.service';
import { GET_SERVICES_BY_WORK_ID_REPOSITORY } from 'src/domain/repositories/services/IGetServicesByWorkIdRepository';
import { GetServicesByWorkIdRepository } from 'src/infra/repositories/services/getServicesByWorkIdRepository';

@Module({
  imports: [],
  controllers: [ServicesController],
  providers: [
    GetServicesByWorkIdService,
    {
      provide: GET_SERVICES_BY_WORK_ID_REPOSITORY,
      useClass: GetServicesByWorkIdRepository,
    },
  ],
})
export class ServicesModule {}
