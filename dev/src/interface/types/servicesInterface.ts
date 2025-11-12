export interface GetByIdParamsInterface {
  id: number;
  point?: string;
  service?: string;
  operation?: string;
}

export interface GetSelectedServicesParamsInterface {
  id: number;
  dataProg: string;
  point?: string;
  service?: string;
  operation?: string;
}

export interface GetServicesByWorkIdResponse {
  id: number;
  id_obra: number;
  operacao: string;
  ponto: string;
  data_prog: Date;
  qtde_plan: number;
  qtde_prog: number;
  qtde_real: number;
  obras: { ovnota: string };
  servicos_contratos: {
    material: string;
    texto_breve: string;
    medida: string;
    contrato: string;
    preco: number;
  };
}

export interface GetServicesSelectedByWorkIdResponse {
  id: number;
  id_obra: number;
  operacao: string;
  ponto: string;
  data_prog: Date;
  qtde_plan: number;
  qtde_prog: number;
  qtde_real: number;
  obras: { ovnota: string };
  servicos_contratos: {
    material: string;
    texto_breve: string;
    medida: string;
    contrato: string;
    preco: number;
  };
  equipes: { equipe: string; encarregado: string; perfil: string };
}

export interface GetServiceScheduleHistoryResponse {
  id: number;
  ponto: string;
  operacao: string;
  programacoes_servicos: {
    plan: number;
    prog: number;
    real: number;
    id: number;
    programacoes: { data_prog: Date };
  }[];
  servicos_contratos: { texto_breve: string };
}

export interface GetServicesFiltersResponse {
  services: { texto_breve: string }[];
  operations: { operacao: string }[];
  points: { ponto: string }[];
}
