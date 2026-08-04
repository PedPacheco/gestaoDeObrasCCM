import {
  FindEquipmentByCodeResponse,
  FindWithoutLocationRawResponse,
  FindWorksReposnse,
} from '../types';

export interface IEquipmentRepository {
  findWorks(where: any): Promise<FindWorksReposnse[]>;
  countWorks(where: any): Promise<number>;
  findEquipmentByCode(
    codigos: string[],
  ): Promise<FindEquipmentByCodeResponse[]>;
  findWithoutLocationRaw(
    ovnotas: any,
  ): Promise<FindWithoutLocationRawResponse[]>;
}

export const EQUIPMENT_REPOSITORY = Symbol('EquipmentRepository');
