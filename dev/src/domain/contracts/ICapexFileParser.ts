export interface CapexParseResult {
  /** Linhas de dados válidas (sem cabeçalho nem linhas vazias). */
  totalRows: number;
  /** Arquivo NDJSON com uma CapexRow normalizada por linha. */
  ndjsonPath: string;
}

/**
 * Lê e valida a planilha CN52N SEM tocar no banco.
 *
 * Grava as linhas normalizadas em um arquivo NDJSON temporário, que o
 * chamador consome e remove. Se a planilha for inválida, lança
 * BadRequestException com as primeiras linhas problemáticas, e nenhum
 * arquivo temporário permanece.
 */
export interface ICapexFileParser {
  parse(
    filePath: string,
    onProgress?: (rowsRead: number) => void,
  ): Promise<CapexParseResult>;
}

export const CAPEX_FILE_PARSER = Symbol('CapexFileParser');
