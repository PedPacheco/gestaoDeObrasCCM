import { Decimal } from '@prisma/client/runtime/library';

export type GetSelectedServicesParamsRequest = {
  id: number;
  idProgramacao: number;
};

export type GetServicesByWorkIdResponse = {
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
};

export type GetServicesSelectedByWorkIdResponse = {
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
};

export type GetServiceScheduleHistoryResponse = {
  id: number;
  id_servico: number;
  servicos: {
    materiais?: { descricao: string; codigo: string };
    servicos_contratos?: { texto_breve: string; material: string };
    ponto: string;
    operacao: string;
    qtde_plan: number;
    viabilizado: number;
    numero_operacao: string;
    descricao_operacao: string;
  };
  id_programacao: number;
  programacoes: { data_prog: Date };
  equipes: { equipe: string; perfil: string };
  prog: number;
  real: number;
  adicional: number;
};

export type GetServiceOptionsResponse = {
  operation_description: string[];
  points: string[];
};

export type GetServicesContractsResponse = {
  id: number;
  texto_breve: string;
  material: string;
  preco: number;
  contrato: string;
  medida: string;
  turmas: { turma: string };
};

export type GetMaterialsContractsResponse = {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  preco: Decimal;
};

export type GetTeamsServicesResponse = {
  id: number;
  equipe: string;
  encarregado: string;
  perfil: string;
};
