import {
  GetGripPartnerResponse,
  GetReaschedulingReasonsResponse,
  GetRestrictionsAdvancePartnerResponse,
  GetSparklinesByPartnerAderenciaResponse,
  GetSparklinesByPartnerEliminacaoResponse,
  GetWeeksByPartnerResponse,
} from '../types';

export interface ProcessedEliminacaoFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  idRegional?: number[];
  idParceira?: number[];
  responsabilidade?: string;
}

export interface IAdvancePartnerRepository {
  getRestrictionsAdvancePartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<GetRestrictionsAdvancePartnerResponse[]>;
  getGripPartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<GetGripPartnerResponse[]>;
  getReaschedulingReasons(
    filters: ProcessedEliminacaoFilters,
  ): Promise<GetReaschedulingReasonsResponse[]>;
  getSparklinesByPartner(filters: ProcessedEliminacaoFilters): Promise<{
    aderencia: GetSparklinesByPartnerAderenciaResponse[];
    eliminacao: GetSparklinesByPartnerEliminacaoResponse[];
  }>;
  getWeeksByPartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<GetWeeksByPartnerResponse[]>;
}

export const ADVANCE_PARTNER_REPOSITORY = Symbol('AdvancePartnerRepository');
