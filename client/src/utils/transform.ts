import dayjs from "dayjs";
import { formatDateToInput, formatToHHMM } from "./formatValue";
import { ExecutionReportData } from "@/components/details/executionReportDialog/executionReportDialog";

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
    executionReport: schedule.executionReport,
  };
}

export function transformExecutionReport(data: any): ExecutionReportData {
  const splitEquipamentos = (equip: string, pot: string, pat: string) => {
    if (!equip && !pot && !pat) return [];

    const equipamentos = equip?.split(";") || [];
    const potencias = pot?.split(";") || [];
    const patrimonios = pat?.split(";") || [];

    return equipamentos.map((equipment, i) => ({
      equipment: equipment || "",
      power: potencias[i] || "",
      patrimony: patrimonios[i] || "",
    }));
  };

  return {
    id: data.id,
    idUser: data.id_usuario,
    supervisor: data.supervisor,
    partialConnectionReleased: data.liberado_ligacao_parcial,
    startTime: dayjs(data.hora_inicio).utc().format("HH:mm"),
    finishTime: dayjs(data.hora_conclusao).utc().format("HH:mm"),
    startContact: data.contato_inicio,
    endContact: data.contato_termino,
    delayJustification: data.justificativa_atraso || "",
    hasEquipmentInstalled: data.possui_equipamentos_instalados,
    appliedEquipment: splitEquipamentos(
      data.equipamentos_aplicados,
      data.potencia_equipamento_aplicado,
      data.patrimonio_equipamento_aplicado
    ),
    hasEquipmentRemoved: data.possui_equipamentos_retirados,
    equipmentRemoved: splitEquipamentos(
      data.equipamentos_retirados,
      data.potencia_equipamento_retirado,
      data.patrimonio_equipamento_retirado
    ),
    changesExecution: data.alteracoes_execucao,
    generalObservation: data.observacoes_gerais || "",
    workSituation: data.situacao_obra,
    reason: data.motivo || "",
    provisionalKeyInstalled: data.chave_provisoria,
    provisionalKeyReference: data.referencia_chave_provisoria || "",
    provisionalKeyWithdrawn: data.chave_provisoria_retirada,
  };
}
