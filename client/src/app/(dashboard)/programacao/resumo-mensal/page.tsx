import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainMonthlySummarySchedule } from "@/components/scheduleComponents/monthlySummary/mainMonthlySummarySchedule";
import { Transform } from "@/utils/transform";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

type ColumnFormat = "currency" | "number" | "date" | "percent" | "weekday";

interface BaseColumn {
  key: string;
  label: string;
  format?: ColumnFormat;
}

interface GroupColumn {
  label: string;
  children: BaseColumn[];
}

export type MonthlySummaryTableColumn = BaseColumn | GroupColumn;

export default async function MonthlySummary() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("monthlySummaryScheduleFilters")?.value;
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
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
      filtersValues,
      token,
      { cache: "no-store" },
    ),
  ]);

  const columnsFirstSummary: MonthlySummaryTableColumn[] = [
    { key: "dataProg", label: "Data", format: "date" },
    { key: "dia_semana", label: "Dia da Semana", format: "weekday" },
    { key: "totalQtde", label: "Qtd. Obras", format: "number" },
    { key: "teamsTotal", label: "Qtd. Equipes", format: "number" },
    {
      label: "Meta (Meta 100%)",
      children: [
        { key: "financialGoal", label: "Valor", format: "currency" },
        { key: "diaryGoal", label: "% Dia", format: "percent" },
      ],
    },
    {
      label: "Meta (Meta 108% AP)",
      children: [
        { key: "financialGoalWith8", label: "Valor", format: "currency" },
        { key: "diaryGoalWith8", label: "% Dia", format: "percent" },
      ],
    },
    { key: "totalMoProg", label: "Programado", format: "currency" },
    { key: "totalMoExec", label: "Executado", format: "currency" },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  const columnsSecondSummary: MonthlySummaryTableColumn[] = [
    { key: "grupo", label: "Grupo" },
    { key: "turma", label: "Parceira" },
    { key: "qtdeWorks", label: "Qtd. Obras", format: "number" },
    { key: "totalMoPlan", label: "Planejado", format: "currency" },
    { key: "totalMoProg", label: "Programado", format: "currency" },
    { key: "totalMoExec", label: "Executado", format: "currency" },
    { key: "totalMoPrev", label: "Previsto", format: "currency" },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  return (
    <EmotionCacheProvider>
      <MainMonthlySummarySchedule
        columnsFirstSummary={columnsFirstSummary}
        columnsSecondSummary={columnsSecondSummary}
        dataFirstSummary={summaryData.data.firstSummary}
        dataSecondSummary={summaryData.data.secondSummary}
        filtersData={filters}
        token={summaryData.token}
      />
    </EmotionCacheProvider>
  );
}
