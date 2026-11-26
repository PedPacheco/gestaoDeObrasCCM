import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';

import {
  CapexParseResult,
  ICapexFileParser,
} from 'src/domain/contracts/ICapexFileParser';
import { Worker } from 'worker_threads';
import type {
  CapexWorkerInput,
  CapexWorkerMessage,
} from './capexFileParser.worker';
import type { CapexRowError } from './capexRow.mapper';

/** Quantos erros de linha são mostrados ao usuário. */
const MAX_REPORTED_ERRORS = 10;

/** Limite de linhas de dados por planilha (proteção contra arquivos abusivos). */
const DEFAULT_MAX_ROWS = 500_000;

/**
 * Executa o parsing/validação do xlsx em um worker_thread (sem Redis nem
 * qualquer serviço externo: funciona em servidor offline).
 */
@Injectable()
export class WorkerCapexFileParser implements ICapexFileParser {
  private readonly logger = new Logger(WorkerCapexFileParser.name);

  private readonly workerFile = join(__dirname, 'capexFileParser.worker.js');

  private readonly maxRows =
    Number(process.env.CAPEX_MAX_ROWS) > 0
      ? Number(process.env.CAPEX_MAX_ROWS)
      : DEFAULT_MAX_ROWS;

  async parse(
    filePath: string,
    onProgress?: (rowsRead: number) => void,
  ): Promise<CapexParseResult> {
    if (!existsSync(this.workerFile)) {
      throw new Error(`Arquivo do worker não encontrado: ${this.workerFile}`);
    }

    const outputPath = `${filePath}.ndjson`;

    const input: CapexWorkerInput = {
      filePath,
      outputPath,
      maxRows: this.maxRows,
      maxErrors: MAX_REPORTED_ERRORS,
    };

    return new Promise<CapexParseResult>((resolve, reject) => {
      const worker = new Worker(this.workerFile, { workerData: input });
      let settled = false;

      const settle = (finish: () => void, removeOutput: boolean) => {
        if (settled) return;
        settled = true;

        void worker.terminate();

        if (removeOutput) {
          fs.unlink(outputPath)
            .catch(() => undefined)
            .finally(finish);
        } else {
          finish();
        }
      };

      worker.on('message', (message: CapexWorkerMessage) => {
        switch (message.type) {
          case 'progress':
            onProgress?.(message.rowsRead);
            break;

          case 'done':
            settle(
              () =>
                resolve({
                  totalRows: message.totalRows,
                  ndjsonPath: outputPath,
                }),
              false,
            );
            break;

          case 'invalid':
            settle(
              () => reject(this.buildValidationError(message.errors)),
              true,
            );
            break;

          case 'fatal':
            this.logger.error(`Falha no worker de CAPEX: ${message.message}`);
            settle(() => reject(new Error(message.message)), true);
            break;
        }
      });

      worker.on('error', (error) => {
        settle(() => reject(error), true);
      });

      worker.on('exit', (code) => {
        settle(
          () =>
            reject(new Error(`Worker encerrou (code ${code}) sem concluir`)),
          true,
        );
      });
    });
  }

  private buildValidationError(errors: CapexRowError[]): BadRequestException {
    const details = errors
      .map((error) =>
        error.row > 0
          ? `linha ${error.row}, coluna ${error.column}: ${error.message}`
          : error.message,
      )
      .join('; ');

    return new BadRequestException(
      `Planilha inválida, nenhum dado foi alterado. ${details}`,
    );
  }
}
