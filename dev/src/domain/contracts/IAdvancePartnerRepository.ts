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
  ): Promise<any[]>;
  getGripPartner(filters: ProcessedEliminacaoFilters): Promise<any[]>;
  getReaschedulingReasons(filters: ProcessedEliminacaoFilters): Promise<any[]>;
  getSparklinesByPartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<{ aderencia: any[]; eliminacao: any[] }>;
  getWeeksByPartner(filters: ProcessedEliminacaoFilters): Promise<any[]>;
}

export const ADVANCE_PARTNER_REPOSITORY = Symbol('AdvancePartnerRepository');
