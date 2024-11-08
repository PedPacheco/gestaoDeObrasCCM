import MainEntry from "@/components/entryComponents/entry/MainEntry";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function Entry() {
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
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/entrada?ano=${new Date().getFullYear()}`,
    undefined,
    cookieStore.get("token")?.value
  );

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
      data={data}
      filters={filters}
      token={token}
      columns={columnMapping}
    />
  );
}
