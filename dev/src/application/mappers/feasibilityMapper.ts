import type {
  FeasibilityExportService,
  FeasibilityExportWork,
  FeasibilityRejection,
  FeasibilityReport,
} from 'src/domain/types';
import { resolveOrdemDiagrama } from 'src/utils/resolveOrdemDiagrama';
import type {
  FeasibilityApprovalExportOutput,
  FeasibilityPendingExportOutput,
  FeasibilityRejectionOutput,
  FeasibilityReportOutput,
} from '../types/usecases/feasibility.types';

export const toFeasibilityReportOutput = (
  r: FeasibilityReport,
): FeasibilityReportOutput => ({
  id: r.id,
  id_obra: r.workId,
  id_usuario: r.userId,
  caminhos_arquivos: r.technicalFiles,
  arquivos_complementares: r.complementaryFiles,
  data_envio: r.sentAt,
  prazo_viabilidade: r.timeframeStatus,
  aprovada: r.approved,
  data_aprovacao: r.approvedAt,
  id_usuario_aprovador: r.approverId,
});

export const toFeasibilityRejectionOutput = (
  r: FeasibilityRejection,
): FeasibilityRejectionOutput => ({
  descricao: r.description,
  motivo: r.reason,
  usuario: r.userName,
  criado_em: r.createdAt,
});

// ─── Exportação ────────────────────────────────────────────────────

/** ⚠ Adaptador: a função recebe hoje a row em snake_case. Confirme as chaves que lê. */
const orderOrDiagram = (w: FeasibilityExportWork): string | null =>
  resolveOrdemDiagrama({
    diagrama: w.diagram,
    ordem_dci: w.dciOrder,
    ordem_dca: w.dcaOrder,
    ordem_dcd: w.dcdOrder,
    ordem_dcim: w.dcimOrder,
  });

/** Igual ao cálculo atual: qtde_adicional não vem no select, por isso contava sempre 0. */
const pricing = (s: FeasibilityExportService) => {
  const unitPrice = s.contractItem?.price ?? s.material?.price ?? 0;
  const totalQuantity = s.plannedQuantity ?? 0;
  return { unitPrice, totalPrice: unitPrice * totalQuantity };
};

const materialOf = (s: FeasibilityExportService) => ({
  material: s.contractItem?.material ?? s.material?.code ?? null,
  textoBreve: s.contractItem?.shortText ?? s.material?.description ?? null,
  tipo: (s.material?.code ? 'M' : 'S') as 'M' | 'S',
});

export const toFeasibilityPendingExport = (
  w: FeasibilityExportWork,
  s: FeasibilityExportService,
): FeasibilityPendingExportOutput => {
  const { unitPrice, totalPrice } = pricing(s);
  const { material, textoBreve, tipo } = materialOf(s);
  return {
    ovnota: w.ovnota,
    ordemDiagrama: orderOrDiagram(w),
    operacao: s.operation,
    ponto: s.point,
    numeroOperacao: s.operationNumber,
    descricaoOperacao: s.operationDescription,
    material,
    textoBreve,
    qtdePlanejada: s.plannedQuantity,
    tipo,
    valorUnit: unitPrice,
    valorTotal: totalPrice,
  };
};

export const toFeasibilityApprovalExport = (
  w: FeasibilityExportWork,
  s: FeasibilityExportService,
): FeasibilityApprovalExportOutput => {
  const { unitPrice, totalPrice } = pricing(s);
  const { material, textoBreve, tipo } = materialOf(s);
  return {
    ovnota: w.ovnota,
    ordemDiagrama: orderOrDiagram(w),
    data_envio: w.sentAt,
    operacao: s.operation,
    ponto: s.point,
    numeroOperacao: s.operationNumber,
    descricaoOperacao: s.operationDescription,
    material,
    textoBreve,
    qtdePlanejada: s.plannedQuantity,
    viabilizado: s.feasibleQuantity,
    tipo,
    valorUnit: unitPrice,
    valorTotal: totalPrice,
    diferença: (s.plannedQuantity ?? 0) - (s.feasibleQuantity ?? 0),
    alterado: s.feasibleQuantity !== s.plannedQuantity ? 'Sim' : 'Não',
  };
};
