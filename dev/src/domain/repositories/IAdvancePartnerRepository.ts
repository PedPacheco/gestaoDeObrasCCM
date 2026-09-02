import {
  avanca_parceiro_indicadores,
  avanca_parceiro_monitoramento,
} from '@prisma/client';
import {
  CreateAdvancePartnerMonitoringDTO,
  IndicatorsDTO,
} from 'src/interface/dtos/advancePartnerDTO';

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
  getLatestMonitoringAdvancePartner(
    params: IndicatorsDTO,
  ): Promise<avanca_parceiro_monitoramento[]>;
  getIndicatorsAdvancePartner(): Promise<avanca_parceiro_indicadores>;
  insertIndicators(data: CreateAdvancePartnerMonitoringDTO): Promise<void>;
}

export const ADVANCE_PARTNER_REPOSITORY = Symbol('AdvancePartnerRepository');
