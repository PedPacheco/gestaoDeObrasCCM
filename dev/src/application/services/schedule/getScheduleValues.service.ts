import {
  GET_SCHEDULE_VALUES_REPOSITORY,
  IGetScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Inject, Injectable } from '@nestjs/common';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

@Injectable()
export class GetScheduleValuesService {
  constructor(
    @Inject(GET_SCHEDULE_VALUES_REPOSITORY)
    private readonly getScheduleValuesRepository: IGetScheduleValuesRepository,
    private readonly deadlineStatusService: DeadlineStatusService,
  ) {}

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponse> {
    const { works, resultTotals } =
      await this.getScheduleValuesRepository.getValues(filters);

    const totals = this.buildTotals(resultTotals[0]);

    const worksWithRestrictionVerification = works.map((work) => {
      return {
        ...work,
        restricao_aberta: this.hasOpenRestriction(work),
        status_prazo: this.deadlineStatusService.calculate(work),
      };
    });

    const response: GetScheduleValuesResponse = {
      works: worksWithRestrictionVerification,
      totals,
    };

    return response;
  }

  private buildTotals(rawTotals: any) {
    return {
      total_obras: Number(rawTotals.total_obras),
      total_mo_planejada: rawTotals.total_mo_planejada || 0,
      total_mo_exec: rawTotals.total_mo_exec || 0,
      total_qtde_planejada: rawTotals.total_qtde_planejada || 0,
    };
  }

  private hasOpenRestriction(work: any): boolean {
    const {
      id_restricao_prog1,
      id_restricao_prog2,
      status_restricao1,
      status_restricao2,
      data_resolucao1,
      data_resolucao2,
    } = work;

    const hasRestriction1 = id_restricao_prog1 !== 1;
    const isUnresolved1 = hasRestriction1 && status_restricao1 !== 'Resolvido';
    const hasNoResolutionDate1 = hasRestriction1 && !data_resolucao1;

    const hasRestriction2 = id_restricao_prog2 !== 1;
    const isUnresolved2 = hasRestriction2 && status_restricao2 !== 'Resolvido';
    const hasNoResolutionDate2 = hasRestriction2 && !data_resolucao2;

    if (!hasRestriction1 && !hasRestriction2) {
      return false;
    }

    const restriction1Open =
      hasRestriction1 && isUnresolved1 && hasNoResolutionDate1;
    const restriction2Open =
      hasRestriction2 && isUnresolved2 && hasNoResolutionDate2;

    return restriction1Open || restriction2Open;
  }
}
