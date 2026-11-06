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
