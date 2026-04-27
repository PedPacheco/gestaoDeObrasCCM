import { cookies } from "next/headers";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const emptyData = {
  kpis: {
    total: 0,
    concludedThisMonth: 0,
    totalConcluded: 0,
    withoutSchedule: 0,
    executionRate: 0,
  },
  byStatus: [],
  byRegional: [],
  trend: [],
  topPartners: [],
  recentWorks: [],
};

async function fetchDashboard(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return emptyData;
    return res.json();
  } catch {
    return emptyData;
  }
}

async function fetchMetasRecomposicao(token: string) {
  const year = new Date().getFullYear();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/metas?btzero=false&rda=false&ano=${year}&anoPlan=${year}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchGoalsFilters(token: string) {
  const empty = { regional: [], parceira: [], tipo: [], tecnico: [] };
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/filters?regional=true&parceira=true&tipo=true&tecnico=true`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return empty;
    return await res.json();
  } catch {
    return empty;
  }
}

async function fetchForecast(token: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const dataInicial = `01/${mm}/${year}`;
  const dataFinal = `${lastDay}/${mm}/${year}`;

  const empty = { summary: [], totals: {} };
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-forecast?dataInicial=${dataInicial}&dataFinal=${dataFinal}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return { first: empty, second: empty };
    const json = await res.json();
    return {
      first: json.data?.firstSummary ?? empty,
      second: json.data?.secondSummary ?? empty,
    };
  } catch {
    return { first: empty, second: empty };
  }
}

async function fetchExecMonitoring(token: string) {
  const year = new Date().getFullYear();
  const lastDay = new Date(year, 11, 31).getDate();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/acompanhamento-mensal?dataInicial=01/01/${year}&dataFinal=${lastDay}/12/${year}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchMaodeObra(token: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const dataInicial = `01/${mm}/${year}`;
  const dataFinal = `${lastDay}/${mm}/${year}`;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal?dataInicial=${dataInicial}&dataFinal=${dataFinal}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return { data: [], data2: [], metaDiaria: 0 };
    const json = await res.json();

    const firstSummary = json.data?.firstSummary ?? {};
    const secondSummary = json.data?.secondSummary ?? {};
    const summaryData: any[] = firstSummary.summary ?? [];
    const metaDiaria: number = summaryData[0]?.financialGoal ?? 0;

    return {
      data: summaryData,
      data2: secondSummary.summary ?? [],
      metaDiaria,
    };
  } catch {
    return { data: [], data2: [], metaDiaria: 0 };
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";
  const [
    data,
    maodeObra,
    forecast,
    metasRecomposicao,
    goalsFilters,
    execMonitoring,
  ] = await Promise.all([
    fetchDashboard(token),
    fetchMaodeObra(token),
    fetchForecast(token),
    fetchMetasRecomposicao(token),
    fetchGoalsFilters(token),
    fetchExecMonitoring(token),
  ]);

  return (
    <div
      className="relative z-0 flex min-h-screen "
      // style={{
      //   backgroundImage: "url('/fundo.png')",
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      //   backgroundRepeat: "no-repeat",
      //   backgroundAttachment: "fixed",
      // }}
    >
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <Header />

        {/* Dashboard header strip */}
        {/* <div className="bg-[#212E3E] border-b border-[#354a60] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-sigo.png"
              alt="Logo SIGO"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <div className="h-6 w-px bg-[#404d5e]" />
            <div>
              <p className="text-white font-semibold text-sm">
                Dashboard Geral
              </p>
              <p className="text-zinc-500 text-xs">
                Visão consolidada das obras
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <Image
              src="/edpLogo.png"
              alt="EDP"
              width={60}
              height={24}
              className="h-6 w-auto object-contain opacity-80"
            />
          </div>
        </div> */}

        {/* Main dashboard content */}
        <main className="flex-1 overflow-y-auto">
          <DashboardClient
            kpis={data.kpis}
            byStatus={data.byStatus}
            byRegional={data.byRegional}
            trend={data.trend}
            topPartners={data.topPartners}
            partnerDetails={data.partnerDetails ?? {}}
            recentWorks={data.recentWorks}
            token={token}
            initialMaodeObra={maodeObra.data}
            initialMaodeObra2={maodeObra.data2}
            initialMetaDiaria={maodeObra.metaDiaria}
            initialForecastFirst={forecast.first}
            initialForecastSecond={forecast.second}
            initialMetasRecomposicao={metasRecomposicao}
            goalsFilters={goalsFilters}
            initialExecMonitoring={execMonitoring}
          />
        </main>
      </div>
    </div>
  );
}
