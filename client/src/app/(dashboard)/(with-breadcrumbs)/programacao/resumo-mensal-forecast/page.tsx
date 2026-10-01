import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainMonthlyForecastSummarySchedule } from "@/components/scheduleComponents/monthlyForecastSummary/mainMonthlyForecastSummary";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";

import { MonthlySummaryTableColumn } from "../resumo-mensal/page";

export const dynamic = "force-dynamic";

export default async function MonthlyForecastSummary() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("monthlyForecastSummaryFilters")?.value;
  const token = cookieStore.get("token")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;

  let filtersValues = {
    ...Transform(params?.selectedItems || {}),
    dataInicial: params?.startDate
      ? dayjs(params?.startDate).format("DD/MM/YYYY")
      : dayjs().startOf("month").format("DD/MM/YYYY"),
    dataFinal: params?.endDate
      ? dayjs(params?.endDate).format("DD/MM/YYYY")
      : dayjs().endOf("month").format("DD/MM/YYYY"),
  };

  const [filters, summaryData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-forecast`,
      filtersValues,
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
        { key: "forecastTotal", label: "Total", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "serviceMoExec", label: "Serviço", format: "currency" },
        { key: "materialMoExec", label: "Material", format: "currency" },
        { key: "execTotal", label: "Total", format: "currency" },
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
      label: "Forecast (R$)",
      children: [
        { key: "totalServiceMoForecast", label: "Serviço", format: "currency" },
        {
          key: "totalMaterialMoForecast",
          label: "Material",
          format: "currency",
        },
        { key: "forecastTotal", label: "Total", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "totalServiceMoExec", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoExec", label: "Material", format: "currency" },
        { key: "execTotal", label: "Total", format: "currency" },
      ],
    },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  return (
    <EmotionCacheProvider>
      <MainMonthlyForecastSummarySchedule
        columnsFirstSummary={columnsFirstSummary}
        columnsSecondSummary={columnsSecondSummary}
        dataFirstSummary={summaryData.data.firstSummary}
        dataSecondSummary={summaryData.data.secondSummary}
        token={summaryData.token}
        filtersData={filters}
      />
    </EmotionCacheProvider>
  );
}
