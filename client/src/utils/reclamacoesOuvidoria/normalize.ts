import { ResultadoBucket } from "@/types/reclamacoesOuvidoria";

// A planilha original tem variações de grafia/caixa nas colunas calculadas
// (ex.: "ENCi" / "enci" / "ENCI]") — normalizamos para rótulos estáveis
// antes de usar os valores em filtros e gráficos.
const RESULTADO_MAP: Record<string, { label: string; bucket: ResultadoBucket }> = {
  ENCI: { label: "Encerrada Improcedente", bucket: "improcedente" },
  ENCP: { label: "Encerrada Procedente", bucket: "procedente" },
  VPRO: { label: "Verificação Procedente", bucket: "procedente" },
  VIMP: { label: "Verificação Improcedente", bucket: "improcedente" },
  ANA: { label: "Em Análise", bucket: "analise" },
  ABER: { label: "Aberta", bucket: "analise" },
  EXEC: { label: "Execução", bucket: "outros" },
  ENPD: { label: "Encerrada c/ Dilatação de Prazo", bucket: "procedente" },
  ENID: { label: "Encerrada c/ Dilatação de Prazo", bucket: "procedente" },
  "REJE ANUL": { label: "Rejeitada/Anulada", bucket: "outros" },
};

export function normalizeResultado(sigla: string): { label: string; bucket: ResultadoBucket } {
  const key = sigla.trim().toUpperCase().replace(/[^A-Z ]/g, "");
  return RESULTADO_MAP[key] ?? { label: "Não Classificado", bucket: "outros" };
}

export function normalizeStatusPrazo(value: string): string {
  const key = value.trim().toLowerCase();
  if (key === "concluido" || key === "concluído") return "Concluído";
  if (key === "dentro do prazo") return "Dentro do Prazo";
  if (key === "fora do prazo" || key === "fora de prazo") return "Fora do Prazo";
  return "Não Informado";
}

export function normalizeSimNao(value: string): string {
  const key = value.trim().toLowerCase();
  if (key === "sim") return "Sim";
  return "Não";
}

export function normalizeOrText(value: string, fallback = "Não informado"): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[object Object]") return fallback;
  return trimmed;
}

// A coluna EMPREITEIRA da planilha traz tanto parceiras reais (ex.: "ENGELMIG
// - SJC", "START - ITQ/MOGI") quanto áreas internas da EDP (CIP, COI, Canais
// Presenciais...). Para os gráficos "por empreiteira" mostramos só as
// parceiras que também aparecem nos filtros/telas de parceira do restante do
// sistema (ver `partners` em DashboardClient.tsx e `PARTNERS` em
// AcompanhamentoPlanoDeAcaoDashboard.tsx).
export const EMPREITEIRAS_CONHECIDAS = [
  "BARAMAIA",
  "COMPEL",
  "COSAMPA",
  "ENGELMIG",
  "LIG",
  "MANSERV",
  "OCA",
  "START",
] as const;

export function canonicalEmpreiteira(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (!upper) return null;
  return EMPREITEIRAS_CONHECIDAS.find((partner) => upper.startsWith(partner)) ?? null;
}
