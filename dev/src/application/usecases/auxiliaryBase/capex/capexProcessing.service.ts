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

import { Inject, Injectable, Logger } from '@nestjs/common';

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
  private readonly logger = new Logger(CapexProcessingService.name);

  private readonly obraCache = new Map<string, number>();
  private readonly progressMap = new Map<string, ImportProgressState>();

  // Tamanho do batch de leitura do Excel antes de despachar para o banco.
  // Mantido em 1 000 — o repositório cuida de subdividir em mini-batches de INSERT.
  private readonly BATCH_SIZE = 1000;

  private readonly MAX_CACHE = 50_000;

  // Máximo de processBatch rodando em paralelo.
  // Aumentado de 3 → 5 porque cada processBatch agora envia vários INSERTs
  // menores em vez de um único INSERT enorme, reduzindo a pressão por conexão.
  private readonly CONCURRENCY = 5;

  private readonly READ_EMIT_INTERVAL = 1000;

  // A cada quantos batches despachados aguardamos o pool de tasks pendentes.
  // Evita acumular centenas de Promises em memória ao processar arquivos grandes.
  private readonly DRAIN_EVERY = 20;

  private readonly limit = pLimit(this.CONCURRENCY);

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

    // Mantemos apenas as tasks do "ciclo atual" (até DRAIN_EVERY batches).
    // Depois de cada drain, o array é zerado — evitando crescimento ilimitado.
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

            tasks.push(
              this.limit(async () => {
                await this.processBatch(chunk);
              }),
            );

            processed += chunk.length;
            batchesDispatched++;

            emit({
              phase: 'processing',
              processed,
              percentage: this.calcProcessingPct(processed),
              message: `${processed} registros processados`,
            });

            // Drena o pool periodicamente para liberar memória e garantir
            // que erros de conexão sejam propagados antes do fim do arquivo.
            if (batchesDispatched % this.DRAIN_EVERY === 0) {
              await Promise.all(tasks);
              tasks = [];
            }
          }
        }
      }

      // Último batch (menor que BATCH_SIZE)
      if (batch.length > 0) {
        const chunk = batch;

        tasks.push(
          this.limit(async () => {
            await this.processBatch(chunk);
          }),
        );

        processed += chunk.length;
      }

      // Aguarda tasks restantes
      await Promise.all(tasks);

      emit({
        phase: 'completed',
        processed,
        percentage: 100,
        message: `Importação concluída: ${processed} registros`,
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

  private calcReadingPct(linesRead: number): number {
    const approx = Math.min(linesRead / 100_000, 1);
    return Math.floor(approx * 100);
  }

  private calcProcessingPct(processed: number): number {
    return Math.min(Math.floor(processed / 1000), 100);
  }

  private async processBatch(batch: CapexItem[]): Promise<void> {
    const uniqueDiagramas = [...new Set(batch.map((i) => i.diagrama_rede))];

    const missing = uniqueDiagramas.filter((d) => d && !this.obraCache.has(d));

    if (missing.length > 0) {
      const obraIdsMap = await this.repository.getObraIdsByDiagramas(missing);

      obraIdsMap.forEach((value, key) => {
        this.obraCache.set(key, value);

        // controle simples de cache (FIFO)
        if (this.obraCache.size > this.MAX_CACHE) {
          const firstKey = this.obraCache.keys().next().value;
          this.obraCache.delete(firstKey);
        }
      });
    }

    const dataWithObraId = batch.map((item) => ({
      ...item,
      id_obra: item.diagrama_rede
        ? (this.obraCache.get(item.diagrama_rede) ?? null)
        : null,
    }));

    await this.repository.insertCapex(dataWithObraId);
  }

  private initProgress(jobId: string): void {
    this.progressMap.set(jobId, {
      phase: 'reading',
      processed: 0,
      percentage: 0,
      message: 'Importação iniciada',
    });
  }

  private scheduleCleanup(jobId: string, ttlMs = 5 * 60 * 1000): void {
    setTimeout(() => this.progressMap.delete(jobId), ttlMs);
  }
}
