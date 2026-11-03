import {
  CapexInsertItem,
  GetAuxiliaryBaseMaterialsInterface,
} from 'src/domain/entities/capex.entity';
import { NotesDTO } from 'src/interface/dtos/auxiliaryBaseDTO';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: NotesDTO[]): Promise<any>;
  insertMarket(data: any[]): Promise<any>;
  insertCapex(data: CapexInsertItem[]): Promise<void>;
  getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>>;
  getAuxiliaryBaseNotes(idRegional?: number): Promise<any[]>;
  getAuxiliaryBaseCN52N(): Promise<GetAuxiliaryBaseMaterialsInterface[]>;
  getAuxiliaryBaseMarket(idRegional?: number): Promise<any>;
  delete(tableToDelete: string, id?: number): Promise<void>;
  truncateCN52N(): Promise<void>;
  /** Obras de cada diagrama; mais de um id indica diagrama ambíguo. */
  getObraIdsByDiagramas(diagramas: string[]): Promise<Map<string, number[]>>;
}

export const AUXILIARY_BASE_REPOSITORY = Symbol('AuxiliaryBaseRepository');
