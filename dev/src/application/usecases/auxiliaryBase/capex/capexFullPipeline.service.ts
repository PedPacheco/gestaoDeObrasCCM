import { ConflictException, Injectable, Logger } from '@nestjs/common';

import {
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/shared/capex.types';
import { UpdateCapexService } from 'src/application/usecases/works/management/updateCapex.service';
import { CapexProcessingService } from './capexProcessing.service';

interface PhaseRange {
  min: number;
  max: number;
}

type PhaseRanges = Readonly<Partial<Record<string, PhaseRange>>>;

/**
 * Faixas de progresso de cada fase na escala completa do pipeline.
 *
 *   Fase           Serviço responsável         Faixa %
 *   ─────────────────────────────────────────────────────
 *   reading        CapexProcessingService        0% →  20%  (leitura + validação do xlsx)
 *   processing     CapexProcessingService       20% →  45%  (carga em cn52n)
 *   completed      CapexProcessingService       fixa em 45% (fim da importação)
 *   loading        UpdateCapexService           45% →  65%
 *   calculating    UpdateCapexService           65% →  70%
 *   updating       UpdateCapexRepository        70% →  99%
 *   done           UpdateCapexService           100%
 *
 * Cada serviço informa o percentual DENTRO da própria fase (0–100); o
 * orquestrador converte para a escala global do pipeline.
 * 'error' não está nos mapas: passa direto (o gateway mantém o último %).
 */
const IMPORT_RANGES: PhaseRanges = {
  reading: { min: 0, max: 20 },
  processing: { min: 20, max: 45 },
  // Sem isto, o 'completed' (100%) do import vazaria como 100% no meio do pipeline.
  completed: { min: 45, max: 45 },
};

const UPDATE_RANGES: PhaseRanges = {
  loading: { min: 45, max: 65 },
  calculating: { min: 65, max: 70 },
  updating: { min: 70, max: 99 },
  done: { min: 100, max: 100 },
};

/**
 * CapexFullPipelineService — Fluxo único (importação + atualização).
 *
 * Orquestra os dois serviços em sequência dentro de um único jobId.
 * O remap de percentual é feito via wrappers de emitter, mantendo
 * os serviços internos agnósticos à escala do pipeline.
 *
 * Só um pipeline pode rodar por vez (por processo): o import faz truncate
 * da tabela auxiliar, então duas execuções simultâneas se corromperiam.
 */
@Injectable()
export class CapexFullPipelineService {
  private readonly logger = new Logger(CapexFullPipelineService.name);

  private running = false;

  constructor(
    private readonly capexProcessingService: CapexProcessingService,
    private readonly updateCapexService: UpdateCapexService,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  async run(
    filePath: string,
    jobId: string,
    onProgress: ProgressEmitter,
  ): Promise<void> {
    if (this.running) {
      throw new ConflictException(
        'Já existe uma atualização de CAPEX em andamento.',
      );
    }
    this.running = true; // síncrono, antes de qualquer await: sem race no mesmo processo

    try {
      // ─── Fase 1: Importação (0% → 45%) ────────────────────────────
      await this.capexProcessingService.process(
        filePath,
        jobId,
        this.remapEmitter(onProgress, IMPORT_RANGES),
      );

      // ─── Fase 2: Atualização (45% → 100%) ─────────────────────────
      await this.updateCapexService.update(
        this.remapEmitter(onProgress, UPDATE_RANGES),
      );
    } catch (error: any) {
      // Os serviços internos já emitiram o 'error' pelo emitter deles.
      // Re-throw para o caller (controller/scheduler) poder logar/tratar.
      this.logger.error(
        `Erro no pipeline completo de CAPEX (job ${jobId})`,
        error?.stack,
      );
      throw error;
    } finally {
      this.running = false;
    }
  }

  /**
   * Cria um emitter derivado que remapeia o percentual de cada fase
   * para uma faixa específica do pipeline completo.
   *
   * Ex: processing com 50% interno + faixa { min:20, max:45 } → emite 32%
   *
   * Fases fora do mapa são repassadas sem alteração.
   */
  private remapEmitter(
    target: ProgressEmitter,
    ranges: PhaseRanges,
  ): ProgressEmitter {
    return (payload: CapexProgressPayload) => {
      const range = ranges[payload.phase];

      if (!range) {
        target(payload);
        return;
      }

      const globalPct =
        payload.percentage >= 100
          ? range.max
          : Math.floor(
              range.min +
                (Math.max(0, payload.percentage) / 100) *
                  (range.max - range.min),
            );

      target({ ...payload, percentage: globalPct });
    };
  }
}
