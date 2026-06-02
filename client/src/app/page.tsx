import { cookies } from "next/headers";
import Image from "next/image";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { Header } from "@/components/layout/Header";
import { getCurrentMonthRange, getCurrentWeekData } from "@/utils/weeks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL!;
const NO_CACHE = { cache: "no-store" as const };

// ── Áreas com permissão de acesso ao dashboard ──────────────
const ALLOWED_AREAS = [1, 8, 9];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Função para extrair dados do utilizador dos cookies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface UserInfo {
  id: number;
  username: string;
  nome_usuario: string;
  email: string;
  tipo_usuario: string; // "INTERNO" | "EXTERNO"
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number | null;
  id_turma: number | null;
  id_area: number | null;
}

function getUserFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): UserInfo | null {
  const raw = cookieStore.get("userInfo")?.value;
  if (!raw) return null;

  try {
    // O cookie pode estar URL-encoded (ex: %7B...%7D)
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded) as UserInfo;
  } catch {
    return null;
  }
}

function checkDashboardAccess(user: UserInfo | null): boolean {
  // Sem utilizador → sem acesso
  if (!user) return false;

  // EXTERNO → tem acesso
  if (user.tipo_usuario !== "INTERNO") return true;

  // INTERNO → só se estiver nas áreas permitidas
  return ALLOWED_AREAS.includes(user.id_area ?? -1);
}

// ── Todos os fetches (mantidos como estão) ──────────────────

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

async function fetchMetasRecomposicao(token: string) {
  const year = new Date().getFullYear();
  const res = await fetchData(
    `${API}/metas`,
    { btzero: false, rda: false, ano: year, anoPlan: year },
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

async function fetchExecMonitoring(token: string) {
  const year = new Date().getFullYear();
  const res = await fetchData(
    `${API}/programacao/acompanhamento-mensal`,
    { dataInicial: `01/01/${year}`, dataFinal: `31/12/${year}` },
    token,
    NO_CACHE,
  );
  return res.success ? (res.data ?? []) : [];
}

async function fetchForecast(token: string) {
  const { dataInicial, dataFinal } = getCurrentMonthRange();
  const empty = { summary: [], totals: {} };
  const res = await fetchData(
    `${API}/programacao/resumo-mensal-forecast`,
    { dataInicial, dataFinal },
    token,
    NO_CACHE,
  );
  if (!res.success) return { first: empty, second: empty };
  return {
    first: res.data?.firstSummary ?? empty,
    second: res.data?.secondSummary ?? empty,
  };
}

async function fetchMaodeObra(token: string, dashboard: "labor" | "partner") {
  const { dataInicial, dataFinal } = getCurrentMonthRange();
  const { inicio, fim } = getCurrentWeekData();

  const params =
    dashboard === "labor"
      ? { dataInicial, dataFinal }
      : { dataInicial: inicio, dataFinal: fim };

  const fallback = {
    data: { summary: [], totals: {} },
    data2: [],
    metaDiaria: 0,
  };
  const res = await fetchData(
    `${API}/programacao/resumo-mensal`,
    params,
    token,
    NO_CACHE,
  );

  if (!res.success) return fallback;

  const firstSummary = res.data?.firstSummary ?? {};
  const secondSummary = res.data?.secondSummary ?? [];
  const metaDiaria: number = firstSummary.summary?.[0]?.financialGoal ?? 0;

  return { data: firstSummary, data2: secondSummary, metaDiaria };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  // ✅ Ler dados do utilizador diretamente do cookie "userInfo"
  const user = getUserFromCookies(cookieStore);
  const hasDashboardAccess = checkDashboardAccess(user);

  // ✅ Se NÃO tem permissão → tela com logo (ZERO fetches)
  if (!hasDashboardAccess) {
    return (
      <div className="relative z-0 flex min-h-screen">
        <div className="flex flex-1 flex-col h-screen overflow-y-auto">
          <Header />
          <main className="flex-1 bg-[url(/fundo.png)] bg-cover bg-center bg-no-repeat">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
              <Image
                src="/logo-sigo.png"
                alt="Logo SIGO"
                className="
                  w-[60%] sm:w-[50%] md:w-[40%] lg:w-[30%] xl:w-[25%]
                  h-auto mr-12 mb-8 object-contain
                "
                width={740}
                height={500}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Se TEM permissão → buscar dados normalmente
  const [
    maodeObra,
    forecast,
    metasRecomposicao,
    goalsFilters,
    execMonitoring,
    eliminacaoRestricao,
    aderenciaParceira,
    sparklinesParceira,
    semanasParceira,
    motivosReprogramacao,
    maodeObraAvanca,
    filtersData,
  ] = await Promise.all([
    fetchMaodeObra(token, "labor"),
    fetchForecast(token),
    fetchMetasRecomposicao(token),
    fetchGoalsFilters(token),
    fetchExecMonitoring(token),
    fetchEliminacaoRestricao(token),
    fetchAderenciaParceira(token),
    fetchSparklinesParceira(token),
    fetchSemanasParceira(token),
    fetchMotivosReprogramacao(token),
    fetchMaodeObra(token, "partner"),
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
    }),
  ]);

  return (
    <div className="relative z-0 flex min-h-screen">
      <div className="flex flex-1 flex-col h-screen overflow-y-auto transition-all duration-300 ease-in-out">
        <Header />
        <main className="flex-1">
          <DashboardClient
            token={token}
            initialMaodeObra={maodeObra.data}
            initialMaodeObra2={maodeObra.data2}
            initialMetaDiaria={maodeObra.metaDiaria}
            initialForecastFirst={forecast.first}
            initialForecastSecond={forecast.second}
            initialMetasRecomposicao={metasRecomposicao}
            goalsFilters={goalsFilters}
            initialExecMonitoring={execMonitoring}
            initialEliminacaoRestricao={eliminacaoRestricao}
            initialAderenciaParceira={aderenciaParceira}
            initialPartnerWeeks={semanasParceira}
            initialReasonsReascheduling={motivosReprogramacao}
            initialSparklinesPartners={sparklinesParceira}
            initialLaborMoveForwardPartner={maodeObraAvanca.data}
            initialDailyGoalMoveForwardPartner={maodeObraAvanca.metaDiaria}
            filtersData={filtersData}
          />
        </main>
      </div>
    </div>
  );
}
