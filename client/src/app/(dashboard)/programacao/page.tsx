import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainSchedule from "@/components/scheduleComponents/schedule/MainSchedule";
import { Transform } from "@/utils/transform";

export default async function Schedule() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("scheduleFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      ano: dayjs(params.selectedYear).format("YYYY"),
    };
  } else {
    filtersValues = {
      ano: dayjs().format("YYYY"),
    };
  }

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
      filtersValues,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = scheduleData;

  const columns = {
    turma: "Parceira",
    planExec: "P/E",
    jan: "Jan",
    fev: "Fev",
    mar: "Mar",
    abr: "Abr",
    mai: "Mai",
    jun: "Jun",
    jul: "Jul",
    ago: "Ago",
    set: "Set",
    out: "Out",
    nov: "Nov",
    dez: "Dez",
    total: "Total",
  };

  return (
    <MainSchedule
      data={data}
      columns={columns}
      filtersData={filters}
      token={token}
    />
  );
}
