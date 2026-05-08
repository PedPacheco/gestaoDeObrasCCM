import { ProcessedRestrictionsFilters } from 'src/application/usecases/restrictions.service';
import {
  GetEliminacaoRestricaoDTO,
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

export interface IRestrictionsRepository {
  getScheduleRestrictions(
    filters: ProcessedRestrictionsFilters,
  ): Promise<{ works: GetScheduleRestrictions[]; totals: any[] }>;
  getPublicationRestricion(
    filters: ProcessedRestrictionsFilters,
  ): Promise<{ works: any[] }>;
  getPublicationRestrictionByWorkId(id: number): Promise<any[]>;
  insertPublicationRestriction(
    data: InsertPublicationRestrictionsDTO[],
  ): Promise<void>;
  updatePublicationRestriction(
    data: UpdatePublicationRestrictionsDTO,
  ): Promise<void>;
  deletePublicationRestriction(id: number): Promise<void>;
  getEliminacaoRestricao(filters: GetEliminacaoRestricaoDTO): Promise<any[]>;
  getAderenciaParceira(filters: GetEliminacaoRestricaoDTO): Promise<any[]>;
  getObrasProgramadas(filters: GetEliminacaoRestricaoDTO): Promise<any[]>;
  getMotivosReprogramacao(filters: GetEliminacaoRestricaoDTO): Promise<any[]>;
  getRestricoesExecucao(filters: GetEliminacaoRestricaoDTO): Promise<any[]>;
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
