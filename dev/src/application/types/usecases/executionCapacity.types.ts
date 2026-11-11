export type ExecutionCapacityInput = {
  ano: string;
  idRegional?: number[];
  idParceira?: number[];
  equipe?: string[];
};

export type UpdateExecutionCapacityInput = {
  id: number;
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out?: number;
  nov?: number;
  dez?: number;
};

export type ExecutionCapacityOutput = {
  id: number;
  ano: string;
  regional: string;
  parceira: string;
  id_regional: number;
  tipo: string;
  qtd_equipes_rfp: number;
  equipe: string;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
};

export type ExecutionCapacityFinancialValueOutput = {
  ano: number;
  regional: string;
  parceira: string;
  total_rfp: number;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
};
