import dayjs from "dayjs";
import { formatDateToInput, formatToHHMM } from "./formatValue";
import { ExecutionReportData } from "@/components/details/modals/executionReportDialog/executionReportDialog";

export function Transform(filters: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      Array.isArray(value) && value.length > 0 ? value.join(",") : "",
    ]),
  );
}

export function mapScheduleToForm(schedule: any, options: Record<string, any>) {
  const technicianFound = options.tecnico.find(
    (t: any) => t.tecnico === schedule.tecnico,
  );

  const restrictionFound = options.restricao.find(
    (r: any) => r.restricao === schedule.restricao,
  );

  return {
    id: schedule.id,
    dataProg: formatDateToInput(schedule.data_prog) ?? "",
    startTime: formatToHHMM(schedule.hora_ini) ?? "",
    finishTime: formatToHHMM(schedule.hora_ter) ?? "",
    prog: schedule.prog ?? 0,
    exec: schedule.exec,
    serviceType: schedule.tipo_servico ?? "",
    observation: schedule.observacao_programacao ?? "",
    equipment: schedule.equip_desligado ?? "",
    chi: schedule.chi ?? 0,
    numDp: schedule.num_dp ?? "",
    temporaryKey: schedule.chave_provisoria ?? false,
    lmTeam: schedule.equipe_linha_morta ?? 0,
    regulTeam: schedule.equipe_regularizacao ?? 0,
    lvTeam: schedule.equipe_linha_viva ?? 0,
    idTechnical: technicianFound.id ?? 0,
    idExecutionRestriction: restrictionFound.id ?? 0,
    responsibility: schedule.nome_responsavel_execucao ?? "",
    executionReport: schedule.executionReport,
    idProgRestriction1: schedule.id_restricao_prog1,
    responsiblityProg: schedule.responsabilidade1,
    responsibleName: schedule.nome_responsavel,
    responsibleArea: schedule.area_responsavel1,
    restrictionStatus: schedule.status_restricao1,
    resolutionDate: schedule.data_resolucao1,
    idProgRestriction2: schedule.id_restricao_prog2,
    responsiblityProg2: schedule.responsabilidade2,
    responsibleName2: schedule.nome_responsavel2,
    responsibleArea2: schedule.area_responsavel2,
    restrictionStatus2: schedule.status_restricao2,
    resolutionDate2: schedule.data_resolucao2,
    validated: schedule.validada,
    confirmed: schedule.confirmada,
  };
}

export function transformExecutionReport(data: any): ExecutionReportData {
  const splitEquipamentos = (
    equip: string,
    pot: string,
    pat: string,
    inst: string,
  ) => {
    if (!equip && !pot && !pat && !inst) return [];

    const equipamentos = equip?.split(";") || [];
    const potencias = pot?.split(";") || [];
    const patrimonios = pat?.split(";") || [];
    const instalacoes = inst?.split(";") || [];

    return equipamentos.map((equipment, i) => ({
      equipment: equipment || "",
      power: potencias[i] || "",
      patrimony: patrimonios[i] || "",
      installation: instalacoes[i] || "",
      type: equipment.startsWith("CS") ? ("CS" as const) : ("DEFAULT" as const),
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
      data.patrimonio_equipamento_aplicado,
      data.instalacao_equipamento_aplicado,
    ),
    hasEquipmentRemoved: data.possui_equipamentos_retirados,
    equipmentRemoved: splitEquipamentos(
      data.equipamentos_retirados,
      data.potencia_equipamento_retirado,
      data.patrimonio_equipamento_retirado,
      data.instalacao_equipamento_retirado,
    ),
    changesExecution: data.alteracoes_execucao,
    generalObservation: data.observacoes_gerais || "",
    reason: data.motivo || "",
    provisionalKeyInstalled: data.chave_provisoria,
    provisionalKeyReference: data.referencia_chave_provisoria || "",
    provisionalKeyWithdrawn: data.chave_provisoria_retirada,
  };
}

export function buildPublicationRestrictionPayload(
  data: any,
  enginners: any[],
  idUser: number,
) {
  const responsibleEnginner = enginners.find(
    (enginner) => enginner.idRegional === data.id_regional,
  );

  const restrictionArray = [
    {
      id: data.id_obra || data.id_restricao_publicacao,
      idRestriction: data.id_restricao,
      responsibility: data.responsabilidade,
      responsibleName: responsibleEnginner?.name,
      restrictionStatus: data.status_restricao,
      resolutionDate: data.resolutionDate
        ? dayjs(data.resolutionDate).format("DD/MM/YYYY")
        : null,
      observation: data.observacao,
      constructionObservation: data.observacao_construcao,
      idUser,
    },
  ];

  return restrictionArray;
}
