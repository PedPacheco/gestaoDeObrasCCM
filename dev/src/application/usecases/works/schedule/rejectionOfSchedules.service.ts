import { RejectionOfSchedulesGetOutput } from 'src/application/types';
import {
  IRejectionOfSchedulesRepository,
  REJECTION_OF_SCHEDULES_REPOSITORY,
} from 'src/domain/contracts/works/schedule/IRejectionsOfSchedules';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RejectionsOfSchedulesService {
  constructor(
    @Inject(REJECTION_OF_SCHEDULES_REPOSITORY)
    private readonly rejectionOfSchedulesRepository: IRejectionOfSchedulesRepository,
  ) {}

  async get(workId: number): Promise<RejectionOfSchedulesGetOutput[]> {
    const response = await this.rejectionOfSchedulesRepository.get(workId);

    const formattedData = response.map(({ restricoes, ...item }) => ({
      ...item,
      motivo: restricoes?.restricao,
    }));

    return formattedData;
  }
}
