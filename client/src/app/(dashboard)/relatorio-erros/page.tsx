import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorDashboard } from "@/components/reportErrors/errorDashboard";
import { EmotionCacheProvider } from "@/theme/emotionCache";

import { cookies } from "next/headers";

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

export default async function ErrorsReportPage() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("errorsReportFilter")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const [
    filters,
    undefinedItemsData,
    scheduleErrorData,
    zeroCapexData,
    executionDifferentialData,
    divergentConclusionData,
    worksWithoutYearPlanData,
    repeatedWorksData,
  ] = await Promise.all([
    fetchFilters({
      regional: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/itens-nao-definidos`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/programacao`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/valor-zero`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/diferenca-executado`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/conclusao-divergente`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/ano-plano`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/obras-repetidas`,
      { ...params?.idRegional },
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { token, data } = undefinedItemsData;

  const tabs: TabItem[] = [
    {
      id: "itens-nao-definido",
      label: "Itens Não Definidos",
      icon: "ExclamationCircleIcon",
      count: data.length,
    },
    {
      id: "programacao",
      label: "Programação <100%",
      icon: "ArrowTrendingUpIcon",
      count: scheduleErrorData.data.length,
    },
    {
      id: "valor-zero",
      label: "Valor Orçado Zero",
      icon: "ExclamationTriangleIcon",
      count: zeroCapexData.data.length,
    },
    {
      id: "diferenca-executado",
      label: "Diferença Executado",
      icon: "DocumentIcon",
      count: executionDifferentialData.data.length,
    },
    {
      id: "conclusao-divergente",
      label: "Data Conclusão Divergente",
      icon: "CalendarDateRangeIcon",
      count: divergentConclusionData.data.length,
    },
    {
      id: "ano-plan",
      label: "Obras sem Ano Plano",
      icon: "ExclamationTriangleIcon",
      count: worksWithoutYearPlanData.data.length,
    },
    {
      id: "obras-repetidas",
      label: "Obras Repetidas",
      icon: "ExclamationTriangleIcon",
      count: repeatedWorksData.data.length,
    },
  ];

  return (
    <EmotionCacheProvider>
      <ErrorDashboard
        undefinedItemsData={data}
        scheduleErrorData={scheduleErrorData.data}
        zeroCapexData={zeroCapexData.data}
        executionDifferentialData={executionDifferentialData.data}
        divergentConclusionData={divergentConclusionData.data}
        worksWithoutYearPlanData={worksWithoutYearPlanData.data}
        repeatedWorksData={repeatedWorksData.data}
        regionalValues={filters.regional}
        tabs={tabs}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
