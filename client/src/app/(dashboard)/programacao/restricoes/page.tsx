import MainScheduleRestrictions from "@/components/scheduleComponents/scheduleRestrictions/MainScheduleRestrictions";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function ScheduleRestrictions() {
  const filters = await fetchFilters({
    parceira: true,
    regional: true,
    municipio: true,
    grupo: true,
    tipo: true,
  });

  const cookieStore = cookies();

  const startOfWeek = dayjs()
    .startOf("week")
    .add(1, "day")
    .format("DD/MM/YYYY");

  const endOfWeek = dayjs().endOf("week").format("DD/MM/YYYY");

  const { token, data } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/programacao/restricoes?dataInicial=${startOfWeek}&dataFinal=${endOfWeek}&executado=false`,
    undefined,
    cookieStore.get("token")?.value
  );

  const columns = {
    ovnota: "Ovnota",
    mun: "Municipio",
    tipo: "Tipo",
    parceira: "Parceira",
    executado: "Total executado",
    data_prog: "Data programada",
    prog: "Programado",
    exec: "Executado programação",
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
    <MainScheduleRestrictions
      data={data}
      filters={filters}
      token={token}
      columns={columns}
    />
  );
}
