import * as ExcelJS from 'exceljs';
import * as fs from 'node:fs/promises';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

import {
  CAPEX_HEADER_ROWS,
  type CapexRowError,
  mapCapexRow,
} from './capexRow.mapper';
import { loadSharedStrings, resolveSharedStrings } from './sharedStrings'; // NOVO

export interface CapexWorkerInput {
  filePath: string;
  outputPath: string;
  maxRows: number;
  maxErrors: number;
}

export type CapexWorkerMessage =
  | { type: 'progress'; rowsRead: number }
  | { type: 'done'; totalRows: number }
  | { type: 'invalid'; totalRows: number; errors: CapexRowError[] }
  | { type: 'fatal'; message: string };

const PROGRESS_EVERY_ROWS = 5000;
const WRITE_BUFFER_BYTES = 1_000_000;

export async function runCapexParser(
  input: CapexWorkerInput,
  post: (message: CapexWorkerMessage) => void,
): Promise<void> {
  const errors: CapexRowError[] = [];
  let totalRows = 0;
  let limitExceeded = false;

  // NOVO — 1.ª passagem: tabela de textos, independente da ordem do ZIP
  const sharedStrings = await loadSharedStrings(input.filePath);

  const output = await fs.open(input.outputPath, 'w');
  let buffer = '';

  const flush = async () => {
    if (buffer.length > 0) {
      await output.write(buffer);
      buffer = '';
    }
  };

  try {
    // 2.ª passagem: leitura da folha em streaming
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(input.filePath, {
      entries: 'emit',
      // Mantido em 'cache': com 'ignore' a entrada pode não ser consumida e
      // bloquear o unzip. O que o ExcelJS não resolver é resolvido abaixo.
      sharedStrings: 'cache',
      hyperlinks: 'emit',
      worksheets: 'emit',
    });

    scan: for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        if (row.number <= CAPEX_HEADER_ROWS) continue;

        // NOVO — troca { sharedString: n } pelo texto
        const values = resolveSharedStrings(
          row.values as unknown[],
          sharedStrings,
        );

        const mapped = mapCapexRow(values, row.number);
        if (mapped.empty) continue; // linha formatada, mas sem dados

        totalRows++;
        if (totalRows > input.maxRows) {
          limitExceeded = true;
          break scan;
        }

        if (mapped.errors.length > 0) {
          errors.push(...mapped.errors);
          // Para cedo: o usuário só precisa dos primeiros erros para corrigir.
          if (errors.length >= input.maxErrors) break scan;
          continue;
        }

        buffer += JSON.stringify(mapped.item) + '\n';
        if (buffer.length >= WRITE_BUFFER_BYTES) await flush();

        if (totalRows % PROGRESS_EVERY_ROWS === 0) {
          post({ type: 'progress', rowsRead: totalRows });
        }
      }
    }

    await flush();
  } finally {
    await output.close();
  }

  if (limitExceeded) {
    post({
      type: 'invalid',
      totalRows,
      errors: [
        {
          row: 0,
          column: '-',
          message: `a planilha excede o limite de ${input.maxRows} linhas`,
        },
      ],
    });
    return;
  }

  if (errors.length > 0) {
    post({
      type: 'invalid',
      totalRows,
      errors: errors.slice(0, input.maxErrors),
    });
    return;
  }

  if (totalRows === 0) {
    post({
      type: 'invalid',
      totalRows: 0,
      errors: [
        {
          row: 0,
          column: '-',
          message: 'a planilha não possui linhas de dados',
        },
      ],
    });
    return;
  }

  post({ type: 'done', totalRows });
}

if (!isMainThread && parentPort) {
  const port = parentPort;
  runCapexParser(workerData as CapexWorkerInput, (message) =>
    port.postMessage(message),
  ).catch((error: unknown) => {
    port.postMessage({
      type: 'fatal',
      message: error instanceof Error ? error.message : String(error),
    } satisfies CapexWorkerMessage);
  });
}
