import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainPendingSchedule from "@/components/scheduleComponents/pendingSchedule/MainPendingSchedule";
import { Transform } from "@/utils/transform";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function PendingSchedule() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const cookieParams = cookieStore.get("pendingScheduleFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      ano: params.selectedYear ? params.selectedYear.toString() : "",
    };
  }

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      parceira: true,
      regional: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
      filtersValues,
      token
    ),
  ]);

  const { data } = scheduleData;

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
    <EmotionCacheProvider>
      <MainPendingSchedule
        data={data}
        filtersData={filters}
        token={token}
        columns={columns}
      />
    </EmotionCacheProvider>
  );
}
