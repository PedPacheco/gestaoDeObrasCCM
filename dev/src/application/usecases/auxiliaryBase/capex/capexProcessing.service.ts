import { createReadStream, promises as fs } from 'fs';
import pLimit from 'p-limit';
import { createInterface } from 'readline';
import {
  CapexInsertItem,
  CapexProgressPayload,
  ProgressEmitter,
} from 'src/application/types';
import { toSafeCapexErrorMessage } from 'src/application/types/usecases/auxiliaryBase/capex-error.util';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/contracts/IAuxiliaryBaseRepository';
import {
  CAPEX_FILE_PARSER,
  ICapexFileParser,
} from 'src/domain/contracts/ICapexFileParser';
import { CapexRow } from 'src/domain/entities/capex.entity';

import { Inject, Injectable, Logger } from '@nestjs/common';

export type ImportProgressState = CapexProgressPayload;

/** Contadores das linhas que não puderam ser vinculadas a uma obra. */
class SkippedRows {
  ignored = 0;
  ambiguous = 0;

  private readonly ignoredSample = new Set<string>();
  private readonly ambiguousSample = new Set<string>();

  addIgnored(diagrama: string | null): void {
    this.ignored++;
    this.collect(this.ignoredSample, diagrama);
  }

  addAmbiguous(diagrama: string): void {
    this.ambiguous++;
    this.collect(this.ambiguousSample, diagrama);
  }

  get ignoredExamples(): string[] {
    return [...this.ignoredSample];
  }

  get ambiguousExamples(): string[] {
    return [...this.ambiguousSample];
  }

  private collect(sample: Set<string>, diagrama: string | null): void {
    if (diagrama && sample.size < 20) sample.add(diagrama);
  }
}

/**
 * Importação da planilha CN52N para a tabela cn52n.
 *
 * Duas fases, para que uma planilha inválida NUNCA apague dados:
 *  1. reading     → o parser (worker thread) lê e valida o arquivo inteiro
 *                   e grava as linhas normalizadas em um NDJSON temporário.
 *                   Nenhuma escrita no banco.
 *  2. processing  → só então faz o TRUNCATE e carrega o NDJSON em batches,
 *                   vinculando cada linha à obra pelo diagrama.
 *
 * O serviço não guarda estado entre execuções (cache e contadores são locais
 * a cada process()).
 */
@Injectable()
export class CapexProcessingService {
  private readonly logger = new Logger(CapexProcessingService.name);

  private readonly BATCH_SIZE = 1000;
  private readonly MAX_CACHE = 50_000;
  private readonly CONCURRENCY = 5;
  private readonly DRAIN_EVERY = 20;

