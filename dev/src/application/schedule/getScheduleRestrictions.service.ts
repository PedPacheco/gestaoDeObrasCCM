// import * as moment from 'moment';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';
import {
  GET_SCHEDULE_RESTRICTIONS_REPOSITORY,
  IGetScheduleRestrictionsRepository,
} from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';

@Injectable()
export class GetScheduleRestrictionsService {
  constructor(
    @Inject(GET_SCHEDULE_RESTRICTIONS_REPOSITORY)
    private getSchedulerestrictionsRepository: IGetScheduleRestrictionsRepository,
  ) {}

  async getRestrictions(filters: GetValueWeeklyScheduleDTO) {
    const result =
      await this.getSchedulerestrictionsRepository.getRestrictions(filters);

    const totals = { total_obras: Number(result.totals[0].total_obras) };

    return { works: result.works, totals };
  }
}
