import {
  GET_PENDING_SCHEDULE_VALUES_REPOSITORY,
  IGetPendingScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetPendingScheduleValuesRepository';
import { GetPendingScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetPendingScheduleValuesResponse } from 'src/interface/types/schedule/getPendingScheduleValuesInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetPendingScheduleValuesService {
  constructor(
    @Inject(GET_PENDING_SCHEDULE_VALUES_REPOSITORY)
    private getPendingScheduleValuesRepository: IGetPendingScheduleValuesRepository,
  ) {}

  async getValues(
    filters: GetPendingScheduleValuesDTO,
  ): Promise<GetPendingScheduleValuesResponse> {
    return await this.getPendingScheduleValuesRepository.getValues(filters);
  }
}
