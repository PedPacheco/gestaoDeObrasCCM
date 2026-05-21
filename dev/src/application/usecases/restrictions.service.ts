import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';

import {
  IRestrictionsRepository,
  RESTRICTIONS_REPOSITORY,
} from 'src/domain/repositories/IRestrictionsRepository';
import {
  GetRestrictionsAdvancePartnerDTO,
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

export interface ProcessedEliminacaoFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  idRegional?: number[];
  idParceira?: number[];
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

  private parseEliminationFilters(
    filters: GetRestrictionsAdvancePartnerDTO,
  ): ProcessedEliminacaoFilters {
    const { dataInicial, dataFinal, idRegional, idParceira } = filters;

    return {
      dataInicial: dataInicial
        ? moment(dataInicial, 'DD/MM/YYYY').toDate()
        : undefined,
      dataFinal: dataFinal
        ? moment(dataFinal, 'DD/MM/YYYY').toDate()
        : undefined,
      idRegional,
      idParceira,
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

  async getRestrictionsAdvancePartner(
    filters: GetRestrictionsAdvancePartnerDTO,
  ) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.restrictionsRepository.getRestrictionsAdvancePartner(
        processedFilters,
      );

    return rows.map((r) => {
      const total = Number(r.total);
      const sem = Number(r.sem_restricao);
      return {
        month: r.mes,
        total,
        withoutRestriction: sem,
        withRestriction: total - sem,
        pct: total > 0 ? Math.round((sem / total) * 100) : 0,
      };
    });
  }

  async getGripPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.restrictionsRepository.getGripPartner(processedFilters);

    return rows.map((r) => {
      const total = Number(r.total);
      const executed = Number(r.executada);
      const partialExecuted = Number(r.executada_parcial);
      const notExecuted = Number(r.nao_executada);
      const notInformed = Number(r.nao_informada);
      return {
        week: r.semana,
        total,
        executed,
        partialExecuted,
        notExecuted,
        notInformed,
        pct: total > 0 ? Math.round((executed / total) * 100) : 0,
      };
    });
  }

  async getScheduledWorks(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.restrictionsRepository.getScheduledWorks(processedFilters);

    return rows.map((r) => {
      const total = Number(r.total_programadas);
      const com = Number(r.com_restricao);
      return {
        month: r.mes,
        totalScheduled: total,
        withRestriction: com,
        withoutRestriction: total - com,
      };
    });
  }

  async getReaschedulingReasons(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    return await this.restrictionsRepository.getReaschedulingReasons(
      processedFilters,
    );
  }

  async getExecutionRestrictions(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    return await this.restrictionsRepository.getExecutionRestrictions(
      processedFilters,
    );
  }

  async getSparklinesByPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const { aderencia, eliminacao } =
      await this.restrictionsRepository.getSparklinesByPartner(
        processedFilters,
      );

    const map = new Map<
      string,
      {
        aderencia: { semana: string; pct: number }[];
        eliminacao: { semana: string; pct: number }[];
      }
    >();

    for (const r of aderencia) {
      const p: string = r.parceira;
      if (!map.has(p)) map.set(p, { aderencia: [], eliminacao: [] });
      const total = Number(r.total);
      const exec = Number(r.executada);
      map.get(p)!.aderencia.push({
        semana: r.semana,
        pct: total > 0 ? Math.round((exec / total) * 100) : 0,
      });
    }

    for (const r of eliminacao) {
      const p: string = r.parceira;
      if (!map.has(p)) map.set(p, { aderencia: [], eliminacao: [] });
      const total = Number(r.total);
      const sem = Number(r.sem_restricao);
      map.get(p)!.eliminacao.push({
        semana: r.semana,
        pct: total > 0 ? Math.round((sem / total) * 100) : 0,
      });
    }

    return Array.from(map.entries()).map(([parceira, data]) => ({
      parceira,
      ...data,
    }));
  }

  async getWeeksByPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.restrictionsRepository.getWeeksByPartner(processedFilters);
    return rows.map((r) => ({
      parceira: r.parceira,
      semanas: Number(r.semanas),
    }));
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
