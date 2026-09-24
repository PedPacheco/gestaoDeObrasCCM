import { ProgressEmitter } from 'src/application/shared/capex.types';
import { CalculatedValue } from 'src/application/usecases/works/management/updateCapex.service';

export interface IUpdateCapexRepository {
  /**
   * Grava os valores calculados nas obras em batches.
   * @param data    Valores calculados pelo UpdateCapexService
   * @param onProgress  Callback opcional para reportar progresso (gravação)
   */
  update(data: CalculatedValue[], onProgress?: ProgressEmitter): Promise<void>;
  getDeletedMaterials(): Promise<any>;
}

export const UPDATE_CAPEX_REPOSITORY = Symbol('UpdateCapexRepository');
