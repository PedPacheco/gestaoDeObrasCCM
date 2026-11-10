export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const XLS_MIME = 'application/vnd.ms-excel';

const MB = 1024 * 1024;

/** PDF + imagens: viabilidade, as-built, D5, execução. */
export const DOCUMENT_UPLOAD_PRESET = {
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSize: 5 * MB,
  maxFiles: 3,
} as const;

/** Documentos + planilhas: módulo de serviços (as-built com planilha). */
export const DOCUMENT_AND_SPREADSHEET_UPLOAD_PRESET = {
  ...DOCUMENT_UPLOAD_PRESET,

  allowedMimeTypes: [
    ...DOCUMENT_UPLOAD_PRESET.allowedMimeTypes,
    XLSX_MIME,
    XLS_MIME,
  ],

  allowedExtensions: [
    ...DOCUMENT_UPLOAD_PRESET.allowedExtensions,
    '.xlsx',
    '.xls',
  ],
} as const;

/** Importação de CAPEX. */
export const CAPEX_UPLOAD_PRESET = {
  allowedMimeTypes: [XLSX_MIME],
  allowedExtensions: ['.xlsx'],
  maxSize: 150 * MB,
  maxFiles: 1,
} as const;

// ───────────── Entrega de ficheiros (download / static) ─────────────

/** Todas as extensões aceites em algum preset. */
export type AllowedExtension =
  (typeof DOCUMENT_AND_SPREADSHEET_UPLOAD_PRESET.allowedExtensions)[number];

/** Extensões que o navegador pode renderizar inline com segurança. */
export const INLINE_EXTENSIONS: ReadonlySet<string> = new Set<AllowedExtension>(
  ['.pdf', '.jpg', '.jpeg', '.png'],
);

/** Content-Type a usar na entrega. Se faltar uma extensão aceite, o build falha. */
export const MIME_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.xlsx': XLSX_MIME,
  '.xls': XLS_MIME,
} as const satisfies Record<AllowedExtension, string>;

export function mimeTypeFor(ext: string): string {
  return Object.hasOwn(MIME_BY_EXTENSION, ext)
    ? MIME_BY_EXTENSION[ext as AllowedExtension]
    : 'application/octet-stream';
}

export function isInlineExtension(ext: string): boolean {
  return INLINE_EXTENSIONS.has(ext);
}
