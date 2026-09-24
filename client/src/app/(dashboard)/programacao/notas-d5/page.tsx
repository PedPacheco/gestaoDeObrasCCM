import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainSchduleForDay from "@/components/scheduleComponents/scheduleForDay/MainScheduleForDay";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import D5NotesSchedulesMain from "@/components/scheduleComponents/d5NotesSchedules/d5NotesSchedules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScheduleForDay() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("schedulesD5NotesFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
    page: "0",
  };

  const [filters, scheduleData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      status: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  if (!scheduleData.success) {
    return <ErrorThrower message={scheduleData.message} />;
  }

  const { data, token } = scheduleData;

  const columnMapping = {
    // Nota D5
    notaD5Id: "ID",
    nota_d5: "Nota D5",
    ovnota: "Ov/Nota",
    diagrama: "Ordem/Diagrama",
    regional: "Regional",
    municipio: "Município",
    turma: "Parceira",
    tipo_obra: "Tipo",
    local_instalacao: "Local de Instalação",
    criado_em: "Criado em",
    conclusao_nota: "Data de conclusão",
    status: "Status da Nota",
    status_sap: "Status SAP",
    responsavel: "Responsável",
    tme_abertura: "TME Abertura",
    tme_executado: "TME Executado",
    validacao_anual: "Validação Anual",
    mo_planejada: "MO Plan",

    // Programação
    data_prog: "Data da Programação",
    hora_ini: "Hora de Início",
    hora_ter: "Hora de Término",
    prog: "Prog",
    exec: "Exec",
    tipo_servico: "Tipo de Serviço",
    num_dp: "Nº DP",
    chi: "CHI",
    equipe_lm: "Equipa LM",
    equipe_lv: "Equipa LV",
    equipe_reg: "Equipa Reg",
    chave_provisoria: "Chave Provisória",
    tecnico: "Técnico",
    observacao_programacao: "Observação da Programação",
  };

  return (
    <EmotionCacheProvider>
      <D5NotesSchedulesMain
        data={data.d5Notes}
        token={token}
        cookie="d5NotesSchedulesFilters"
        columns={columnMapping}
        filtersData={filters}
        totals={data.totals}
      />
    </EmotionCacheProvider>
  );
}
