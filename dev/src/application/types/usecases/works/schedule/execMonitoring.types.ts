export type GetExecMonitoringInput = {
  dataInicial?: string;
  dataFinal?: string;
  idRegional?: number[];
  idTecnico?: number[];
  idParceira?: number[];
  idTipo?: number[];
};

export type GetExecMonitoringOutput = {
  mes: string;
  regional: string;
  id_regional: number;
  parceira: string;
  total: number;
  acompanhado: number;
  naoAcompanhado: number;
  pct: number;
};
