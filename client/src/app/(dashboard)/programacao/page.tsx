import MainSchedule from "@/components/schedule/MainSchedule";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function Schedule() {
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
    `http://localhost:3333/programacao?ano=${new Date().getFullYear()}`,
    undefined,
    cookieStore.get("token")?.value
  );

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
      token={token}
      filters={filters}
    />
  );
}
