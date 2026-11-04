export type UpdateNotesInput = {
  obra: string;
  referencia: string;
  idMunicipio: number;
  idEmpreendimento: number;
  idTipo: number;
  idTurma: number;
  idCircuito: number;
  anoplan?: number;
  pep: string;
  ordem_dci?: string;
  ordem_dcd?: string;
  ordem_dca?: string;
  ordem_dcim?: string;
  moPlan?: number;
  qtdePlan?: number;
};

export type UpdateMarketWorksInput = {
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

export type UpdateWorkInput = {
  id_turma: number;
  id_status: number;
  data_empreitamento?: Date | null;
  observ_obra?: string;
  reasonSuspension?: string;
};

export type WorkOrderKey = {
  ovnota: string;
  ordem_dci?: string | null;
  ordem_dcd?: string | null;
  ordem_dca?: string | null;
  ordem_dcim?: string | null;
};

export type ExistingNote = {
  id: number;
  ovnota: string;
  ordemDci?: string | null;
  ordemDcd?: string | null;
  ordemDca?: string | null;
  ordemDcim?: string | null;
};
