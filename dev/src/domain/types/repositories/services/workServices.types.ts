export type SchedulesProgressUpdate = {
  idProgramacao: number;
  prog: number;
  exec: number;
};

export type ParsedSpreadsheetItem = {
  point: string | null;
  operation: string | null;
  operationNumber: string | null;
  materialCode: string | null;
  plannedQuantity: number;
  type: 'service' | 'material';
  operationDescription: string | null;
};

export type ImportServiceItem = {
  idService: number;
  type: 'service' | 'material';
  operation?: string;
  point: string;
  operationNumber: string;
  operationDescription: string;
  plannedQuantity: number;
};
