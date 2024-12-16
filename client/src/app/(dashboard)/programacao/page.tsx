import MainSchedule from "@/components/scheduleComponents/schedule/MainSchedule";
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { cookies } from "next/headers";

export default async function Schedule() {
  const cookieStore = await cookies();

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
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/programacao?ano=${new Date().getFullYear()}`,
      undefined,
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
      token={token}
      filters={filters}
    />
  );
}
