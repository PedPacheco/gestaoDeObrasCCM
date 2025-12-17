import {
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
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
