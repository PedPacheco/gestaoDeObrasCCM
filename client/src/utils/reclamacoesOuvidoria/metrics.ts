import { ReclamacaoRow } from "@/types/reclamacoesOuvidoria";

import { canonicalEmpreiteira, EMPREITEIRAS_CONHECIDAS } from "./normalize";

const PENDENTE_STATUSES = ["pendente atendimento", "pendente área", "pendente area", "pendente obra"];
const CONCLUIDO_STATUSES = ["encerrado", "medida transferida"];
const MESES_JANELA = 8;

export function isPendente(status: string): boolean {
  return PENDENTE_STATUSES.includes(status.trim().toLowerCase());
}

export function isConcluido(status: string): boolean {
  return CONCLUIDO_STATUSES.includes(status.trim().toLowerCase());
}

// A coluna "Status Report" da planilha original só marca "Fora do Prazo"
// para reclamações AINDA pendentes hoje — qualquer coisa já encerrada vira
// "Concluido", mesmo que tenha sido concluída depois do vencimento. Isso faz
// o histórico inteiro parecer "sem atraso". Aqui recalculamos comparando a
// data de vencimento com a data real de conclusão (ou hoje, se ainda aberta),
// o que dá uma linha "Fora do Prazo" que realmente varia mês a mês.
function isForaDoPrazo(row: ReclamacaoRow, todayIso: string): boolean {
  if (!row.dataVencimento) return false;
  const referencia = row.dataConclusao ?? todayIso;
  return referencia > row.dataVencimento;
}

