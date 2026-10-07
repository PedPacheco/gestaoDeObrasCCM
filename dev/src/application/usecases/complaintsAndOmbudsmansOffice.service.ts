import { Inject, Injectable } from '@nestjs/common';
import { ComplaintsMetrics } from 'src/domain/entities/complaints/complaintsMetrics';
import {
  COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY,
  IComplaintsAndOmbudsmansOfficeRepository,
} from 'src/domain/repositories/IComplaintsAndOmbudsmansOfficeRepository';
import { buildComplaintsMetrics } from 'src/domain/services/complaintsMetrics.calculator';

import { ComplaintsAndOmbudsmansOfficeDTO } from 'src/interface/dtos/complaintsAndOmbudsmansOfficeDTO';

// "Today" in the business timezone: toISOString() is UTC and would roll over to the next
// day after 9pm in Brasília, changing which pending items count as overdue.
export const todayIsoInSaoPaulo = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    now,
  ); // YYYY-MM-DD

@Injectable()
export class ComplaintsAndOmbudsmansOfficeService {
  constructor(
    @Inject(COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY)
    private readonly repository: IComplaintsAndOmbudsmansOfficeRepository,
  ) {}

  async getMetrics(
    filters: ComplaintsAndOmbudsmansOfficeDTO,
    now = new Date(),
  ): Promise<ComplaintsMetrics> {
    // The DTO is structurally compatible with ComplaintsFilter.
    const complaints = await this.repository.findAll(filters);
    return buildComplaintsMetrics(complaints, todayIsoInSaoPaulo(now));
  }
}
