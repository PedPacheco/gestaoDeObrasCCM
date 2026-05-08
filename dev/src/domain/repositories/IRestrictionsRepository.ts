import {
  GetEliminacaoRestricaoDTO,
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

export interface IRestrictionsRepository {
  getScheduleRestrictions(
    filters: GetRestrictionsDTO,
  ): Promise<{ works: GetScheduleRestrictions[]; totals: any[] }>;
  getPublicationRestricion(
    filters: GetRestrictionsDTO,
  ): Promise<{ works: any[] }>;
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
