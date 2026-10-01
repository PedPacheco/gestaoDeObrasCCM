import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";

import { getCurrentWeekData } from "@/utils/weeks";
import AdvancePartnerDashboard from "@/components/advancePartner/advancePartnerDashboard";
import { fetchFilters } from "@/actions/fetchFilters.action";

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
    filters,
  ] = await Promise.all([
    fetchEliminacaoRestricao(token),
    fetchAderenciaParceira(token),
    fetchSparklinesParceira(token),
    fetchSemanasParceira(token),
    fetchMotivosReprogramacao(token),
    fetchMaodeObraAvanca(token),
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
    }),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <AdvancePartnerDashboard
        initialAderencia={aderenciaParceira}
        initialDailyGoal={maodeObraAvanca.metaDiaria}
        initialEliminacao={eliminacaoRestricao}
        initialPartnerWeeks={semanasParceira}
        initialReasonsReascheduling={motivosReprogramacao}
        initialSparklinesPartners={sparklinesParceira}
        initialSummary={maodeObraAvanca.data}
        filtersData={filters}
        token={token}
      />
    </div>
  );
}
