import { Decimal } from '@prisma/client/runtime/library';

export interface GetAllServicesOfWorkInterface {
  id: number;
  id_contrato_servico: number;
  ponto: string;
  operacao: string;
  qtde_adicional: number;
  viabilizado: number;
  qtde_real: number;
}

export interface GetSelectedServicesParamsInterface {
  id: number;
  idProgramacao: number;
}

export interface GetServicesByWorkIdResponse {
  id: number;
  id_obra: number;
  id_contrato_servico: number;
  id_material: number;
  operacao: string;
  ponto: string;
  qtde_plan: number;
  qtde_prog: number;
  qtde_real: number;
  qtde_adicional: number;
  viabilizado: number;
  descricao_operacao: string;
  numero_operacao: string;
  programacoes: { data_prog: Date };
  materiais: { codigo: string; descricao: string; preco: Decimal };
  servicos_contratos: {
    material: string;
    texto_breve: string;
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
  qtde_adicional: number;
  viabilizado: number;
  descricao_operacao: string;
  numero_operacao: string;
  materiais: { codigo: string; descricao: string; preco: Decimal };
  servicos_contratos: {
    material: string;
    texto_breve: string;
    preco: number;
  };
  programacoes: { data_prog: Date };
  equipes: { equipe: string; encarregado: string; perfil: string };
}

export interface GetServiceScheduleHistoryResponse {
  id: number;
  id_servico: number;
  servicos: {
    materiais?: { descricao: string };
    servicos_contratos?: { texto_breve: string };
    ponto: string;
    operacao: string;
    qtde_plan: number;
    viabilizado: number;
  };
  id_programacao: number;
  programacoes: { data_prog: Date };
  equipes: { equipe: string };
  prog: number;
  real: number;
  adicional: number;
}

export interface GetServiceOptionsResponse {
  operation_description: string[];
  operation_number: string[];
  points: string[];
}
