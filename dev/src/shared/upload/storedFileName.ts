/** Caminhos absolutos dos uploads gravados em disco (memoryStorage é ignorado). */
export const uploadedPaths = (
  files?: Express.Multer.File[] | Express.Multer.File,
): string[] =>
  (Array.isArray(files) ? files : files ? [files] : [])
    .map((f) => f.path)
    .filter(Boolean);
