import type { RejectFeasibilityData } from 'src/domain/types';
export type { FeasibilityFileType, StatusFeasibility } from 'src/domain/types';

/** Item enviado pelo front. Na 5C, o controller converte o DTO para este tipo. */
export interface FeasibleItemInput {
  id: number;
  viabilizado: number;
}

export type RejectFeasibilityInput = RejectFeasibilityData & { workId: number };

/** Formato atual da API do exists. Não mudar sem alinhar com o front. */
export interface FeasibilityReportOutput {
  id: number;
  id_obra: number;
  id_usuario: number | null;
  caminhos_arquivos: string[];
  arquivos_complementares: string[];
  data_envio: Date | null;
  prazo_viabilidade: string | null;
  aprovada: boolean | null;
  data_aprovacao: Date | null;
  id_usuario_aprovador: number | null;
}

export interface FeasibilityRejectionOutput {
  descricao: string | null;
  motivo: string | null;
  usuario: string | null;
  criado_em: Date;
}

export interface FeasibilityPendingExportOutput {
  ovnota: string | null;
  ordemDiagrama: string | null;
  operacao: string | null;
  ponto: string | null;
  numeroOperacao: string | null;
  descricaoOperacao: string | null;
  material: string | null;
  textoBreve: string | null;
  qtdePlanejada: number | null;
  tipo: 'M' | 'S';
  valorUnit: number;
  valorTotal: number;
}

export interface FeasibilityApprovalExportOutput {
  ovnota: string | null;
  ordemDiagrama: string | null;
  data_envio: Date | null;
  operacao: string | null;
  ponto: string | null;
  numeroOperacao: string | null;
  descricaoOperacao: string | null;
  material: string | null;
  textoBreve: string | null;
  qtdePlanejada: number | null;
  viabilizado: number | null;
  tipo: 'M' | 'S';
  valorUnit: number;
  valorTotal: number;
  diferença: number;
  alterado: 'Sim' | 'Não';
}
