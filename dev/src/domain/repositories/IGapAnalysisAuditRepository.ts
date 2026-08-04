import { gap_analysis } from '@prisma/client';

export interface GapAnalysisAuditData {
  id_parceira: number;
  num_auditoria?: number;
  data_inicio?: Date;
  data_fim?: Date;
  gap_anterior?: number;
  gap_atual?: number;
  apresentacao_interna?: Date;
  reuniao_apresentacao?: Date;
  notificacao_gestao?: Date;
  retorno_parceira?: Date;
  validacao_plano_edp?: Date;
  plano_validado?: boolean;
  devolutiva_novo_plano?: Date;
  validacao_novo_plano?: Date;
  lancamento_desvios_sgs?: Date;
  inicio_acompanhamento?: Date;
  quantidade_desvios_planejados?: number;
  quantidade_desvios_executados?: number;
  executados_fora_prazo?: number;
  itens_pendentes_fora_do_prazo?: number;
  observacao?: string;
  status?: string;
}

export interface IGapAnalysisAuditRepository {
  findAll(): Promise<any[]>;
  create(data: GapAnalysisAuditData): Promise<any>;
  createMany(data: GapAnalysisAuditData[]): Promise<{ count: number }>;
  update(id: number, data: GapAnalysisAuditData): Promise<gap_analysis>;
  delete(id: number): Promise<any>;
}

export const GAP_ANALYSIS_AUDIT_REPOSITORY = Symbol(
  'GapAnalysisAuditRepository',
);
