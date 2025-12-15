import { Inject, Injectable } from '@nestjs/common';

import {
  IRestrictionsRepository,
  RESTRICTIONS_REPOSITORY,
} from 'src/domain/repositories/IRestrictionsRepository';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';

@Injectable()
export class RestrictionsService {
  constructor(
    @Inject(RESTRICTIONS_REPOSITORY)
    private restrictionsRepository: IRestrictionsRepository,
  ) {}

  async getScheduleRestricion(filters: GetRestrictionsDTO) {
    const result =
      await this.restrictionsRepository.getScheduleRestrictions(filters);

    const totals = { total_obras: Number(result.totals[0].total_obras) };

    return { works: result.works, totals };
  }

  async getPublicationRestriction(filters: GetRestrictionsDTO) {
    const result =
      await this.restrictionsRepository.getPublicationRestricion(filters);

    const totals = { total_obras: Number(result.totals[0].total_obras) };

    return { works: result.works, totals };
  }

  async insertPublicationRestriction(data: InsertPublicationRestrictionsDTO) {
    await this.restrictionsRepository.insertPublicationRestriction(data);
  }
}
