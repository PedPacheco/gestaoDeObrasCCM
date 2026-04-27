import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';

import {
  IRestrictionsRepository,
  RESTRICTIONS_REPOSITORY,
} from 'src/domain/repositories/IRestrictionsRepository';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';

export interface ProcessedRestrictionsFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  ovnota?: string;
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idRestricao?: number[];
  /**
   * undefined → sem filtro de execução (ambos ou nenhum status selecionado)
   * true      → apenas registros executados (status 'done')
   * false     → apenas registros pendentes (status 'pending')
   */
  filterExecutado?: boolean;
  page?: number;
}

@Injectable()
export class RestrictionsService {
  constructor(
    @Inject(RESTRICTIONS_REPOSITORY)
    private restrictionsRepository: IRestrictionsRepository,
  ) {}

  private parseFilters(
    filters: GetRestrictionsDTO,
  ): ProcessedRestrictionsFilters {
    const { dataInicial, dataFinal, status, ...rest } = filters;

    const hasDone = status?.includes('done') ?? false;
    const hasPending = status?.includes('pending') ?? false;

    let filterExecutado: boolean | undefined;

    if (hasDone && !hasPending) {
      filterExecutado = true;
    } else if (hasPending && !hasDone) {
      filterExecutado = false;
    }

    return {
      ...rest,
      dataInicial: dataInicial
        ? moment(dataInicial, 'DD/MM/YYYY').toDate()
        : undefined,
      dataFinal: dataFinal
        ? moment(dataFinal, 'DD/MM/YYYY').toDate()
        : undefined,
      filterExecutado,
    };
  }

  async getScheduleRestricion(filters: GetRestrictionsDTO) {
    const processedFilters = this.parseFilters(filters);

    const result =
      await this.restrictionsRepository.getScheduleRestrictions(
        processedFilters,
      );

    const totals = { total_obras: Number(result.totals[0].total_obras) };

    return { works: result.works, totals };
  }

  async getPublicationRestriction(filters: GetRestrictionsDTO) {
    const processedFilters = this.parseFilters(filters);

    const result =
      await this.restrictionsRepository.getPublicationRestricion(
        processedFilters,
      );

    return { works: result.works };
  }

  async getPublicationRestrictionsByWorkId(id: number) {
    const data =
      await this.restrictionsRepository.getPublicationRestrictionByWorkId(id);

    const formattedData = data.map((item) => ({
      ...item,
      restricao: item.restricoes.restricao,
      criado_por: item.usuario.nome_usuario,

      restricoes: undefined,
      usuario: undefined,
    }));

    return formattedData;
  }

  async insertPublicationRestriction(data: InsertPublicationRestrictionsDTO[]) {
    await this.restrictionsRepository.insertPublicationRestriction(data);
  }

  async updatePublicationRestriction(data: UpdatePublicationRestrictionsDTO) {
    const formattedData = {
      ...data,
      resolutionDate: data.resolutionDate
        ? moment(data.resolutionDate, 'DD/MM/YYYY', true)
            .hour(moment().hour())
            .minute(moment().minute())
            .second(moment().second())
            .toISOString()
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
