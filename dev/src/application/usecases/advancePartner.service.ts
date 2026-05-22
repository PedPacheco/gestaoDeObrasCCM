import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';
import {
  ADVANCE_PARTNER_REPOSITORY,
  IAdvancePartnerRepository,
  ProcessedEliminacaoFilters,
} from 'src/domain/repositories/IAdvancePartnerRepository';
import { GetRestrictionsAdvancePartnerDTO } from 'src/interface/dtos/restrictionsDTO';

@Injectable()
export class AdvancePartnerService {
  constructor(
    @Inject(ADVANCE_PARTNER_REPOSITORY)
    private readonly advancePartnerRepository: IAdvancePartnerRepository,
  ) {}

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

  async getRestrictionsAdvancePartner(
    filters: GetRestrictionsAdvancePartnerDTO,
  ) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.advancePartnerRepository.getRestrictionsAdvancePartner(
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
      await this.advancePartnerRepository.getGripPartner(processedFilters);

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

  async getReaschedulingReasons(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    return await this.advancePartnerRepository.getReaschedulingReasons(
      processedFilters,
    );
  }

  async getSparklinesByPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    const { aderencia, eliminacao } =
      await this.advancePartnerRepository.getSparklinesByPartner(
        processedFilters,
      );

    // console.log(aderencia, eliminacao);

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
      await this.advancePartnerRepository.getWeeksByPartner(processedFilters);
    return rows.map((r) => ({
      parceira: r.parceira,
      semanas: Number(r.semanas),
    }));
  }
}
