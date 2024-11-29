import { MainMonthlySummarySchedule } from "@/components/scheduleComponents/monthlySummary/mainMonthlySummarySchedule";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function MonthlySummary() {
  const cookieStore = cookies();

  async function fetchMonthlySummary(endpoint: string) {
    const url = `${
      process.env.NEXT_PUBLIC_API_URL
    }${endpoint}?date=${dayjs().format("MM/YYYY")}`;

    return await fetchData(url, undefined, cookieStore.get("token")?.value, {
      cache: "no-store",
    });
  }

  const [filters, firstSummary, secondSummary] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchMonthlySummary("/programacao/resumo-mensal"),
    fetchMonthlySummary("/programacao/resumo-mensal-2"),
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
      filters={filters}
      token={firstSummary.token}
    />
  );
}
