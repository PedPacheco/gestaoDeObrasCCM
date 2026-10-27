import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import AdvancePartnerDashboard from "@/components/advancePartner/advancePartnerDashboard";
import { getCurrentWeekData } from "@/utils/weeks";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL!;
const TIMEOUT_MS = 15_000;

// Cada pedido tem o seu próprio signal (um AbortSignal não pode ser reutilizado)
const requestOptions = () => ({
  cache: "no-store" as const,
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

const EMPTY_FILTERS = {
  regional: [],
  parceira: [],
  tipo: [],
  municipio: [],
  grupo: [],
  ovnota: [],
};

/** Nunca lança erro: em caso de falha ou timeout, devolve o fallback e regista o erro no log. */
async function safeGet<T>(
  path: string,
  params: Record<string, string | boolean | null | number | string[]>,
  token: string,
  fallback: T,
): Promise<T> {
  try {
    const res = await fetchData(
      `${API}${path}`,
      params,
      token,
      requestOptions(),
    );

    if (!res.success) {
      console.error(`[AvancaParceira] ${path} falhou:`, res.message);
      return fallback;
    }

    return (res.data ?? fallback) as T;
  } catch (error) {
    console.error(`[AvancaParceira] ${path} erro/timeout:`, error);
    return fallback;
  }
}

export default async function AdvancePartnerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  // Calculado uma vez, em vez de cinco
  const { inicio, fim } = getCurrentWeekData();
  const period = { dataInicial: inicio, dataFinal: fim };

  const [eliminacao, aderencia, sparklines, semanas, motivos, resumo, filters] =
    await Promise.all([
      safeGet<any[]>("/avanca-parceira", period, token, []),
      safeGet<any[]>("/avanca-parceira/aderencia-parceira", period, token, []),
      safeGet<any[]>("/avanca-parceira/sparklines-parceira", period, token, []),
      safeGet<any[]>("/avanca-parceira/semanas-parceira", {}, token, []),
      safeGet<any[]>(
        "/avanca-parceira/motivos-reprogramacao",
        period,
        token,
        [],
      ),
      safeGet<any>("/programacao/resumo-mensal", period, token, null),
      fetchFilters({
        regional: true,
        parceira: true,
        tipo: true,
        municipio: true,
        grupo: true,
        ovnota: true,
      }).catch((error: any) => {
        console.error("[AvancaParceira] filtros falharam:", error);
        return EMPTY_FILTERS;
      }),
    ]);

  const summary = resumo?.firstSummary ?? { summary: [], totals: {} };
  const dailyGoal: number = summary?.totals?.totalFinancialGoal ?? 0;

  // As Reclamações deixaram de ser pedidas aqui
  return (
    <div className="flex flex-col min-h-full">
      <AdvancePartnerDashboard
        initialEliminacao={eliminacao}
        initialAderencia={aderencia}
        initialSparklinesPartners={sparklines}
        initialPartnerWeeks={semanas}
        initialReasonsReascheduling={motivos}
        initialSummary={summary}
        initialDailyGoal={dailyGoal}
        filtersData={filters}
        token={token}
      />
    </div>
  );
}
