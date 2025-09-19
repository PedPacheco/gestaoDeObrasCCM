import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GET_SERVICES_BY_WORK_ID_REPOSITORY,
  IGetServicesByWorkIdRepository,
} from 'src/domain/repositories/services/IGetServicesByWorkIdRepository';

@Injectable()
export class GetServicesByWorkIdService {
  constructor(
    @Inject(GET_SERVICES_BY_WORK_ID_REPOSITORY)
    private readonly getServicesByIdRepository: IGetServicesByWorkIdRepository,
  ) {}

  async get(id: number) {
    const services = await this.getServicesByIdRepository.get(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services;
  }
}
