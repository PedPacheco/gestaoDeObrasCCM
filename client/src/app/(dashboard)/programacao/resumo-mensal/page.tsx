import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainMonthlySummarySchedule } from "@/components/scheduleComponents/monthlySummary/mainMonthlySummarySchedule";
import { Transform } from "@/utils/transform";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

type Column =
  | {
      key: string;
      label: string;
    }
  | {
      label: string;
      children: {
        key: string;
        label: string;
      }[];
    };

export interface BaseColumn {
  key: string;
  label: string;
}

export interface GroupColumn {
  label: string;
  children: BaseColumn[];
}

export type TableColumn = BaseColumn | GroupColumn;

export default async function MonthlySummary() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("monthlySummaryScheduleFilters")?.value;
  const token = cookieStore.get("token")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      date: dayjs(params.date).format("MM/YYYY"),
    };
  } else {
    filtersValues = {
      date: dayjs().format("MM/YYYY"),
    };
  }

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

  const columnsFirstSummary: TableColumn[] = [
    { key: "dataProg", label: "Data" },
    { key: "dia_semana", label: "Dia da Semana" },
    { key: "totalQtde", label: "Qtd. Obras" },
    { key: "teamsTotal", label: "Qtd. Equipes" },

    {
      label: "Meta (Meta 100%)",
      children: [
        { key: "financialGoal", label: "Valor" },
        { key: "diaryGoal", label: "% Dia" },
      ],
    },

    {
      label: "Meta (Meta 108% AP)",
      children: [
        { key: "financialGoalWith8", label: "Valor" },
        { key: "diaryGoalWith8", label: "% Dia" },
      ],
    },

    { key: "totalMoProg", label: "Programado" },
    { key: "totalMoExec", label: "Executado" },
    { key: "diff", label: "Programado x Executado (%)" },
  ];

  const columnsSecondSummary: TableColumn[] = [
    { key: "grupo", label: "Grupo" },
    { key: "turma", label: "Parceira" },
    { key: "qtdeObras", label: "Qtd. Obras" },
    { key: "totalMoProg", label: "Programado" },
    { key: "totalMoExec", label: "Executado" },
    { key: "totalMoPrev", label: "Previsto" },
    { key: "diff", label: "Programado x Executado (%)" },
  ];

  return (
    <EmotionCacheProvider>
      <MainMonthlySummarySchedule
        columnsFirstSummary={columnsFirstSummary}
        columnsSecondSummary={columnsSecondSummary}
        dataFirstSummary={summaryData.data.firstSummary}
        dataSecondSummary={summaryData.data.secondSummary}
        filtersData={filters}
        token={summaryData.data.token}
      />
    </EmotionCacheProvider>
  );
}
