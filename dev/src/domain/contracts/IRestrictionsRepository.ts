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
  /**
   * undefined → sem filtro de execução (ambos ou nenhum status selecionado)
   * true      → apenas registros executados (status 'done')
   * false     → apenas registros pendentes (status 'pending')
   */
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
