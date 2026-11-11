import { ImportServiceItem } from 'src/domain/types';

export type ImportError = {
  row: number;
  message: string;
};

export type ImportSkippedRow = {
  row: number;
  reason: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: ImportError[];
  skippedRows: ImportSkippedRow[];
};

export type CatalogMapsOutput = {
  serviceCatalog: Map<string, number>;
  materialCatalog: Map<string, number>;
};

export type ValidateAndResolveItemsResult = {
  valid: ImportServiceItem[];
  errors: ImportError[];
};
