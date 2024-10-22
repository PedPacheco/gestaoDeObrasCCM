import MainWeeklySchedule from "@/components/scheduleComponents/weeklySchedule/MainWeeklySchedule";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function WeeklySchedule() {
  const filters = await fetchFilters({
    regional: true,
    municipio: true,
    parceira: true,
    grupo: true,
    tipo: true,
  });

  const cookieStore = cookies();

  const startOfWeek = dayjs()
    .startOf("week")
    .add(1, "day")
    .format("DD/MM/YYYY");

  const endOfWeek = dayjs().endOf("week").format("DD/MM/YYYY");

  const { token, data } = await fetchData(
    `http://localhost:3333/programacao/semanal?dataInicial=${startOfWeek}&dataFinal=${endOfWeek}&executado=false`,
    undefined,
    cookieStore.get("token")?.value
  );

  return <MainWeeklySchedule data={data} filters={filters} token={token} />;
}
