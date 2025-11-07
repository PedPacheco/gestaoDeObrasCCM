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

  const [filters, undefinedItemsData, scheduleErrorData] = await Promise.all([
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
      count: 5,
    },
    {
      id: "diferenca",
      label: "Diferença Executado",
      icon: "DocumentIcon",
      count: 5,
    },
    {
      id: "conclusao",
      label: "Data Conclusão Divergente",
      icon: "CalendarDateRangeIcon",
      count: 5,
    },
  ];

  return (
    <EmotionCacheProvider>
      <ErrorDashboard
        undefinedItemsData={data}
        scheduleErrorData={scheduleErrorData.data}
        regionalValues={filters.regional}
        tabs={tabs}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
