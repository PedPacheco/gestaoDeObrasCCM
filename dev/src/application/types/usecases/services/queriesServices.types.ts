export type ItemType = 'M' | 'S';

export type WorkServiceItemOutput = {
  id: number;
  idObra: number;
  operacao: string | null;
  ponto: string | null;
  numeroOperacao: string | null;
  descricaoOperacao: string | null;
  material: string | null;
  textoBreve: string | null;
  dataProgramada: Date | null;
  qtdePlanejada: number;
  qtdeAdicional: number;
  viabilizado: number;
  qtdeRealizada: number;
  tipo: ItemType;
  valorUnit: number;
  valorTotal: number;
  valorReal: number;
};

export type GetAllItemsOutput = WorkServiceItemOutput & {
  qtdeProgramada: number;
};

export type GetNotScheduledServicesOutput = WorkServiceItemOutput;

export type GetSelectedServicesOutput = {
  id: number;
  idObra: number;
  operacao: string | null;
  ponto: string | null;
  numeroOperacao: string | null;
  descricaoOperacao: string | null;
  material: string | null;
  textoBreve: string | null;
  dataProgramada: Date;
  qtdePlanejada: number;
  qtdeProgramada: number;
  qtdeRealizada: number;
  qtdeAdicional: number;
  viabilizado: number;
  tipo: ItemType;
  valorUnit: number;
  valorProg: number;
  valorReal: number;
  equipe: string | null;
  encarregado: string | null;
  perfil: string | null;
};

export type GetServiceScheduleHistoryOutput = {
  id: number;
  idProg: number;
  idServico: number;
  operacao: string | null;
  numeroOperacao: string | null;
  descricaoOperacao: string | null;
  ponto: string | null;
  codigo: string | null;
  textoBreve: string | null;
  tipo: ItemType;
  dataProgramada: Date | null;
  qtdeProgramada: number;
  qtdePlanejada: number;
  qtdeViabilizado: number;
  qtdeAdicional: number;
  qtdeRealizada: number;
  equipe: string | null;
  perfil: string | null;
};
