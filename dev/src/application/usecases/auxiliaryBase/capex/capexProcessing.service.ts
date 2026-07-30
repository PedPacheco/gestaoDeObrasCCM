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

import { Inject, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/core/logger/logger.service';

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

export type ImportProgressState = CapexProgressPayload;

@Injectable()
export class CapexProcessingService {
  private readonly obraCache = new Map<string, number>();
  private readonly progressMap = new Map<string, ImportProgressState>();

  // 🆕 ignorados por job
  private readonly ignoredMap = new Map<string, CapexItem[]>();

  private readonly BATCH_SIZE = 1000;
  private readonly MAX_CACHE = 50_000;
  private readonly CONCURRENCY = 5;
  private readonly READ_EMIT_INTERVAL = 1000;
  private readonly DRAIN_EVERY = 20;

  // 🆕 proteção de memória
  private readonly MAX_IGNORED = 10_000;

  private readonly limit = pLimit(this.CONCURRENCY);

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly repository: IAuxiliaryBaseRepository,
    private readonly logger: AppLogger,
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

    let tasks: Promise<void>[] = [];
    let batchesDispatched = 0;

    try {
      await this.repository.truncateCN52N();

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        entries: 'emit',
        sharedStrings: 'cache',
        hyperlinks: 'emit',
        worksheets: 'emit',
      });

      let batch: CapexItem[] = [];
      let processed = 0;
      let total = 0;

      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          if (row.number <= 2) continue;

          total++;

          const values = row.values as any[];

          batch.push({
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
          });

          if (total % this.READ_EMIT_INTERVAL === 0) {
            emit({
              phase: 'reading',
              processed: total,
              percentage: this.calcReadingPct(total),
              message: `Lendo linha ${total}...`,
            });
          }

          if (batch.length >= this.BATCH_SIZE) {
            const chunk = batch;
            batch = [];

            tasks.push(this.limit(() => this.processBatch(chunk, jobId)));

            processed += chunk.length;
            batchesDispatched++;

            emit({
              phase: 'processing',
              processed,
              percentage: this.calcProcessingPct(processed),
              message: this.buildProgressMessage(jobId, processed),
            });

            if (batchesDispatched % this.DRAIN_EVERY === 0) {
              await Promise.all(tasks);
              tasks = [];
            }
          }
        }
      }

      if (batch.length > 0) {
        const chunk = batch;

        tasks.push(this.limit(() => this.processBatch(chunk, jobId)));

        processed += chunk.length;
      }

      await Promise.all(tasks);

      emit({
        phase: 'completed',
        processed,
        percentage: 100,
        message: this.buildProgressMessage(jobId, processed, true),
      });

      this.scheduleCleanup(jobId);
    } catch (error: any) {
      const errPayload: CapexProgressPayload = {
        phase: 'error',
        processed: 0,
        percentage: 0,
        message: error.message ?? 'Erro durante a importação',
      };

      this.progressMap.set(jobId, errPayload);
      onProgress?.(errPayload);

      this.logger.error(`Erro no processamento do job ${jobId}`, error.stack);
      throw error;
    } finally {
      await fs
        .unlink(filePath)
        .catch(() =>
          this.logger.warn(`Não foi possível remover o arquivo ${filePath}`),
        );
    }
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

    // 🔴 armazenar ignorados com limite
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

  private calcReadingPct(linesRead: number): number {
    const approx = Math.min(linesRead / 100_000, 1);
    return Math.floor(approx * 100);
  }

  private calcProcessingPct(processed: number): number {
    return Math.min(Math.floor(processed / 1000), 100);
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
    setTimeout(() => {
      this.progressMap.delete(jobId);
      this.ignoredMap.delete(jobId); // 🧹 limpeza completa
    }, ttlMs);
  }
}
