import MainPendingSchedule from "@/components/scheduleComponents/pendingSchedule/MainPendingSchedule";
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { cookies } from "next/headers";

export default async function PendingSchedule() {
  const cookieStore = await cookies();

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      parceira: true,
      regional: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
      undefined,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = scheduleData;

  const columns = {
    id: "ID",
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem",
    diagrama: "Diagrama",
    mun: "Municipio",
    entrada: "Entrada",
    tipo_obra: "Tipo",
    qtde_planejada: "Qtde planejada",
    mo_planejada: "MO planejada",
    turma: "Parceira",
    executado: "Total executado",
    data_prog: "Data programada",
    prog: "Programado",
    mo_prog: "MO programada",
    observ_programacao: "Observação",
  };

  return (
    <MainPendingSchedule
      data={data}
      filters={filters}
      token={token}
      columns={columns}
    />
  );
}
