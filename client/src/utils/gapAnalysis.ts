import { PARTNER_LOGOS } from "@/constants/gapAnalysis/gapAnalysis";
import { AuditData, AuditStatus } from "@/types/auditoria/auditoriaTypes";

export function calcComputed(item: AuditData): {
  evolucao: string;
  itensPendentesNoPrazo: string;
} {
  const total = parseInt(item.quantidadeDesviosPlanejados) || 0;
  const execNP = parseInt(item.quantidadeDesviosExecutados) || 0;
  const execFP = parseInt(item.executadosForaPrazo || "0") || 0;
  const pendFP = parseInt(item.itensPendentesForaDoPrazo || "0") || 0;
  const evolucao =
    total > 0 ? Math.round(((execNP + execFP) / total) * 100).toString() : "";
  const pendNP = Math.max(0, total - execNP - execFP - pendFP).toString();
  return { evolucao, itensPendentesNoPrazo: pendNP };
}

export function getPartnerLogo(parceira: string): string | null {
  const key = Object.keys(PARTNER_LOGOS).find((k) =>
    parceira.toUpperCase().includes(k),
  );
  return key ? PARTNER_LOGOS[key] : null;
}

export function statusColorDark(status: AuditStatus | ""): string {
  if (status === "Concluído") return "text-emerald-400";
  if (status === "Em andamento") return "text-amber-400";
  if (status === "Pendente") return "text-red-400";
  return "text-white/20";
}
