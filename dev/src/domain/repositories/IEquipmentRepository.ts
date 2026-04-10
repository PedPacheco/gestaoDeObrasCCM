export interface EquipmentFilter {
  idRegional?: number;
  idMunicipio?: number | number[];
  idCircuito?: number;
  idStatus?: number | number[];
  idTipo?: number | number[];
  idTurma?: number | number[];
  idGrupo?: number | number[];
  startDate?: Date;
  endDate?: Date;
  hasProgramacao?: boolean;
  executado?: boolean;
  pendente?: boolean;
  ovnotas?: string[];
  tipoDispositivo?: string;
  limit?: number;
  offset?: number;
}

export interface IEquipmentRepository {
  findWorks(where: any): Promise<any[]>;
  countWorks(where: any): Promise<number>;
  findEquipmentByCode(codigos: string[]): Promise<any[]>;
  findWithoutLocationRaw(ovnotas: any): Promise<any[]>;
}

export const EQUIPMENT_REPOSITORY = Symbol('EquipmentRepository');
