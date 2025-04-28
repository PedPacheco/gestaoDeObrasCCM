import {
  GET_SCHEDULE_VALUES_REPOSITORY,
  IGetScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetScheduleValuesService {
  constructor(
    @Inject(GET_SCHEDULE_VALUES_REPOSITORY)
    private readonly getScheduleValuesRepository: IGetScheduleValuesRepository,
  ) {}

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponse> {
    const { works, resultTotals } =
      await this.getScheduleValuesRepository.getValues(filters);

    const totals = {
      total_obras: Number(resultTotals[0].total_obras),
      total_mo_planejada: resultTotals[0].total_mo_planejada || 0,
      total_mo_exec: resultTotals[0].total_mo_exec || 0,
      total_qtde_planejada: resultTotals[0].total_qtde_planejada || 0,
    };

    const response: GetScheduleValuesResponse = {
      works,
      totals,
    };

    return response;
  }
}