  /**
   * Na validação o total de linhas ainda não é conhecido, então o percentual
   * é uma estimativa (curva que satura perto de 99%).
   */
  private readonly ESTIMATED_ROWS_SCALE = 60_000;

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly repository: IAuxiliaryBaseRepository,
    @Inject(CAPEX_FILE_PARSER)
    private readonly parser: ICapexFileParser,
  ) {}

  async process(
    filePath: string,
    jobId: string,
    onProgress?: ProgressEmitter,
  ): Promise<void> {
    const emit = (payload: CapexProgressPayload) => onProgress?.(payload);

    let ndjsonPath: string | undefined;

    try {
      // ─── Fase 1: leitura + validação (nada é gravado no banco) ─────
      emit({
        phase: 'reading',
        processed: 0,
        percentage: 0,
        message: 'Validando planilha...',
      });

      const parsed = await this.parser.parse(filePath, (rowsRead) =>
        emit({
          phase: 'reading',
          processed: rowsRead,
          percentage: this.estimateReadingPercentage(rowsRead),
          message: `Validando linha ${rowsRead}...`,
        }),
      );

      ndjsonPath = parsed.ndjsonPath;

      emit({
        phase: 'reading',
        processed: parsed.totalRows,
        percentage: 100,
        message: `Planilha validada: ${parsed.totalRows} linhas`,
      });

      // ─── Fase 2: carga (a partir daqui o banco é alterado) ─────────
      await this.repository.truncateCN52N();

      const skipped = await this.load(ndjsonPath, parsed.totalRows, emit);

      this.logSkipped(jobId, skipped);

      emit({
        phase: 'completed',
        processed: parsed.totalRows,
        percentage: 100,
        message: this.buildProgressMessage(parsed.totalRows, skipped, true),
      });
    } catch (error: any) {
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
      await this.removeFile(filePath);
      if (ndjsonPath) await this.removeFile(ndjsonPath);
    }
  }

  // ─── Carga do NDJSON ───────────────────────────────────────────────

  private async load(
    ndjsonPath: string,
    totalRows: number,
    emit: (payload: CapexProgressPayload) => void,
  ): Promise<SkippedRows> {
    // Limite de concorrência e cache por execução (não compartilhados entre jobs).
    const limit = pLimit(this.CONCURRENCY);
    const obraCache = new Map<string, number[]>();
    const skipped = new SkippedRows();

    let tasks: Promise<void>[] = [];
    let failed = false;
    let failure: unknown;

    // As promises em `tasks` nunca rejeitam: o primeiro erro é registrado e os
    // batches seguintes viram no-op. Assim não há unhandled rejection e nada
    // é inserido depois da falha.
    const dispatch = (chunk: CapexRow[]) => {
      tasks.push(
        limit(async () => {
          if (failed) return;
          await this.processBatch(chunk, obraCache, skipped);
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

    const lines = createInterface({
      input: createReadStream(ndjsonPath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    try {
      let batch: CapexRow[] = [];
      let processed = 0;
      let batchesDispatched = 0;

      for await (const line of lines) {
        if (!line) continue;

        batch.push(JSON.parse(line) as CapexRow);

        if (batch.length >= this.BATCH_SIZE) {
          processed += batch.length;
          dispatch(batch);
          batch = [];
          batchesDispatched++;

          throwIfFailed(); // falha cedo

          // Aqui o total é conhecido: percentual exato.
          emit({
            phase: 'processing',
            processed,
            percentage: Math.min(99, Math.floor((processed / totalRows) * 100)),
            message: this.buildProgressMessage(processed, skipped),
          });

          if (batchesDispatched % this.DRAIN_EVERY === 0) {
            await Promise.all(tasks);
            tasks = [];
            throwIfFailed();
          }
        }
      }

      if (batch.length > 0) dispatch(batch);

      await Promise.all(tasks);
      throwIfFailed();

      return skipped;
    } catch (error) {
      failed = true; // batches ainda na fila viram no-op
      await Promise.all(tasks); // espera só os que já estavam em execução
      throw error;
    } finally {
      lines.close();
    }
  }

  private async processBatch(
    batch: CapexRow[],
    obraCache: Map<string, number[]>,
    skipped: SkippedRows,
  ): Promise<void> {
    const missing = [
      ...new Set(
        batch
          .map((item) => item.diagrama_rede)
          .filter((d): d is string => !!d && !obraCache.has(d)),
      ),
    ];

    if (missing.length > 0) {
      const found = await this.repository.getObraIdsByDiagramas(missing);

      for (const diagrama of missing) {
        // Guarda também os diagramas sem obra: evita consultá-los de novo.
        obraCache.set(diagrama, found.get(diagrama) ?? []);

        if (obraCache.size > this.MAX_CACHE) {
          const firstKey = obraCache.keys().next().value;
          obraCache.delete(firstKey);
        }
      }
    }

    const validItems: CapexInsertItem[] = [];

    for (const item of batch) {
      const ids = item.diagrama_rede
        ? (obraCache.get(item.diagrama_rede) ?? [])
        : [];

      if (ids.length === 1) {
        validItems.push({ ...item, id_obra: ids[0] });
      } else if (ids.length === 0) {
        skipped.addIgnored(item.diagrama_rede);
      } else {
        // O mesmo diagrama em mais de uma obra: não dá para escolher uma sem
        // arriscar atribuir o CAPEX à obra errada.
        skipped.addAmbiguous(item.diagrama_rede as string);
      }
    }

    if (validItems.length > 0) {
      await this.repository.insertCapex(validItems);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private buildProgressMessage(
    processed: number,
    skipped: SkippedRows,
    completed = false,
  ): string {
    const details =
      skipped.ambiguous > 0
        ? `${skipped.ignored} ignorados, ${skipped.ambiguous} ambíguos`
        : `${skipped.ignored} ignorados`;

    return completed
      ? `Importação concluída: ${processed} registros (${details})`
      : `${processed} registros processados (${details})`;
  }

  private logSkipped(jobId: string, skipped: SkippedRows): void {
    if (skipped.ignored > 0) {
      this.logger.warn(
        `Job ${jobId}: ${skipped.ignored} linhas ignoradas (diagrama sem obra). ` +
          `Exemplos: ${skipped.ignoredExamples.join(', ')}`,
      );
    }

    if (skipped.ambiguous > 0) {
      this.logger.warn(
        `Job ${jobId}: ${skipped.ambiguous} linhas ambíguas (diagrama em mais de uma obra). ` +
          `Exemplos: ${skipped.ambiguousExamples.join(', ')}`,
      );
    }
  }

  private estimateReadingPercentage(rowsRead: number): number {
    const ratio = 1 - Math.exp(-rowsRead / this.ESTIMATED_ROWS_SCALE);
    return Math.min(99, Math.floor(ratio * 100));
  }

  private async removeFile(path: string): Promise<void> {
    await fs
      .unlink(path)
      .catch(() =>
        this.logger.warn(`Não foi possível remover o arquivo ${path}`),
      );
  }
}
