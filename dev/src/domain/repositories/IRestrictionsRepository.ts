import {
  ProcessedEliminacaoFilters,
  ProcessedRestrictionsFilters,
} from 'src/application/usecases/restrictions.service';
import {
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
  getRestrictionsAdvancePartner(
    filters: ProcessedEliminacaoFilters,
  ): Promise<any[]>;
  getGripPartner(filters: ProcessedEliminacaoFilters): Promise<any[]>;
  getScheduledWorks(filters: ProcessedEliminacaoFilters): Promise<any[]>;
  getReaschedulingReasons(filters: ProcessedEliminacaoFilters): Promise<any[]>;
  getExecutionRestrictions(filters: ProcessedEliminacaoFilters): Promise<any[]>;
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
