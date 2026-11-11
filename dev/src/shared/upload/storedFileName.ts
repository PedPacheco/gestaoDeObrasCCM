export const parseStoredNames = (value?: string | null): string[] =>
  (value ?? '')
    .split(';')
    .map((name) => name.trim())
    .filter(Boolean);

export const storedFilesOf = (row: {
  caminhos_arquivos?: string[] | null;
  caminho_arquivo?: string | null;
}): string[] =>
  row.caminhos_arquivos?.length
    ? row.caminhos_arquivos
    : parseStoredNames(row.caminho_arquivo);

/** Caminhos absolutos dos uploads gravados em disco (memoryStorage é ignorado). */
export const uploadedPaths = (
  files?: Express.Multer.File[] | Express.Multer.File,
): string[] =>
  (Array.isArray(files) ? files : files ? [files] : [])
    .map((f) => f.path)
    .filter(Boolean);
