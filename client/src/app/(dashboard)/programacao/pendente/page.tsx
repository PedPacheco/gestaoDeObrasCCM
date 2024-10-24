import MainPendingSchedule from "@/components/scheduleComponents/pendingSchedule/MainPendingSchedule";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function PendingSchedule() {
  const filters = await fetchFilters({
    parceira: true,
    regional: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    "http://localhost:3333/programacao/pendente",
    undefined,
    cookieStore.get("token")?.value
  );

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
