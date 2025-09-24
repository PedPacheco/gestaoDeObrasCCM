import { DataAuxiliaryNotes } from 'src/application/auxiliaryBase/auxiliaryBase.service';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: DataAuxiliaryNotes): Promise<any>;
  insertMarket(data: any[]): Promise<any>;
  getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>>;
  getAuxiliaryBaseNotes(idRegional?: number): Promise<any[]>;
  getAuxiliaryBaseMarket(idRegional?: number): Promise<any>;
  delete(tableToDelete: string, id: number): Promise<void>;
}

export const AUXILIARY_BASE_REPOSITORY = Symbol('AuxiliaryBaseRepository');
