export type InsertMarketWorkInput = {
  obra: string;
  pep: string;
  diagrama: string;
  entrada?: Date;
  idMunicipio: number;
  idTipo: number;
  idCircuito: number;
  idParceira: number;
  prazoTexto: string;
  statusOv: number;
  statusDiagrama: string;
  statusPep: string;
  equipeNumPedido: string;
  moCliente: number;
  moEmpresa: number;
};

export type InsertNoteInput = {
  obra: string;
  dci: string;
  dcd: string;
  dca: string;
  dcim: string;
  entrada: Date;
  prazo: string;
  referencia: string;
  aux_gpm: number;
  aux_empreendimento: number;
  aux_tipo: number;
  aux_turma: number;
  aux_circuito: number;
  aux_tecnico: number;
  anoplan: number;
  ehRda: boolean;
};
