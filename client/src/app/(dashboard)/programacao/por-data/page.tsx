import MainSchduleForDay from "@/components/scheduleForDay/MainScheduleForDay";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function ScheduleForDay() {
  const filters = await fetchFilters({
    regional: true,
    municipio: true,
    parceira: true,
    grupo: true,
    tipo: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `http://localhost:3333/programacao/mensal?data=${dayjs().format(
      "MM/YYYY"
    )}&tipoFiltro=month&executado=false`,
    undefined,
    cookieStore.get("token")?.value,
    { cache: "no-store" }
  );

  const columns = {
    id: "ID",
    ovnota: "Nota/Ov",
    ordemdiagrama: "Ordem",
    mun: "Mun",
    entrada: "Entrada",
    prazo_fim: "Prazo",
    tipo_obra: "Tipo",
    qtde_planejada: "QTDE planejada",
    mo_planejada: "MO planejada",
    turma: "Parceira",
    executado: "Executado",
    data_prog: "Data programada",
    prog: "% Programado",
    exec: "% Executado",
    num_dp: "Número DP",
    hora_ini: "Horário Início",
    hora_ter: "Horário Término",
    equipe_linha_viva: "Equipe LV",
    equipe_linha_morta: "Equipe LM",
    equipe_regularizacao: "Equipe Regularização",
    id_técnico: "Técnico Responsável",
    observ_programacao: "Observação da programação",
  };

  return (
    <MainSchduleForDay
      columns={columns}
      data={data}
      filters={filters}
      token={token}
    />
  );
}
