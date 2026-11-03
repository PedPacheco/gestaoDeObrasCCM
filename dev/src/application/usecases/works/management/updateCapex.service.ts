import { Inject, Injectable } from '@nestjs/common';

import { toSafeCapexErrorMessage } from 'src/application/shared/capex-error.util';
import { ProgressEmitter } from 'src/application/shared/capex.types';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/contracts/IAuxiliaryBaseRepository';
import {
  IUpdateCapexRepository,
  UPDATE_CAPEX_REPOSITORY,
} from 'src/domain/contracts/works/IUpdateCapexRepository';
import {
  CalculatedValue,
  GetAuxiliaryBaseMaterialsInterface,
} from 'src/domain/entities/capex.entity';

import { CapexCalculatorService } from 'src/domain/services/capexCalculator.service';

// Mantido por compatibilidade: o tipo agora vive em domain/entities/capex.entity.
export type { CalculatedValue };

/**
 * Orquestra a atualização do CAPEX nas obras: carrega os dados, delega o
 * cálculo ao CapexCalculatorService e grava via repositório.
 *
 * Progresso: cada fase informa o percentual DENTRO dela (0–100). Quem
 * orquestra (CapexFullPipelineService) converte para a escala global.
 *
 *   loading     → carga de cn52n, fatores e materiais de contratos
 *   calculating → cálculo em memória
 *   updating    → gravação (reportada pelo repositório)
 *   done        → 100
 */
@Injectable()
export class UpdateCapexService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    @Inject(UPDATE_CAPEX_REPOSITORY)
    private readonly updateCapexRepository: IUpdateCapexRepository,
    private readonly calculator: CapexCalculatorService,
  ) {}

  /**
   * @param onProgress  Callback opcional para push de progresso via WebSocket.
   *                    Se omitido, o serviço funciona de forma silenciosa.
   */
  async update(onProgress?: ProgressEmitter): Promise<void> {
    try {
      // ─── Fase: loading ────────────────────────────────────────────
      onProgress?.({
        phase: 'loading',
        processed: 0,
        percentage: 0,
        message: 'Carregando materiais da base auxiliar...',
      });

      const materials =
        await this.auxiliaryBaseRepository.getAuxiliaryBaseCN52N();

      onProgress?.({
        phase: 'loading',
        processed: 1,
        percentage: 40,
        message: `${materials.length} materiais carregados. Buscando fatores...`,
      });

      const allMaterials = this.extractAllMaterials(materials);
      const fatorMap =
        await this.auxiliaryBaseRepository.getFator(allMaterials);

      onProgress?.({
        phase: 'loading',
        processed: 2,
        percentage: 80,
        message: 'Buscando materiais de contratos...',
      });

      const deletedMaterials =
        await this.updateCapexRepository.getDeletedMaterials();

      // ─── Fase: calculating ────────────────────────────────────────
      onProgress?.({
        phase: 'calculating',
        processed: 3,
        percentage: 0,
        message: `Calculando CAPEX para ${materials.length} registros...`,
      });

      const capexValues: CalculatedValue[] = this.calculator.calculate(
        materials,
        fatorMap,
        deletedMaterials,
      );

      onProgress?.({
        phase: 'calculating',
        processed: 3,
        percentage: 100,
        message: `${capexValues.length} obras calculadas. Gravando...`,
      });

      // ─── Fase: updating (delegada ao repositório) ─────────────────
      await this.updateCapexRepository.update(capexValues, onProgress);

      // ─── Conclusão ────────────────────────────────────────────────
      onProgress?.({
        phase: 'done',
        processed: capexValues.length,
        percentage: 100,
        message: 'Atualização finalizada',
      });
    } catch (error: any) {
      onProgress?.({
        phase: 'error',
        processed: 0,
        percentage: 0,
        message: toSafeCapexErrorMessage(
          error,
          'Erro inesperado durante a atualização do CAPEX.',
        ),
      });
      throw error;
    }
  }

  private extractAllMaterials(
    validatedData: GetAuxiliaryBaseMaterialsInterface[],
  ) {
    return validatedData.map((item) => ({
      material: item.material,
      pep_ref: item.def_proj,
    }));
  }
}
