import {
  CapexInsertItem,
  InsertAuxiliaryMarketInput,
  NoteInsertInput,
} from 'src/application/types';

import { MarketWork } from '../entities/works.entity';
import {
  GetAuxiliaryBaseMaterialsResponse,
  GetAuxiliaryBaseNotesResponse,
} from '../types';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: NoteInsertInput[]): Promise<void>;
  insertMarket(data: InsertAuxiliaryMarketInput[]): Promise<void>;
  insertCapex(data: CapexInsertItem[]): Promise<void>;
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
