import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

export enum DeadlineStatus {
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
export class DeadlineStatusService {
  calculate(work: any): string | undefined {
    if (work.id_grupo !== 1) return undefined;

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
