import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainScheduleRestrictions from "@/components/restrictionsComponents/scheduleRestrictions/MainScheduleRestrictions";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { ErrorThrower } from "@/components/common/ErrorThrower";

dayjs.extend(isoWeek);

export const dynamic = "force-dynamic";

export default async function PublicationRestriction() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("publicationRestrictionFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      dataInicial: params?.startDate
        ? dayjs(params?.startDate).format("DD/MM/YYYY")
        : null,
      dataFinal: params?.endDate
        ? dayjs(params?.endDate).format("DD/MM/YYYY")
        : null,
      executado: params.executed,
    };
  } else {
    filtersValues = {
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
      tipoRestricao: ["PUBLICAÇÃO"],
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/restricao/publicacoes`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  if (!scheduleData.success) {
    return <ErrorThrower message={scheduleData.message} />;
  }

  const { token, data } = scheduleData;

  const columns = {
    id: "id",
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem/Diagrama",
    mun: "Municipio",
    regional: "Regional",
    tipo_obra: "Tipo da Obra",
    status: "Status",
    parceira: "Parceira",
    executado: "Total executado",
    data_conclusao: "Data de conclusão",
    restricao: "Restrição",
    responsabilidade: "Responsabilidade",
    nome_responsavel: "Nome do responsável",
    observacao: "Observação da publicação",
    observacao_construcao: "Observação da construção",
    status_restricao: "Status da restrição",
    criado_em: "Data de criação",
    data_resolucao: "Data de resolução",
    nome_usuario: "Criado por",
  };

  return (
    <EmotionCacheProvider>
      <MainScheduleRestrictions
        data={data}
        filtersData={filters}
        columns={columns}
        token={token}
        url="publicacoes"
      />
    </EmotionCacheProvider>
  );
}
