import { gap_analysis_audits } from '@prisma/client';

export interface CreateGapAnalysisAuditData {
  parceira: string;
  num_auditoria?: string;
  data_inicio?: string;
  data_fim?: string;
  gap_anterior?: string;
  gap_atual?: string;
  apresentacao_interna?: string;
  reuniao_apresentacao?: string;
  notificacao_gestao?: string;
  retorno_parceira?: string;
  validacao_plano_edp?: string;
  plano_validado?: string;
  devolutiva_novo_plano?: string;
  validacao_novo_plano?: string;
  lancamento_desvios_sgs?: string;
  inicio_acompanhamento?: string;
  quantidade_desvios_planejados?: string;
  quantidade_desvios_executados?: string;
  executados_fora_prazo?: string;
  itens_pendentes_fora_do_prazo?: string;
  observacao?: string;
  status?: string;
}

export interface UpdateGapAnalysisAuditData {
  parceira?: string;
  num_auditoria?: string;
  data_inicio?: string;
  data_fim?: string;
  gap_anterior?: string;
  gap_atual?: string;
  apresentacao_interna?: string;
  reuniao_apresentacao?: string;
  notificacao_gestao?: string;
  retorno_parceira?: string;
  validacao_plano_edp?: string;
  plano_validado?: string;
  devolutiva_novo_plano?: string;
  validacao_novo_plano?: string;
  lancamento_desvios_sgs?: string;
  inicio_acompanhamento?: string;
  quantidade_desvios_planejados?: string;
  quantidade_desvios_executados?: string;
  executados_fora_prazo?: string;
  itens_pendentes_fora_do_prazo?: string;
  observacao?: string;
  status?: string;
}

export interface IGapAnalysisAuditRepository {
  findAll(): Promise<gap_analysis_audits[]>;
  create(data: CreateGapAnalysisAuditData): Promise<gap_analysis_audits>;
  createMany(data: CreateGapAnalysisAuditData[]): Promise<{ count: number }>;
  update(
    id: number,
    data: UpdateGapAnalysisAuditData,
  ): Promise<gap_analysis_audits>;
  delete(id: number): Promise<gap_analysis_audits>;
}

export const GAP_ANALYSIS_AUDIT_REPOSITORY = Symbol(
  'GapAnalysisAuditRepository',
);
