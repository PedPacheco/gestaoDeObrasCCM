import {
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import {
  GetPublicationRestricionResponse,
  GetPublicationRestrictionByWorkIdResponse,
  GetScheduleRestrictionsResponse,
} from '../types';

export interface ProcessedRestrictionsFilters {
  dataInicial?: Date;
  dataFinal?: Date;
  ovnota?: string;
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idRestricao?: number[];
  filterExecutado?: boolean;
  page?: number;
}

export interface IRestrictionsRepository {
  getScheduleRestrictions(
    filters: ProcessedRestrictionsFilters,
  ): Promise<GetScheduleRestrictionsResponse>;
  getPublicationRestricion(
    filters: ProcessedRestrictionsFilters,
  ): Promise<GetPublicationRestricionResponse>;
  getPublicationRestrictionByWorkId(
    id: number,
  ): Promise<GetPublicationRestrictionByWorkIdResponse[]>;
  insertPublicationRestriction(
    data: InsertPublicationRestrictionsDTO[],
  ): Promise<void>;
  updatePublicationRestriction(
    data: UpdatePublicationRestrictionsDTO,
  ): Promise<void>;
  deletePublicationRestriction(id: number): Promise<void>;
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
