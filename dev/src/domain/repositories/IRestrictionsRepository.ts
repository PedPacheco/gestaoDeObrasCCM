import {
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

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
}

export const RESTRICTIONS_REPOSITORY = Symbol('RestrictionsRepository');
