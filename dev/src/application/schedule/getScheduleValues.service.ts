import {
  GET_SCHEDULE_VALUES_REPOSITORY,
  IGetScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';

enum DeadlineStatus {
  OVERDUE = 'Prazo vencido',
  CRITICAL = 'Crítico',
  ATTENTION = 'Atenção',
  ON_TIME = 'No prazo',
}

const DEADLINE_THRESHOLDS = {
  CRITICAL_DAYS: 16,
  ATTENTION_DAYS: 30,
  ATTENTION_MIN_DAYS: 17,
} as const;

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

    const totals = this.buildTotals(resultTotals[0]);

    const worksWithRestrictionVerification = works.map((work) => {
      return {
        ...work,
        restricao_aberta: this.hasOpenRestriction(work),
        status_prazo: this.calculateDeadlineStatus(work),
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

  private calculateDeadlineStatus(work: any): string | undefined {
    if (work.id_grupo !== 1) {
      return undefined;
    }
    const deadlineMoment = moment(work.prazo_fim).utc();
    const daysRemaining = deadlineMoment.diff(moment(), 'days');

    if (daysRemaining < 0) {
      return DeadlineStatus.OVERDUE;
    }

    if (daysRemaining <= DEADLINE_THRESHOLDS.CRITICAL_DAYS) {
      return `${DeadlineStatus.CRITICAL}: ${daysRemaining} dia(s) restante(s)`;
    }

    if (
      daysRemaining >= DEADLINE_THRESHOLDS.ATTENTION_MIN_DAYS &&
      daysRemaining <= DEADLINE_THRESHOLDS.ATTENTION_DAYS
    ) {
      return `${DeadlineStatus.ATTENTION}: ${daysRemaining} dias restantes`;
    }

    return `${DeadlineStatus.ON_TIME}: (${daysRemaining} dias restantes)`;
  }
}
