import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainScheduleRestrictions from "@/components/scheduleComponents/scheduleRestrictions/MainScheduleRestrictions";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";

dayjs.extend(isoWeek);

export const dynamic = "force-dynamic";

export default async function ScheduleRestrictions() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("scheduleRestrictionsFilters")?.value;

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
      parceira: true,
      regional: true,
      municipio: true,
      grupo: true,
      tipo: true,
      restricao: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/restricoes`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { token, data } = scheduleData;

  const columns = {
    ovnota: "Ovnota",
    mun: "Municipio",
    tipo: "Tipo",
    parceira: "Parceira",
    executado: "Total executado",
    data_prog: "Data programada",
    prog: "Programado",
    exec: "Executado",
    obersvacao_restricao: "Observação da restrição",
    restricao_prog1: "1° Restrição",
    responsabilidade1: "1° Responsabilidade",
    nome_responsavel: "1° Nome do responsável",
    area_responsavel1: "1° Área do responsável",
    status_restricao1: "1° Status da restrição",
    data_resolucao1: "1° Data de resolução",
    restricao_prog2: "2° Restrição",
    responsabilidade2: "2° Responsabilidade",
    nome_responsavel2: "2° Nome do responsável",
    area_responsavel2: "2° Área do responsável",
    status_restricao2: "2° Status da restrição",
    data_resolucao2: "2° Data de resolução",
  };

  return (
    <EmotionCacheProvider>
      <MainScheduleRestrictions
        data={data}
        filtersData={filters}
        columns={columns}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
