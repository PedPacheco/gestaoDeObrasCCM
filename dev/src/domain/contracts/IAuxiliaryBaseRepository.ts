import { NotesDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import {
  GetAuxiliaryBaseMaterialsResponse,
  GetAuxiliaryBaseNotesResponse,
} from '../types';
import { MarketWork } from '../entities/works.entity';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: NotesDTO[]): Promise<void>;
  insertMarket(data: any[]): Promise<void>;
  insertCapex(data: any[]): Promise<void>;
  delete(tableToDelete: string, id?: number): Promise<void>;
  truncateCN52N(): Promise<void>;
  getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>>;
  getAuxiliaryBaseNotes(
    idRegional?: number,
  ): Promise<GetAuxiliaryBaseNotesResponse[]>;
  getAuxiliaryBaseCN52N(): Promise<GetAuxiliaryBaseMaterialsResponse[]>;
  getAuxiliaryBaseMarket(idRegional?: number): Promise<MarketWork[]>;
  getObraIdsByDiagramas(diagramas: string[]): Promise<Map<string, number>>;
}

export const AUXILIARY_BASE_REPOSITORY = Symbol('AuxiliaryBaseRepository');
