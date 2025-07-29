import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainMonthlySummarySchedule } from "@/components/scheduleComponents/monthlySummary/mainMonthlySummarySchedule";
import { Transform } from "@/utils/transform";

export const dynamic = "force-dynamic";

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

  const [filters, firstSummary, secondSummary] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal`,
      filtersValues,
      token
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/resumo-mensal-2`,
      filtersValues,
      token
    ),
  ]);

  const columnsFirstSummary = {
    dataProg: "Data",
    totalQtde: "Quantidade",
    totalMoProg: "Programado",
    totalMoExec: "Executado",
    porcentagem: "%",
    totalMoPrev: "Previsto",
  };

  const columnsSecondSummary = {
    grupo: "Grupo",
    turma: "Parceira",
    totalMoProg: "Programado",
    totalMoExec: "Executado",
    totalMoPrev: "Previsto",
  };

  return (
    <MainMonthlySummarySchedule
      columnsFirstSummary={columnsFirstSummary}
      columnsSecondSummary={columnsSecondSummary}
      dataFirstSummary={firstSummary?.data}
      dataSecondSummary={secondSummary?.data}
      filtersData={filters}
      token={firstSummary.token}
    />
  );
}
