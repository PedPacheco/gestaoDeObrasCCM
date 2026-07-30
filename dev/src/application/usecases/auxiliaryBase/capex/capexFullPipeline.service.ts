import { Injectable } from '@nestjs/common';
import {
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/shared/capex.types';
import { UpdateCapexService } from 'src/application/usecases/works/updateCapex.service';
import { CapexProcessingService } from './capexProcessing.service';
import { AppLogger } from 'src/core/logger/logger.service';

/**
 * CapexFullPipelineService — Fluxo único (importação + atualização).
 *
 * Orquestra os dois serviços em sequência dentro de um único jobId,
 * mapeando os percentuais de cada fase para a escala completa do pipeline:
 *
 *   Fase           Serviço responsável         Faixa %
 *   ─────────────────────────────────────────────────────
 *   reading        CapexProcessingService        0% →  20%
 *   processing     CapexProcessingService       20% →  45%
 *   loading        UpdateCapexService           45% →  65%
 *   calculating    UpdateCapexService           65% →  70%
 *   updating       UpdateCapexRepository        70% →  99%
 *   done           —                            100%
 *
 * O remap de percentual é feito via wrappers de emitter, mantendo
 * os serviços internos completamente agnósticos à escala do pipeline.
 */
@Injectable()
export class CapexFullPipelineService {
  constructor(
    private readonly capexProcessingService: CapexProcessingService,
    private readonly updateCapexService: UpdateCapexService,
    private readonly logger: AppLogger,
  ) {}

  async run(
    filePath: string,
    jobId: string,
    onProgress: ProgressEmitter,
  ): Promise<void> {
    try {
      // ─── Fase 1: Importação (0% → 45%) ────────────────────────────
      await this.capexProcessingService.process(
        filePath,
        jobId,
        this.remapEmitter(onProgress, {
          reading: { min: 0, max: 20 },
          processing: { min: 20, max: 45 },
        }),
      );

      // ─── Fase 2: Atualização (45% → 100%) ─────────────────────────
      await this.updateCapexService.update(
        this.remapEmitter(onProgress, {
          loading: { min: 45, max: 65 },
          calculating: { min: 65, max: 70 },
          updating: { min: 70, max: 99 },
          done: { min: 100, max: 100 },
          error: { min: 0, max: 0 },
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Erro no pipeline completo de CAPEX (job ${jobId})`,
        error.stack,
      );
      // O erro já foi emitido pelo serviço interno via seu próprio emitter.
      // Re-throw para o caller (controller) poder logar/tratar.
      throw error;
    }
  }

  /**
   * Cria um emitter derivado que remapeia o percentual de cada fase
   * para uma faixa específica do pipeline completo.
   *
   * Ex: reading com 50% interno + faixa { min:0, max:20 } → emite 10%
   *
   * Fases não presentes no mapa são passadas diretamente (phase: done/error).
   */
  private remapEmitter(
    target: ProgressEmitter,
    ranges: Partial<Record<string, { min: number; max: number }>>,
  ): ProgressEmitter {
    return (payload: CapexProgressPayload) => {
      const range = ranges[payload.phase];

      if (!range) {
        target(payload);
        return;
      }

      const globalPct =
        payload.percentage === 100
          ? range.max
          : Math.floor(
              range.min + (payload.percentage / 100) * (range.max - range.min),
            );

      target({ ...payload, percentage: globalPct });
    };
  }
}
