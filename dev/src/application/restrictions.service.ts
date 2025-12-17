import { Inject, Injectable } from '@nestjs/common';

import {
  IRestrictionsRepository,
  RESTRICTIONS_REPOSITORY,
} from 'src/domain/repositories/IRestrictionsRepository';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import * as moment from 'moment';

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

    return { works: result.works };
  }

  async insertPublicationRestriction(data: InsertPublicationRestrictionsDTO[]) {
    await this.restrictionsRepository.insertPublicationRestriction(data);
  }

  async updatePublicationRestriction(data: UpdatePublicationRestrictionsDTO) {
    const formattedData = {
      ...data,
      resolutionDate: data.resolutionDate
        ? moment(data.resolutionDate, 'DD/MM/YYYY', true).toISOString()
        : null,
    };

    await this.restrictionsRepository.updatePublicationRestriction(
      formattedData,
    );
  }

  async deletePublicationRestriction(id: number) {
    await this.restrictionsRepository.deletePublicationRestriction(id);
  }
}
