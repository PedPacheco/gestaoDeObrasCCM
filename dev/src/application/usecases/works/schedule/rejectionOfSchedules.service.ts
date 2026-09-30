import { Inject, Injectable } from '@nestjs/common';
import {
  IRejectionOfSchedulesRepository,
  REJECTION_OF_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IRejectionsOfSchedules';

@Injectable()
export class RejectionsOfSchedulesService {
  constructor(
    @Inject(REJECTION_OF_SCHEDULES_REPOSITORY)
    private readonly rejectionOfSchedulesRepository: IRejectionOfSchedulesRepository,
  ) {}

  async get(idWork: number): Promise<any[]> {
    const response = await this.rejectionOfSchedulesRepository.get(idWork);

    const formattedData = response.map(({ restricoes, ...item }) => ({
      ...item,
      motivo: restricoes?.restricao,
    }));

    return formattedData;
  }
}
