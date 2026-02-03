export interface GetByIdParamsInterface {
  id: number;
  point?: string;
  service?: string;
  operation?: string;
}

export interface GetSelectedServicesParamsInterface {
  id: number;
  idProgramacao: number;
  point?: string;
  service?: string;
  operation?: string;
}

export interface GetServicesByWorkIdResponse {
  id: number;
  id_obra: number;
  operacao: string;
  ponto: string;
  qtde_plan: number;
  qtde_prog: number;
  qtde_real: number;
  obras: { ovnota: string };
  programacoes: { data_prog: Date };
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
  programacoes: { data_prog: Date };
  equipes: { equipe: string; encarregado: string; perfil: string };
}

export interface GetServiceScheduleHistoryResponse {
  id: number;
  servicos: {
    servicos_contratos: { texto_breve: string };
    ponto: string;
    operacao: string;
  };
  id_programacao: number;
  programacoes: { data_prog: Date };
  prog: number;
  plan: number;
  real: number;
}

export interface GetServicesFiltersResponse {
  services: { texto_breve: string }[];
  operations: { operacao: string }[];
  points: { ponto: string }[];
}
