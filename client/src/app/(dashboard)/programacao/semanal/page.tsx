import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainWeeklySchedule from "@/components/scheduleComponents/weeklySchedule/MainWeeklySchedule";

dayjs.extend(isoWeek);

export default async function WeeklySchedule() {
  const cookieStore = await cookies();

  const startOfWeek = dayjs().startOf("isoWeek").format("DD/MM/YYYY");
  const endOfWeek = dayjs().endOf("isoWeek").format("DD/MM/YYYY");

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      municipio: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/semanal?dataInicial=${startOfWeek}&dataFinal=${endOfWeek}&executado=false`,
      undefined,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = scheduleData;

  return (
    <MainWeeklySchedule
      data={data}
      filters={filters}
      token={token}
      columns={{ column: "strrte" }}
    />
  );
}
