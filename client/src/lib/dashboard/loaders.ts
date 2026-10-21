import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { getCurrentMonthRange } from "@/utils/weeks";

const API = process.env.NEXT_PUBLIC_API_URL!;
const NO_CACHE = { cache: "no-store" as const };

async function request<T>(
  path: string,
  params?: Record<string, string | boolean | null | number | string[]>,
  token?: string,
): Promise<T> {
  const res = await fetchData(`${API}${path}`, params, token, NO_CACHE);
  if (!res.success) throw new Error(`Falha ao carregar ${path}`);
  return res.data as T;
}

// ── Metas Recomposição ──────────────────────────────────────
export async function loadMetasRecomposicao(token: string) {
  const year = new Date().getFullYear();
  const data = await request<any[]>(
    "/metas",
    { btzero: false, rda: false, ano: year, anoPlan: year },
    token,
  );
  return data ?? [];
}

// ── Filtros partilhados (Metas + Acompanhamento) ────────────
export async function loadGoalsFilters(token: string) {
  const data = await request<any>(
    "/filters",
    { regional: true, parceira: true, tipo: true, tecnico: true },
    token,
  );
  return data ?? { regional: [], parceira: [], tipo: [], tecnico: [] };
}

// ── Acompanhamento da Execução ──────────────────────────────
export async function loadExecMonitoring(token: string) {
  const year = new Date().getFullYear();
  const data = await request<any[]>(
    "/programacao/acompanhamento-mensal",
    { dataInicial: `01/01/${year}`, dataFinal: `31/12/${year}` },
    token,
  );
  return data ?? [];
}

// ── Mão de Obra ─────────────────────────────────────────────
export async function loadMaodeObra(token: string) {
  const { dataInicial, dataFinal } = getCurrentMonthRange();
  const data = await request<any>(
    "/programacao/resumo-mensal",
    { dataInicial, dataFinal },
    token,
  );

  const firstSummary = data?.firstSummary ?? { summary: [], totals: {} };
  return {
    data: firstSummary,
    data2: data?.secondSummary ?? [],
    metaDiaria: (firstSummary?.summary?.[0]?.financialGoal as number) ?? 0,
  };
}

export async function loadLaborFilters() {
  return fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
    municipio: true,
    grupo: true,
  });
}
