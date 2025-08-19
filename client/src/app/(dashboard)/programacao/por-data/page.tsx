import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainSchduleForDay from "@/components/scheduleComponents/scheduleForDay/MainScheduleForDay";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";

export const dynamic = "force-dynamic";

export default async function ScheduleForDay() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("scheduleForDayFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
    data:
      params?.filterType === "day"
        ? dayjs(params?.date).format("DD/MM/YYYY")
        : params?.filterType === "month"
        ? dayjs(params?.date).format("MM/YYYY")
        : "",
    tipoFiltro: params?.filterType || "",
    executado: params?.executed || "false",
  };

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      municipio: true,
      parceira: true,
      grupo: true,
      tipo: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { data, token } = scheduleData;

  const columns = {
    id: "ID",
    ovnota: "Nota/Ov",
    ordemdiagrama: "Ordem",
    mun: "Mun",
    conjunto: "Conjunto",
    circuito: "Circuito",
    entrada: "Entrada",
    prazo_fim: "Prazo",
    tipo_obra: "Tipo",
    qtde_planejada: "QTDE planejada",
    mo_planejada: "MO planejada",
    turma: "Parceira",
    executado: "Executado",
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
