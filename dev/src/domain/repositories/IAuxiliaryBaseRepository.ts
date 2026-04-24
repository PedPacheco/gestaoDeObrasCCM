import { NotesDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { GetAuxiliaryBaseMaterialsInterface } from 'src/interface/types/works/capexInterface';

export interface IAuxiliaryBaseRepository {
  insertNotes(data: NotesDTO[]): Promise<any>;
  insertMarket(data: any[]): Promise<any>;
  insertCapex(data: any[]): Promise<void>;
  getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>>;
  getAuxiliaryBaseNotes(idRegional?: number): Promise<any[]>;
  getAuxiliaryBaseCN52N(): Promise<GetAuxiliaryBaseMaterialsInterface[]>;
  getAuxiliaryBaseMarket(idRegional?: number): Promise<any>;
  delete(tableToDelete: string, id?: number): Promise<void>;
  truncateCN52N(): Promise<void>;
  getObraIdsByDiagramas(diagramas: string[]): Promise<any>;
}

export const AUXILIARY_BASE_REPOSITORY = Symbol('AuxiliaryBaseRepository');
