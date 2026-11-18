import type {
  FeasibilityExportService,
  FeasibilityExportWork,
  FeasibilityFiles,
  FeasibilityRejection,
  FeasibilityReport,
} from 'src/domain/types';
import { toNumberOrNull } from 'src/utils/toNumberToNull';
import {
  FeasibilityExportRow,
  FeasibilityExportServiceRow,
  FeasibilityFilesRow,
  FeasibilityRejectionRow,
  FeasibilityReportRow,
} from '../types/repositories/feasibility.types';

// ─── Relatório (findByWorkIdentifier) ──────────────────────────────
export const toFeasibilityReport = (
  r: FeasibilityReportRow,
): FeasibilityReport => ({
  id: r.id,
  workId: r.id_obra,
  userId: r.id_usuario,
  technicalFiles: r.caminhos_arquivos,
  complementaryFiles: r.arquivos_complementares,
  sentAt: r.data_envio,
  timeframeStatus: r.prazo_viabilidade,
  approved: r.aprovada,
  approvedAt: r.data_aprovacao,
  approverId: r.id_usuario_aprovador,
});

// ─── Ficheiros (findFiles) ─────────────────────────────────────────
export const toFeasibilityFiles = (
  r: FeasibilityFilesRow,
): FeasibilityFiles => ({
  id: r.id,
  technicalFiles: r.caminhos_arquivos,
  complementaryFiles: r.arquivos_complementares,
});

// ─── Reprovações (getRejections) ───────────────────────────────────
export const toFeasibilityRejection = (
  r: FeasibilityRejectionRow,
): FeasibilityRejection => ({
  description: r.descricao,
  reason: r.motivo,
  createdAt: r.criado_em,
  userName: r.novo_tabela_usuarios?.nome ?? null,
});

// ─── Exportação (exportFeasibility) ────────────────────────────────
const toFeasibilityExportService = (
  s: FeasibilityExportServiceRow,
): FeasibilityExportService => ({
  operation: s.operacao,
  point: s.ponto,
  plannedQuantity: toNumberOrNull(s.qtde_plan),
  feasibleQuantity: toNumberOrNull(s.viabilizado),
  operationDescription: s.descricao_operacao,
  operationNumber: s.numero_operacao,
  material: s.materiais && {
    code: s.materiais.codigo,
    description: s.materiais.descricao,
    price: toNumberOrNull(s.materiais.preco),
  },
  contractItem: s.servicos_contratos && {
    material: s.servicos_contratos.material,
    shortText: s.servicos_contratos.texto_breve,
    price: toNumberOrNull(s.servicos_contratos.preco),
  },
});

export const toFeasibilityExportWork = (
  r: FeasibilityExportRow,
): FeasibilityExportWork => ({
  ovnota: r.ovnota,
  diagram: r.diagrama,
  dciOrder: r.ordem_dci,
  dcaOrder: r.ordem_dca,
  dcdOrder: r.ordem_dcd,
  dcimOrder: r.ordem_dcim,
  sentAt: r.relatorio_viabilidade?.data_envio ?? null,
  services: r.servicos.map(toFeasibilityExportService),
});
