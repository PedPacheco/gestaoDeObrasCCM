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
}

export interface GetServiceOptionsResponse {
  operation_description: string[];
  points: string[];
}

export type ServiceToExport = {
  id_programacao: number;
  id_equipe: number;
  operacao: string;
  ponto: string;
  viabilizado: number | null;
  qtde_adicional: number | null;
  equipes: {
    equipe: string | null;
  } | null;

  materiais: {
    codigo: string | null;
    descricao: string | null;
    preco: Decimal;
    unidade: string;
  } | null;

  servicos_contratos: {
    material: string | null;
    texto_breve: string | null;
    preco: number;
    medida: string;
  } | null;
};

export type WorkProgrammingToExport = {
  id: number;
  data_prog: Date;
  prog: number;
  tipo_servico: string | null;
  observacao_programacao: string | null;
  chi: number | null;
  num_dp: string | null;
  chave_provisoria: boolean | null;
  hora_ter: Date;
  hora_ini: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  tecnicos: { tecnico: string };
};

export type WorkToExportResponse = {
  ovnota: string;
  diagrama: string | null;
  referencia: string | null;
  ordem_dci: string | null;
  ordem_dca: string | null;
  ordem_dcd: string | null;
  ordem_dcim: string | null;
  executado: number | null;
  tipos: {
    tipo_obra: string;
  };
  municipios: {
    municipio: string;
  };
  turmas: {
    turma: string;
  };
  empreendimento: {
    empreendimento: string | null;
  };
  circuitos: {
    circuito: string;
    conjuntos: {
      conjunto: string;
    };
  };
  programacoes: WorkProgrammingToExport[];
  servicos: ServiceToExport[];
};

export type ExportServicesExcelOutput = {
  ovnota: string;
  ordemDiagrama: string | null;
  referencia: string | null;
  tipoObra: string;
  municipio: string;
  circuito: string;
  conjunto: string;
  parceira: string;
  executado: number;
  empreendimento: string;
  dataProg: Date | null;
  prog: number | null;
  observacaoProgramacao: string | null;
  numDp: string;
  horaIni: Date;
  horaTer: Date;
  equipeLv: number;
  equipeLm: number;
  equipeRegul: number;
  tecnicoResponsavel: string;
  equipe: string | null;
  operacao: string | null;
  ponto: string | null;
  preco: number;
  valorTotal: number;
  tipo: string;
  unidade: string;
  codigo: string;
  descricao: string;
  quantidadeProgramada: number;
};
