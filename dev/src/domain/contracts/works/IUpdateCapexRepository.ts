import { CalculatedValue, ProgressEmitter } from 'src/application/types';

export interface IUpdateCapexRepository {
  /**
   * Grava os valores calculados nas obras em batches.
   * @param data    Valores calculados pelo UpdateCapexService
   * @param onProgress  Callback opcional para reportar progresso (gravação)
   */
  update(data: CalculatedValue[], onProgress?: ProgressEmitter): Promise<void>;
  getDeletedMaterials(): Promise<{ material: string }[]>;
}

export const UPDATE_CAPEX_REPOSITORY = Symbol('UpdateCapexRepository');
