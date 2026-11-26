import { CapexInsertItem, NoteInsertInput } from 'src/application/types';

import { GetAuxiliaryBaseMaterialsInterface } from '../entities/capex.entity';
import { MarketWork } from '../entities/works.entity';
import { GetAuxiliaryBaseNotesResponse } from '../types';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: NoteInsertInput[]): Promise<void>;
  insertMarket(data: any[]): Promise<any>;
  insertCapex(data: CapexInsertItem[]): Promise<void>;
  getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>>;
  getAuxiliaryBaseNotes(
    idRegional?: number,
  ): Promise<GetAuxiliaryBaseNotesResponse[]>;
  getAuxiliaryBaseCN52N(): Promise<GetAuxiliaryBaseMaterialsInterface[]>;
  getAuxiliaryBaseMarket(idRegional?: number): Promise<MarketWork[]>;
  delete(tableToDelete: string, id?: number): Promise<void>;
  truncateCN52N(): Promise<void>;
  /** Obras de cada diagrama; mais de um id indica diagrama ambíguo. */
  getObraIdsByDiagramas(diagramas: string[]): Promise<Map<string, number[]>>;
}

export const AUXILIARY_BASE_REPOSITORY = Symbol('AuxiliaryBaseRepository');
