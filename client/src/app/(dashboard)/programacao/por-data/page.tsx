import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainSchduleForDay from "@/components/scheduleComponents/scheduleForDay/MainScheduleForDay";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { ErrorThrower } from "@/components/common/ErrorThrower";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScheduleForDay() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("scheduleForDayFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
    dataInicial: params?.startDate
      ? dayjs(params?.startDate).format("DD/MM/YYYY")
      : null,
    dataFinal: params?.endDate
      ? dayjs(params?.endDate).format("DD/MM/YYYY")
      : null,
    executado: params?.executed || "false",
    pendente: params?.pending || "false",
    ovnota: params?.ovnota || "",
    page: "0",
  };

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      municipio: true,
      parceira: true,
      grupo: true,
      tipo: true,
      status: true,
      statusProgramacao: true,
      statusSap: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  if (!scheduleData.success) {
    return <ErrorThrower message={scheduleData.message} />;
  }

  const { data, token } = scheduleData;

  const columns = {
    id: "ID",
    ovnota: "Nota/Ov",
    ordemdiagrama: "Ordem",
    restricao_aberta: "Restrição !!",
    mun: "Mun",
    regional: "Regional",
    conjunto: "Conjunto",
    circuito: "Circuito",
    prazo_fim: "Prazo",
    status_prazo: "Status prazo",
    status_ov_sap: "Status SAP",
    tipo_obra: "Tipo",
    qtde_planejada: "Quantidade planejada",
    qtde_pend: "Quantidade pendente",
    mo_prog: "MO planejada",
    mat_prog: "Material planejado",
    turma: "Parceira",
    executado: "Executado",
    status: "Status da Obra",
    status_programacao: "Status da programação",
    data_prog: "Data programada",
    prog: "% Programado",
    exec: "% Executado",
    num_dp: "Número DP",
    hora_ini: "Horário Início",
    hora_ter: "Horário Término",
    equipe_linha_viva: "Equipe LV",
    equipe_linha_morta: "Equipe LM",
    equipe_regularizacao: "Equipe Reg",
    tecnico: "Técnico Responsável",
    total_obras: "Total de obras",
    total_mo_planejada: "Total MO planejada",
    total_mo_exec: "Total MO Executado",
    total_qtde_planejada: "Total QTDE planejada",
  };

  return (
    <EmotionCacheProvider>
      <MainSchduleForDay
        columns={columns}
        data={data}
        filtersData={filters}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
