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

    const worksWithRestrictionVerification = works.map((work) => {
      const {
        id_restricao_prog1,
        id_restricao_prog2,
        status_restricao1,
        status_restricao2,
        data_resolucao1,
        data_resolucao2,
      } = work;

      let restricao_aberta: boolean = false;

      if (id_restricao_prog1 !== 1 || id_restricao_prog2 !== 1) {
        if (
          (status_restricao1 !== 'Resolvido' ||
            status_restricao2 !== 'Resolvido') &&
          (!data_resolucao1 || !data_resolucao2)
        ) {
          restricao_aberta = true;
        }
      }

      return {
        ...work,
        restricao_aberta,
      };
    });

    const response: GetScheduleValuesResponse = {
      works: worksWithRestrictionVerification,
      totals,
    };

    return response;
  }
}
