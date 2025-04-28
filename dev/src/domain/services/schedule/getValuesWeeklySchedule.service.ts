import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';
import {
  GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY,
  IGetValuesWeeklyScheduleRepository,
} from 'src/domain/repositories/schedule/IGetValuesWeeklyScheduleRepository';
import { GetValuesWeeklyScheduleResponseService } from 'src/interface/types/schedule/getValuesWeeklyScheduleInterface';

@Injectable()
export class GetValuesWeeklyScheduleService {
  constructor(
    @Inject(GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY)
    private getValuesWeeklyScheduleRepository: IGetValuesWeeklyScheduleRepository,
  ) {}

  async getValues(
    filters: GetValueWeeklyScheduleDTO,
  ): Promise<GetValuesWeeklyScheduleResponseService[]> {
    const works =
      await this.getValuesWeeklyScheduleRepository.getValues(filters);

    return works.map((work) => ({
      id: work.id,
      ovnota: work.ovnota,
      tipo_abrev: work.tipos.tipo_abrev,
      programacoes: work.programacoes,
      parceira: work.turmas.turma,
    }));
  }
}
