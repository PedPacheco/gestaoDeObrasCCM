import { cookies } from "next/headers";

import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorDashboard } from "@/components/reportErrors/errorDashboard";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type TabItem = {
  id: string;
  label: string;
  icon:
    | "ExclamationCircleIcon"
    | "ArrowTrendingUpIcon"
    | "ExclamationTriangleIcon"
    | "DocumentIcon"
    | "CalendarDateRangeIcon";
  count: number;
};

// ✅ Componente que carrega dados assincronamente
async function ErrorDashboardWrapper() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("errorsReportFilter")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  // ✅ Carrega APENAS os filtros no servidor (rápido)
  const filters = await fetchFilters({
    regional: true,
  });

  // ✅ Passa apenas o necessário para o cliente carregar dados sob demanda
  return (
    <ErrorDashboard
      regionalValues={filters.regional}
      token={token || ""}
      initialParams={params}
    />
  );
}

export default async function ErrorsReportPage() {
  return (
    <EmotionCacheProvider>
      <ErrorDashboardWrapper />
    </EmotionCacheProvider>
  );
}
