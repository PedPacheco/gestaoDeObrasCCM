import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import pLimit from 'p-limit';

import {
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/shared/capex.types';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';

import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';

interface CapexItem {
  diagrama_rede: string;
  def_proj: any;
  material: string;
  texto_breve: any;
  centro: any;
  dep: any;
  cti: any;
  elemento_pep: any;
  und: any;
  preco: any;
  qtd_necessaria: any;
  qtd_retirada: any;
  qtd_recebida: any;
  qtd_falta: any;
  reserva: any;
}

export const CAPEX_GENERIC_ERROR_MESSAGE =
  'Ocorreu um erro inesperado ao processar o CAPEX.';

export function toSafeCapexErrorMessage(
  error: unknown,
  fallback: string = CAPEX_GENERIC_ERROR_MESSAGE,
): string {
  return error instanceof HttpException ? error.message : fallback;
}

export type ImportProgressState = CapexProgressPayload;

@Injectable()
export class CapexProcessingService {
  private readonly logger = new Logger(CapexProcessingService.name);

  private readonly obraCache = new Map<string, number>();
  private readonly progressMap = new Map<string, ImportProgressState>();

  // ignorados por job
  private readonly ignoredMap = new Map<string, CapexItem[]>();

  private readonly BATCH_SIZE = 1000;
  private readonly MAX_CACHE = 50_000;
  private readonly CONCURRENCY = 5;
  private readonly DRAIN_EVERY = 20;

  // proteção de memória
  private readonly MAX_IGNORED = 10_000;

  /**
   * O stream do exceljs não informa o total de linhas, então o percentual é
   * uma estimativa: curva que satura perto de 99% e nunca chega a 100%
   * antes de a importação terminar de fato (o 100% vem no 'completed').
   */
  private readonly ESTIMATED_ROWS_SCALE = 60_000;

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly repository: IAuxiliaryBaseRepository,
  ) {}

  async process(
    filePath: string,
    jobId: string,
    onProgress?: ProgressEmitter,
  ): Promise<void> {
    this.initProgress(jobId);

    const emit = (payload: CapexProgressPayload) => {
      this.progressMap.set(jobId, payload);
      onProgress?.(payload);
    };

    // Limite de concorrência por execução (não compartilhado entre jobs).
    const limit = pLimit(this.CONCURRENCY);

    let tasks: Promise<void>[] = [];
    let failed = false;
    let failure: unknown;

    // As promises guardadas em `tasks` nunca rejeitam: o primeiro erro é
    // registrado e os batches seguintes viram no-op. Assim não há unhandled
    // rejection e nada é inserido depois da falha.
    const dispatch = (chunk: CapexItem[]) => {
      tasks.push(
        limit(async () => {
          if (failed) return;
          await this.processBatch(chunk, jobId);
        }).catch((err) => {
          if (!failed) {
            failed = true;
            failure = err;
          }
        }),
      );
    };

    const throwIfFailed = () => {
      if (failed) throw failure;
    };

    try {
      await this.repository.truncateCN52N();

      emit({
        phase: 'reading',
        processed: 0,
        percentage: 0,
        message: 'Lendo arquivo...',
      });

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        entries: 'emit',
        sharedStrings: 'cache',
        hyperlinks: 'emit',
        worksheets: 'emit',
      });

      let batch: CapexItem[] = [];
      let rowsRead = 0;
      let batchesDispatched = 0;

      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          if (row.number <= 2) continue;

          rowsRead++;
          batch.push(this.mapRow(row.values as any[]));

          if (batch.length >= this.BATCH_SIZE) {
            dispatch(batch);
            batch = [];
            batchesDispatched++;

            throwIfFailed(); // falha cedo

            // Um único evento de progresso por batch: percentual monotônico.
            emit({
              phase: 'processing',
              processed: rowsRead,
              percentage: this.estimatePercentage(rowsRead),
              message: this.buildProgressMessage(jobId, rowsRead),
            });

            if (batchesDispatched % this.DRAIN_EVERY === 0) {
              await Promise.all(tasks);
              tasks = [];
              throwIfFailed();
            }
          }
        }
      }

      if (batch.length > 0) {
        dispatch(batch);
      }

      await Promise.all(tasks);
      throwIfFailed();

      emit({
        phase: 'completed',
        processed: rowsRead,
        percentage: 100,
        message: this.buildProgressMessage(jobId, rowsRead, true),
      });
    } catch (error: any) {
      failed = true; // batches ainda na fila viram no-op
      await Promise.all(tasks); // espera só os que já estavam em execução

      this.logger.error(`Erro no processamento do job ${jobId}`, error?.stack);

      emit({
        phase: 'error',
        processed: 0,
        percentage: 0,
        message: toSafeCapexErrorMessage(
          error,
          'Erro inesperado durante a importação do CAPEX.',
        ),
      });

      throw error;
    } finally {
      this.scheduleCleanup(jobId); // também no erro, para não vazar os maps
      await fs
        .unlink(filePath)
        .catch(() =>
          this.logger.warn(`Não foi possível remover o arquivo ${filePath}`),
        );
    }
  }

  private mapRow(values: any[]): CapexItem {
    return {
      diagrama_rede: values[2] ? String(values[2]) : null,
      def_proj: values[3],
      material: values[4] ? String(values[4]) : null,
      texto_breve: values[5],
      centro: values[6],
      dep: values[7],
      cti: values[8],
      elemento_pep: values[9],
      und: values[10],
      preco: values[11],
      qtd_necessaria: values[12],
      qtd_retirada: values[13],
      qtd_recebida: values[14],
      qtd_falta: values[15],
      reserva: values[17],
    };
  }

  private async processBatch(batch: CapexItem[], jobId: string): Promise<void> {
    const uniqueDiagramas = [...new Set(batch.map((i) => i.diagrama_rede))];

    const missing = uniqueDiagramas.filter((d) => d && !this.obraCache.has(d));

    if (missing.length > 0) {
      const obraIdsMap = await this.repository.getObraIdsByDiagramas(missing);

      obraIdsMap.forEach((value, key) => {
        this.obraCache.set(key, value);

        if (this.obraCache.size > this.MAX_CACHE) {
          const firstKey = this.obraCache.keys().next().value;
          this.obraCache.delete(firstKey);
        }
      });
    }

    const validItems: any[] = [];
    const ignoredItems: CapexItem[] = [];

    for (const item of batch) {
      const id_obra = item.diagrama_rede
        ? (this.obraCache.get(item.diagrama_rede) ?? null)
        : null;

      if (!id_obra) {
        ignoredItems.push(item);
        continue;
      }

      validItems.push({
        ...item,
        id_obra,
      });
    }

    // armazenar ignorados com limite
    if (ignoredItems.length > 0) {
      const current = this.ignoredMap.get(jobId) ?? [];

      if (current.length < this.MAX_IGNORED) {
        const remainingSpace = this.MAX_IGNORED - current.length;
        current.push(...ignoredItems.slice(0, remainingSpace));
        this.ignoredMap.set(jobId, current);
      }
    }

    if (validItems.length > 0) {
      await this.repository.insertCapex(validItems);
    }
  }

  private buildProgressMessage(
    jobId: string,
    processed: number,
    completed = false,
  ): string {
    const ignored = this.ignoredMap.get(jobId)?.length ?? 0;

    if (completed) {
      return `Importação concluída: ${processed} registros (${ignored} ignorados)`;
    }

    return `${processed} registros processados (${ignored} ignorados)`;
  }

  getIgnored(jobId: string): CapexItem[] {
    return this.ignoredMap.get(jobId) ?? [];
  }

  private estimatePercentage(rowsRead: number): number {
    const ratio = 1 - Math.exp(-rowsRead / this.ESTIMATED_ROWS_SCALE);
    return Math.min(99, Math.floor(ratio * 100));
  }

  private initProgress(jobId: string): void {
    this.progressMap.set(jobId, {
      phase: 'reading',
      processed: 0,
      percentage: 0,
      message: 'Importação iniciada',
    });

    this.ignoredMap.set(jobId, []);
  }

  private scheduleCleanup(jobId: string, ttlMs = 5 * 60 * 1000): void {
    const timer = setTimeout(() => {
      this.progressMap.delete(jobId);
      this.ignoredMap.delete(jobId); // limpeza completa
    }, ttlMs);
    timer.unref?.(); // não impede o processo de terminar
  }
}
