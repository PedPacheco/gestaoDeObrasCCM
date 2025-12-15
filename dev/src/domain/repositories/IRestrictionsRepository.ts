import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

export interface IRestrictionsRepository {
  getScheduleRestrictions(
    filters: GetRestrictionsDTO,
  ): Promise<{ works: GetScheduleRestrictions[]; totals: any[] }>;
  getPublicationRestricion(
    filters: GetRestrictionsDTO,
  ): Promise<{ works: any[]; totals: any[] }>;
  insertPublicationRestriction(
    data: InsertPublicationRestrictionsDTO,
  ): Promise<void>;
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
