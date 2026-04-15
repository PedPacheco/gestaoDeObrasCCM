import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/shared/capex.types';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';

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

// Estado interno para o endpoint de polling (fallback sem WS)
export type ImportProgressState = CapexProgressPayload;

@Injectable()
export class CapexProcessingService {
  private readonly logger = new Logger(CapexProcessingService.name);

  // Cache de diagrama_rede → id_obra reutilizado entre jobs.
  // Shared entre execuções: melhora hit-rate em reimportações do mesmo dataset.
  private readonly obraCache = new Map<string, number>();

  // Fallback para polling HTTP — mantido para compatibilidade.
  // Chave: jobId, Valor: último estado emitido
  private readonly progressMap = new Map<string, ImportProgressState>();

  private readonly BATCH_SIZE = 5_000;
  private readonly MAX_CACHE = 50_000;

  // Throttle: emite progresso de leitura no máximo 1x por N linhas,
  // evitando overhead de emit a cada linha em arquivos grandes.
  private readonly READ_EMIT_INTERVAL = 1_000;

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly repository: IAuxiliaryBaseRepository,
  ) {}

  /**
   * Processa o arquivo xlsx e insere os dados na tabela cn52n.
   *
   * Faixas de progresso (fluxo isolado):
   *   reading    →  0% – 30%
   *   processing → 30% – 100%
   *   done       → 100%
   *
   * Quando chamado pelo CapexFullPipelineService, o emitter recebido
   * já mapeia para a sub-faixa correta do pipeline completo (0–45%).
   *
   * @param filePath  Caminho do arquivo salvo pelo multer
   * @param jobId     UUID do job (para room WS e fallback polling)
   * @param onProgress  Callback para push em tempo real (opcional)
   */
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
          if (row.number <= 2) continue; // pula cabeçalho duplo

          total++;

          batch.push({
            diagrama_rede: row.values[2]?.toString(),
            def_proj: row.values[3],
            material: row.values[4]?.toString(),
            texto_breve: row.values[5],
            centro: row.values[6],
            dep: row.values[7],
            cti: row.values[8],
            elemento_pep: row.values[9],
            und: row.values[10],
            preco: row.values[11],
            qtd_necessaria: row.values[12],
            qtd_retirada: row.values[13],
            qtd_recebida: row.values[14],
            qtd_falta: row.values[15],
            reserva: row.values[17],
          });

          // Throttle: emite leitura a cada READ_EMIT_INTERVAL linhas
          if (total % this.READ_EMIT_INTERVAL === 0) {
            emit({
              phase: 'reading',
              processed: total,
              percentage: this.calcReadingPct(total),
              message: `Lendo linha ${total}...`,
            });
          }

          if (batch.length >= this.BATCH_SIZE) {
            await this.processBatch(batch);
            processed += batch.length;
            batch = [];

            emit({
              phase: 'processing',
              processed,
              percentage: this.calcProcessingPct(processed, total),
              message: `${processed} de ~${total} registros inseridos`,
            });
          }
        }
      }

      // Processa o restante fora do loop
      if (batch.length > 0) {
        await this.processBatch(batch);
        processed += batch.length;
      }

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

  /** Fallback para polling HTTP — usado se o cliente não suportar WS */
  getProgress(jobId: string): ImportProgressState | null {
    return this.progressMap.get(jobId) ?? null;
  }

  // ─── Cálculo de percentuais ────────────────────────────────────────

  private calcReadingPct(linesRead: number): number {
    const approx = Math.min(linesRead / 100_000, 1);
    return Math.floor(approx * 100);
  }

  private calcProcessingPct(processed: number, total: number): number {
    if (total === 0) return 0;
    return Math.floor((processed / total) * 100);
  }
  // ─── Batch helpers ────────────────────────────────────────────────

  private async processBatch(batch: CapexItem[]): Promise<void> {
    const uniqueDiagramas = [...new Set(batch.map((i) => i.diagrama_rede))];

    const missing = uniqueDiagramas.filter((d) => !this.obraCache.has(d));

    if (missing.length > 0) {
      const obraIdsMap = await this.repository.getObraIdsByDiagramas(missing);

      obraIdsMap.forEach((value, key) => this.obraCache.set(key, value));

      if (this.obraCache.size > this.MAX_CACHE) {
        this.obraCache.clear();
      }
    }

    const dataWithObraId = batch.map((item) => ({
      ...item,
      id_obra: this.obraCache.get(item.diagrama_rede) ?? null,
    }));

    await this.repository.insertCapex(dataWithObraId);
  }

  // ─── State helpers ────────────────────────────────────────────────

  private initProgress(jobId: string): void {
    this.progressMap.set(jobId, {
      phase: 'reading',
      processed: 0,
      percentage: 0,
      message: 'Importação iniciada',
    });
  }

  /** Remove o estado do job após TTL para evitar memory leak */
  private scheduleCleanup(jobId: string, ttlMs = 5 * 60 * 1_000): void {
    setTimeout(() => this.progressMap.delete(jobId), ttlMs);
  }
}
