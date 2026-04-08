export interface EquipamentosFilter {
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

export interface IEquipamentosRepository {
  findAll(params: EquipamentosFilter): Promise<any[]>;
  count(params: Omit<EquipamentosFilter, 'limit' | 'offset'>): Promise<number>;
  findWithoutLocation(ovnotas: string[]): Promise<any[]>;
}

export const EQUIPAMENTOS_REPOSITORY = Symbol('EquipamentosRepository');
