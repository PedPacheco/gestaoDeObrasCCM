import * as ExcelJS from 'exceljs';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';

import { Inject, Injectable } from '@nestjs/common';

export interface ProgressState {
  total: number;
  processed: number;
  percentage: number;
  status: 'processing' | 'done' | 'error';
}

@Injectable()
export class CapexProcessingService {
  private obraCache = new Map<string, number>();
  private progressMap = new Map<string, ProgressState>();

  private readonly BATCH_SIZE = 5000;

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly repository: IAuxiliaryBaseRepository,
  ) {}

  async process(filePath: string, jobId: string): Promise<void> {
    try {
      await this.repository.truncateCN52N();

      this.initProgress(jobId);

      const totalRows = await this.countRows(filePath);
      this.setTotal(jobId, totalRows);

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        entries: 'emit',
        sharedStrings: 'cache',
        hyperlinks: 'emit',
        worksheets: 'emit',
      });

      let batch: any[] = [];
      let processed = 0;

      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          if (row.number <= 2) continue;

          const item = this.mapRow(row.values as any[]);

          batch.push(item);
          processed++;

          if (processed % 1000 === 0) {
            this.updateProgress(jobId, processed, totalRows);
          }

          if (batch.length >= this.BATCH_SIZE) {
            await this.processBatch(batch);
            batch = [];
          }
        }
      }

      if (batch.length) {
        await this.processBatch(batch);
      }

      this.updateProgress(jobId, totalRows, totalRows, 'done');
    } catch (error) {
      this.setError(jobId);
      throw error;
    } finally {
      await import('fs').then((fs) =>
        fs.promises.unlink(filePath).catch(() => {}),
      );
    }
  }

  getProgress(jobId: string): ProgressState | null {
    return this.progressMap.get(jobId) ?? null;
  }

  // =========================
  // PRIVATE HELPERS
  // =========================

  private initProgress(jobId: string) {
    this.progressMap.set(jobId, {
      total: 0,
      processed: 0,
      percentage: 0,
      status: 'processing',
    });
  }

  private setTotal(jobId: string, total: number) {
    const state = this.progressMap.get(jobId);
    if (!state) return;

    this.progressMap.set(jobId, {
      ...state,
      total,
    });
  }

  private setError(jobId: string) {
    const state = this.progressMap.get(jobId);
    if (!state) return;

    this.progressMap.set(jobId, {
      ...state,
      status: 'error',
    });
  }

  private async countRows(filePath: string): Promise<number> {
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      entries: 'emit',
      sharedStrings: 'cache',
      hyperlinks: 'emit',
      worksheets: 'emit',
    });

    let total = 0;

    for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        if (row.number > 2) total++;
      }
    }

    return total;
  }

  private updateProgress(
    jobId: string,
    processed: number,
    total: number,
    status: 'processing' | 'done' = 'processing',
  ) {
    const percentage = Math.min(100, Math.floor((processed / total) * 100));

    this.progressMap.set(jobId, {
      total,
      processed,
      percentage,
      status,
    });
  }

  private mapRow(values: any[]) {
    return {
      diagrama_rede: values[2]?.toString(),
      def_proj: values[3],
      material: values[4]?.toString(),
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

  private async processBatch(batch: any[]) {
    const uniqueDiagramas = [
      ...new Set(batch.map((item) => item.diagrama_rede)),
    ];

    const missingDiagramas = uniqueDiagramas.filter(
      (d) => !this.obraCache.has(d),
    );

    if (missingDiagramas.length) {
      const obraIdsMap =
        await this.repository.getObraIdsByDiagramas(missingDiagramas);

      obraIdsMap.forEach((value, key) => {
        this.obraCache.set(key, value);
      });
    }

    const dataWithObraId = batch.map((item) => ({
      ...item,
      id_obra: this.obraCache.get(item.diagrama_rede) ?? null,
    }));

    await this.repository.insertCapex(dataWithObraId);
  }
}
