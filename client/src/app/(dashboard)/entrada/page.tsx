import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainEntry from "@/components/entryComponents/entry/MainEntry";
import { Transform } from "@/utils/transform";

export default async function Entry() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("entryFilters")?.value;

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

  const [filters, entryData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/entrada`,
      filtersValues,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = entryData;

  const columnMapping = {
    tipo_obra: "Tipo",
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
    <MainEntry
      data={data.data}
      filtersData={filters}
      token={token}
      columns={columnMapping}
    />
  );
}
