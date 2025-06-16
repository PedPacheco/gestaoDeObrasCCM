import { formatDateToInput, formatToHHMM } from "./formatValue";

export function Transform(filters: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      Array.isArray(value) && value.length > 0 ? value.join(",") : "",
    ])
  );
}

export function mapScheduleToForm(schedule: any, options: Record<string, any>) {
  const technicianFound = options.tecnico.find(
    (t: any) => t.tecnico === schedule.tecnico
  );

  const restrictionFound = options.restricao.find(
    (r: any) => r.restricao === schedule.restricao
  );

  return {
    id: schedule.id,
    dataProg: formatDateToInput(schedule.data_prog) ?? "",
    startTime: formatToHHMM(schedule.hora_ini) ?? "",
    finishTime: formatToHHMM(schedule.hora_ter) ?? "",
    prog: schedule.prog ?? 0,
    exec: schedule.exec,
    serviceType: schedule.tipo_servico ?? "",
    equipment: schedule.observ_programacao ?? "",
    chi: schedule.chi ?? 0,
    numDp: schedule.num_dp ?? "",
    temporaryKey: schedule.chave_provisoria ?? false,
    lmTeam: schedule.equipe_linha_morta ?? 0,
    regulTeam: schedule.equipe_regularizacao ?? 0,
    lvTeam: schedule.equipe_linha_viva ?? 0,
    idTechnical: technicianFound.id ?? 0,
    idExecutionRestriction: restrictionFound.id ?? 0,
    responsibility: schedule.nome_responsaval_execucao ?? "",
  };
}
