import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainMonthlyForecastSummarySchedule } from "@/components/scheduleComponents/monthlyForecastSummary/mainMonthlyForecastSummary";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { MonthlySummaryTableColumn } from "../../programacao/resumo-mensal/page";
import { MonthlyForecastSummaryTable } from "@/components/scheduleComponents/monthlyForecastSummary/monthlyForecastSummaryTable";

export const dynamic = "force-dynamic";

export default async function ForecastReportPage() {
  const cookieStore = await cookies();
  // const cookieParams = cookieStore.get("ForecastReportPageFilters")?.value;
  const token = cookieStore.get("token")?.value;

  // const params = cookieParams ? JSON.parse(cookieParams) : undefined;

  // let filtersValues = {
  //   ...Transform(params?.selectedItems || {}),
  //   dataInicial: params?.startDate
  //     ? dayjs(params?.startDate).format("DD/MM/YYYY")
  //     : dayjs().startOf("month").format("DD/MM/YYYY"),
  //   dataFinal: params?.endDate
  //     ? dayjs(params?.endDate).format("DD/MM/YYYY")
  //     : dayjs().endOf("month").format("DD/MM/YYYY"),
  // };

  const [summaryData] = await Promise.all([
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/forecast-snapshot`,
      { idForecast: 2 },
      token,
      { cache: "no-store" },
    ),
  ]);

  const columnsFirstSummary: MonthlySummaryTableColumn[] = [
    { key: "dataProg", label: "Data", format: "date" },
    { key: "dia_semana", label: "Dia da Semana", format: "weekday" },
    { key: "qtdeWorks", label: "Qtd. Obras", format: "number" },
    { key: "teams", label: "Qtd. Equipes", format: "number" },
    {
      label: "Meta (Meta 100%)",
      children: [
        { key: "financialGoal", label: "Valor", format: "currency" },
        { key: "diaryGoal", label: "% Dia", format: "percent" },
      ],
    },
    {
      label: "Planejado (R$)",
      children: [
        { key: "serviceMoPlan", label: "Serviço", format: "currency" },
        { key: "materialMoPlan", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Programado (R$)",
      children: [
        { key: "serviceMoProg", label: "Serviço", format: "currency" },
        { key: "materialMoProg", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Pendente SAP (R$)",
      children: [
        { key: "serviceMoPend", label: "Serviço", format: "currency" },
        { key: "materialMoPend", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Forecast (R$)",
      children: [
        { key: "serviceMoForecast", label: "Serviço", format: "currency" },
        { key: "materialMoForecast", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "serviceMoExec", label: "Serviço", format: "currency" },
        { key: "materialMoExec", label: "Material", format: "currency" },
      ],
    },

    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  const columnsSecondSummary: MonthlySummaryTableColumn[] = [
    { key: "grupo", label: "Grupo" },
    { key: "turma", label: "Parceira" },
    { key: "qtdeWorks", label: "Qtd. Obras", format: "number" },
    {
      label: "Planejado (R$)",
      children: [
        { key: "totalServiceMoPlan", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoPlan", label: "Material", format: "currency" },
      ],
    },

    {
      label: "Programado (R$)",
      children: [
        { key: "totalServiceMoProg", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoProg", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Pendente SAP (R$)",
      children: [
        { key: "totalServiceMoPend", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoPend", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "totalServiceMoExec", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoExec", label: "Material", format: "currency" },
      ],
    },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  return (
    <EmotionCacheProvider>
      <div className="w-full flex flex-col xl:flex-row px-4 overflow-y-auto">
        <MonthlyForecastSummaryTable
          columns={columnsFirstSummary}
          data={summaryData.data.diario.summary}
          totals={summaryData.data.diario.totals}
          isFirstSummary={true}
        />
        <MonthlyForecastSummaryTable
          columns={columnsSecondSummary}
          data={summaryData.data.grupo.summary}
          totals={summaryData.data.grupo.totals}
          isFirstSummary={false}
        />
      </div>
    </EmotionCacheProvider>
  );
}
