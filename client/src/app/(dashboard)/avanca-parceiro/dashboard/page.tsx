import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import AdvancePartnerDashboard from "@/components/dashboard/AvancaParceiro/DashAvancaParceiro/advancePartner";
import { getCurrentMonthRange, getCurrentWeekData } from "@/utils/weeks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL!;
const NO_CACHE = { cache: "no-store" as const };

async function fetchSparklinesParceira(token: string) {
  const { inicio, fim } = getCurrentWeekData();
  const res = await fetchData(
    `${API}/avanca-parceira/sparklines-parceira`,
    { dataInicial: inicio, dataFinal: fim },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchMotivosReprogramacao(token: string) {
  const { inicio, fim } = getCurrentWeekData();
  const res = await fetchData(
    `${API}/avanca-parceira/motivos-reprogramacao`,
    { dataInicial: inicio, dataFinal: fim },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchSemanasParceira(token: string) {
  const res = await fetchData(
    `${API}/avanca-parceira/semanas-parceira`,
    {},
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchEliminacaoRestricao(token: string) {
  const { inicio, fim } = getCurrentWeekData();
  const res = await fetchData(
    `${API}/avanca-parceira`,
    { dataInicial: inicio, dataFinal: fim },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchAderenciaParceira(token: string) {
  const { inicio, fim } = getCurrentWeekData();
  const res = await fetchData(
    `${API}/avanca-parceira/aderencia-parceira`,
    { dataInicial: inicio, dataFinal: fim },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchGoalsFilters(token: string) {
  const empty = { regional: [], parceira: [], tipo: [], tecnico: [] };
  const res = await fetchData(
    `${API}/filters`,
    { regional: true, parceira: true, tipo: true, tecnico: true },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? empty) : empty;
}

async function fetchMaodeObraAvanca(token: string) {
  const { inicio, fim } = getCurrentWeekData();
  const fallback = { data: { summary: [], totals: {} }, metaDiaria: 0 };
  const res = await fetchData(
    `${API}/programacao/resumo-mensal`,
    { dataInicial: inicio, dataFinal: fim },
    token,
    NO_CACHE,
  );

  if (!res.success) return fallback;

  const firstSummary = res.data?.firstSummary ?? {};
  const metaDiaria: number = firstSummary.totals?.totalFinancialGoal ?? 0;

  return { data: firstSummary, metaDiaria };
}

export default async function AdvancePartnerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  const [
    eliminacaoRestricao,
    aderenciaParceira,
    sparklinesParceira,
    semanasParceira,
    motivosReprogramacao,
    maodeObraAvanca,
    goalsFilters,
  ] = await Promise.all([
    fetchEliminacaoRestricao(token),
    fetchAderenciaParceira(token),
    fetchSparklinesParceira(token),
    fetchSemanasParceira(token),
    fetchMotivosReprogramacao(token),
    fetchMaodeObraAvanca(token),
    fetchGoalsFilters(token),
  ]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <AdvancePartnerDashboard
        initialEliminacao={eliminacaoRestricao}
        initialAderencia={aderenciaParceira}
        initialSparklinesPartners={sparklinesParceira}
        initialPartnerWeeks={semanasParceira}
        initialSummary={maodeObraAvanca.data}
        initialReasonsReascheduling={motivosReprogramacao}
        initialDailyGoal={maodeObraAvanca.metaDiaria}
        filtersData={goalsFilters}
        filtersTop={0}
        token={token}
      />
    </div>
  );
}
