import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainWeeklySchedule from "@/components/scheduleComponents/weeklySchedule/MainWeeklySchedule";
import { Transform } from "@/utils/transform";

dayjs.extend(isoWeek);

export default async function WeeklySchedule() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("weeklyScheduleFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      dataInicial: params.weekRange.start,
      dataFinal: params.weekRange.end,
      executado: params.executed,
    };
  } else {
    filtersValues = {
      dataInicial: dayjs().startOf("isoWeek").format("DD/MM/YYYY"),
      dataFinal: dayjs().endOf("isoWeek").format("DD/MM/YYYY"),
      executado: "false",
    };
  }

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      municipio: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/semanal`,
      filtersValues,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = scheduleData;

  return (
    <MainWeeklySchedule
      data={data}
      filtersData={filters}
      columns={{ column: "strrte" }}
    />
  );
}
