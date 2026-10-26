import { Injectable } from '@nestjs/common';
import moment, { MomentInput } from 'moment';
import { DeadlineStatus } from '../deadlineStatus.service';

export interface TimeMetrics {
  tmAberto: number | null;
  tmExecucao: number | null;
}

const D5_NOTE_THRESHOLDS = {
  ON_TIME_MAX_DAYS: 3,
  ATTENTION_MAX_DAYS: 5,
  CRITICAL_MAX_DAYS: 7,
} as const;

export interface D5NoteTimeMetricsInfo {
  tmAberto: number | null;
  tmExecucao: number | null;
  statusPrazo: DeadlineStatus | null;
}

@Injectable()
export class TimeMetricsService {
  getDeadlineInfo(
    initialDate: MomentInput | null | undefined,
    executionDate: MomentInput | null | undefined,
  ): D5NoteTimeMetricsInfo {
    const { tmAberto, tmExecucao } = this.calculateTM(
      initialDate,
      executionDate,
    );

    return {
      tmAberto,
      tmExecucao,
      statusPrazo: this.calculateStatus(tmAberto),
    };
  }

  calculateTM(
    initialDate: MomentInput | null | undefined,
    executionDate: MomentInput | null | undefined,
    referenceDate: MomentInput = new Date(),
  ): TimeMetrics {
    if (!initialDate) {
      return { tmAberto: null, tmExecucao: null };
    }

    const start = moment.utc(initialDate).startOf('day');

    if (executionDate) {
      return {
        tmAberto: null,
        tmExecucao: moment
          .utc(executionDate)
          .startOf('day')
          .diff(start, 'days'),
      };
    }

    return {
      tmAberto: moment.utc(referenceDate).startOf('day').diff(start, 'days'),
      tmExecucao: null,
    };
  }

  calculateStatus(tmAberto: number | null | undefined): DeadlineStatus | null {
    if (tmAberto == null || Number.isNaN(tmAberto)) return null;

    if (tmAberto <= D5_NOTE_THRESHOLDS.ON_TIME_MAX_DAYS)
      return DeadlineStatus.ON_TIME;
    if (tmAberto <= D5_NOTE_THRESHOLDS.ATTENTION_MAX_DAYS)
      return DeadlineStatus.ATTENTION;
    if (tmAberto <= D5_NOTE_THRESHOLDS.CRITICAL_MAX_DAYS)
      return DeadlineStatus.CRITICAL;

    return DeadlineStatus.OVERDUE;
  }
}
