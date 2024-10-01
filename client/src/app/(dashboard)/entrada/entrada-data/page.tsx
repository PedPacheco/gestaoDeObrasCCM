import MainEntryByDate from "@/components/entryByDate/MainEntryByDate";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function EntryForDate() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
    municipio: true,
    grupo: true,
    circuito: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `http://localhost:3333/entrada/data?data=${dayjs().format(
      "DD/MM/YYYY"
    )}&tipoFiltro=day`,
    undefined,
    cookieStore.get("token")?.value
  );

  return <MainEntryByDate data={data} token={token} filters={filters} />;
}