function countBy(rows: ReclamacaoRow[], pick: (row: ReclamacaoRow) => string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = pick(row).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export interface MonthAcumulado {
  key: string;
  label: string;
  Entradas: number;
  Encerradas: number;
  Passivos: number;
  ForaPrazo: number;
}

export interface EmpreiteiraTrend {
  empreiteira: string;
  data: { key: string; label: string; Entradas: number; ForaPrazo: number }[];
}

export interface CenarioAtualItem {
  empreiteira: string;
  dentroPrazo: number;
  foraPrazo: number;
}

export interface MotivoItem {
  motivo: string;
  count: number;
}

export interface MotivosPorEmpreiteira {
  empreiteira: string;
  itens: MotivoItem[];
}

// Reconstrói a série mensal completa (para o cálculo de passivos acumulados)
// e depois recorta a janela de exibição — assim o backlog não "zera"
// artificialmente no primeiro mês visível.
function buildAcumuladoPorMes(rows: ReclamacaoRow[], todayIso: string): MonthAcumulado[] {
  const entradasPorMes = new Map<string, number>();
  const encerradasPorMes = new Map<string, number>();
  const foraPrazoPorMes = new Map<string, number>();
  const allKeys = new Set<string>();

  rows.forEach((row) => {
    if (row.dataAbertura) {
      const key = row.dataAbertura.slice(0, 7);
      allKeys.add(key);
      entradasPorMes.set(key, (entradasPorMes.get(key) ?? 0) + 1);
      if (isForaDoPrazo(row, todayIso)) {
        foraPrazoPorMes.set(key, (foraPrazoPorMes.get(key) ?? 0) + 1);
      }
    }
    if (row.dataConclusao) {
      const key = row.dataConclusao.slice(0, 7);
      allKeys.add(key);
      encerradasPorMes.set(key, (encerradasPorMes.get(key) ?? 0) + 1);
    }
  });

  // A planilha tem algumas linhas com "Data de Abertura" lançada no futuro
  // (erro de digitação/placeholder) — sem esse corte, esses meses aparecem
  // como se já tivessem acontecido e distorcem o "mês atual" do resumo.
  const todayKey = todayIso.slice(0, 7);
  const sortedKeys = [...allKeys].filter((key) => key <= todayKey).sort();

  let cumEntradas = 0;
  let cumEncerradas = 0;
  const full: MonthAcumulado[] = sortedKeys.map((key) => {
    cumEntradas += entradasPorMes.get(key) ?? 0;
    cumEncerradas += encerradasPorMes.get(key) ?? 0;
    return {
      key,
      label: monthLabel(key),
      Entradas: entradasPorMes.get(key) ?? 0,
      Encerradas: encerradasPorMes.get(key) ?? 0,
      Passivos: Math.max(cumEntradas - cumEncerradas, 0),
      ForaPrazo: foraPrazoPorMes.get(key) ?? 0,
    };
  });

  return full.slice(-MESES_JANELA);
}

function buildEmpreiteiraTrends(
  rows: ReclamacaoRow[],
  meses: { key: string; label: string }[],
  todayIso: string,
): EmpreiteiraTrend[] {
  return EMPREITEIRAS_CONHECIDAS.map((empreiteira) => {
    const entradasMap = new Map<string, number>();
    const foraPrazoMap = new Map<string, number>();
    let totalEntradas = 0;

    rows.forEach((row) => {
      if (canonicalEmpreiteira(row.empreiteira) !== empreiteira || !row.dataAbertura) return;
      const key = row.dataAbertura.slice(0, 7);
      entradasMap.set(key, (entradasMap.get(key) ?? 0) + 1);
      totalEntradas += 1;
      if (isForaDoPrazo(row, todayIso)) {
        foraPrazoMap.set(key, (foraPrazoMap.get(key) ?? 0) + 1);
      }
    });

    return {
      empreiteira,
      totalEntradas,
      data: meses.map((m) => ({
        key: m.key,
        label: m.label,
        Entradas: entradasMap.get(m.key) ?? 0,
        ForaPrazo: foraPrazoMap.get(m.key) ?? 0,
      })),
    };
  })
    .filter((trend) => trend.totalEntradas > 0)
    .map(({ totalEntradas, ...trend }) => trend);
}

function buildCenarioAtual(rows: ReclamacaoRow[], todayIso: string): CenarioAtualItem[] {
  const pendentesRows = rows.filter((r) => isPendente(r.status));
  const map = new Map<string, CenarioAtualItem>();

  pendentesRows.forEach((row) => {
    const empreiteira = canonicalEmpreiteira(row.empreiteira);
    if (!empreiteira) return;
    const entry = map.get(empreiteira) ?? { empreiteira, dentroPrazo: 0, foraPrazo: 0 };
    if (isForaDoPrazo(row, todayIso)) entry.foraPrazo += 1;
    else entry.dentroPrazo += 1;
    map.set(empreiteira, entry);
  });

  return [...map.values()].sort((a, b) => b.dentroPrazo + b.foraPrazo - (a.dentroPrazo + a.foraPrazo));
}

function buildMotivosPendentes(rows: ReclamacaoRow[]): MotivosPorEmpreiteira[] {
  const pendentesRows = rows.filter((r) => isPendente(r.status));
  const byEmpreiteira = new Map<string, Map<string, number>>();

  pendentesRows.forEach((row) => {
    const empreiteira = canonicalEmpreiteira(row.empreiteira);
    if (!empreiteira) return;
    const motivo = (row.causaRaiz || row.observacao || row.tipoReclamacao || "Não especificado").trim();
    const inner = byEmpreiteira.get(empreiteira) ?? new Map<string, number>();
    inner.set(motivo, (inner.get(motivo) ?? 0) + 1);
    byEmpreiteira.set(empreiteira, inner);
  });

  return [...byEmpreiteira.entries()]
    .map(([empreiteira, inner]) => ({
      empreiteira,
      itens: [...inner.entries()]
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => {
      const totalA = a.itens.reduce((acc, i) => acc + i.count, 0);
      const totalB = b.itens.reduce((acc, i) => acc + i.count, 0);
      return totalB - totalA;
    });
}

export interface ReclamacoesMetrics {
  total: number;
  empreiteirasCount: number;
  regionaisCount: number;
  pendentes: number;
  pendentesDentroPrazo: number;
  pendentesForaPrazo: number;
  concluidas: number;
  taxaConclusao: number;
  foraDoPrazo: number;
  dentroDoPrazo: number;
  pctDentroDoPrazo: number;
  procedentes: number;
  improcedentes: number;
  pctProcedencia: number;
  valorMultasTotal: number;
  qtdComMulta: number;
  transgressoes: number;
  statusCounts: { name: string; value: number }[];
  regionalCounts: { name: string; value: number }[];
  empreiteiraCounts: { name: string; value: number }[];
  tipoCounts: { name: string; value: number }[];
  resultadoCounts: { name: string; value: number }[];
  prazoCounts: { name: string; value: number }[];
  acumuladoPorMes: MonthAcumulado[];
  empreiteiraTrends: EmpreiteiraTrend[];
  cenarioAtual: CenarioAtualItem[];
  motivosPendentes: MotivosPorEmpreiteira[];
}

export function buildReclamacoesMetrics(rows: ReclamacaoRow[]): ReclamacoesMetrics {
  const total = rows.length;
  const todayIso = new Date().toISOString().slice(0, 10);

  const empreiteiras = new Set(rows.map((r) => r.empreiteira).filter(Boolean));
  const regionais = new Set(rows.map((r) => r.regional).filter(Boolean));

  const pendentesRows = rows.filter((r) => isPendente(r.status));
  const pendentes = pendentesRows.length;
  const pendentesForaPrazo = pendentesRows.filter((r) => isForaDoPrazo(r, todayIso)).length;
  const pendentesDentroPrazo = pendentes - pendentesForaPrazo;
  const concluidas = rows.filter((r) => isConcluido(r.status)).length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 1000) / 10 : 0;

  const foraDoPrazo = rows.filter((r) => isForaDoPrazo(r, todayIso)).length;
  const dentroDoPrazo = total - foraDoPrazo;
  const pctDentroDoPrazo = total > 0 ? Math.round((dentroDoPrazo / total) * 1000) / 10 : 0;

  const procedentes = rows.filter((r) => r.resultadoBucket === "procedente").length;
  const improcedentes = rows.filter((r) => r.resultadoBucket === "improcedente").length;
  const avaliadas = procedentes + improcedentes;
  const pctProcedencia = avaliadas > 0 ? Math.round((procedentes / avaliadas) * 1000) / 10 : 0;

  const comMulta = rows.filter((r) => (r.valorMulta ?? 0) > 0);
  const valorMultasTotal = comMulta.reduce((acc, r) => acc + (r.valorMulta ?? 0), 0);

  const transgressoes = rows.filter((r) => r.transgressao === "Sim").length;

  const statusCounts = countBy(rows, (r) => r.status);
  const regionalCounts = countBy(rows, (r) => r.regional);
  const empreiteiraCounts = countBy(rows, (r) => r.empreiteira).slice(0, 10);
  const tipoCounts = countBy(rows, (r) => r.tipoReclamacao).slice(0, 10);
  const resultadoCounts = countBy(rows, (r) => r.resultadoLabel);
  const prazoCounts = countBy(rows, (r) => r.statusPrazo);

  const acumuladoPorMes = buildAcumuladoPorMes(rows, todayIso);
  const empreiteiraTrends = buildEmpreiteiraTrends(
    rows,
    acumuladoPorMes.map((m) => ({ key: m.key, label: m.label })),
    todayIso,
  );
  const cenarioAtual = buildCenarioAtual(rows, todayIso);
  const motivosPendentes = buildMotivosPendentes(rows);

  return {
    total,
    empreiteirasCount: empreiteiras.size,
    regionaisCount: regionais.size,
    pendentes,
    pendentesDentroPrazo,
    pendentesForaPrazo,
    concluidas,
    taxaConclusao,
    foraDoPrazo,
    dentroDoPrazo,
    pctDentroDoPrazo,
    procedentes,
    improcedentes,
    pctProcedencia,
    valorMultasTotal,
    qtdComMulta: comMulta.length,
    transgressoes,
    statusCounts,
    regionalCounts,
    empreiteiraCounts,
    tipoCounts,
    resultadoCounts,
    prazoCounts,
    acumuladoPorMes,
    empreiteiraTrends,
    cenarioAtual,
    motivosPendentes,
  };
}
