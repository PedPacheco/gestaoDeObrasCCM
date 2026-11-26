import { GetRestrictionsAdvancePartnerInput } from 'src/application/types';
import {
  GetGripPartnerResponse,
  GetReaschedulingReasonsResponse,
  GetRestrictionsAdvancePartnerResponse,
  GetSparklinesByPartnerAderenciaResponse,
  GetSparklinesByPartnerEliminacaoResponse,
  GetWeeksByPartnerResponse,
} from '../types';

export interface IAdvancePartnerRepository {
  getRestrictionsAdvancePartner(
    filters: GetRestrictionsAdvancePartnerInput,
  ): Promise<GetRestrictionsAdvancePartnerResponse[]>;
  getGripPartner(
    filters: GetRestrictionsAdvancePartnerInput,
  ): Promise<GetGripPartnerResponse[]>;
  getReaschedulingReasons(
    filters: GetRestrictionsAdvancePartnerInput,
  ): Promise<GetReaschedulingReasonsResponse[]>;
  getSparklinesByPartner(filters: GetRestrictionsAdvancePartnerInput): Promise<{
    aderencia: GetSparklinesByPartnerAderenciaResponse[];
    eliminacao: GetSparklinesByPartnerEliminacaoResponse[];
  }>;
  getWeeksByPartner(
    filters: GetRestrictionsAdvancePartnerInput,
  ): Promise<GetWeeksByPartnerResponse[]>;
}

export const ADVANCE_PARTNER_REPOSITORY = Symbol('AdvancePartnerRepository');
