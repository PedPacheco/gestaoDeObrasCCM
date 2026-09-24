"use client";

import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { mapD5ScheduleToForm } from "@/utils/transform";

export interface D5FormData {
  scheduledDate: string;
  prog: string | number;
  exec: string | number;
  startTime: string;
  endTime: string;
  numDp: string;
  serviceType: string;
  chi: string | number;
  lmTeam: string | number;
  lvTeam: string | number;
  regulTeam: string | number;
  temporaryKey: boolean;
  technicalId: string | number;
  restrictionId: string | number;
  restrictionResponsible: string;
  observation: string;
  executionObservation: string;
}

export interface D5ScheduleData {
  id: number;
  id_nota_d5: number;
  data_prog: string;
  prog: number;
  exec: number | null;
  hora_ini: string;
  hora_ter: string;
  num_dp: string | null;
  tipo_servico: string | null;
  chi: number | null;
  equipe_lm: number | null;
  equipe_lv: number | null;
  equipe_reg: number | null;
  chave_provisoria: boolean | null;
  idTecnico: number;
  idRestricao: number;
  responsavel_restricao: string | null;
  observacao_programacao: string | null;
  observacao_execucao: string | null;
  caminhos_arquivos: string[];
}

interface Props {
  schedule?: D5ScheduleData;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{
      id: number;
      restricao: string;
      tipo_restricao: string;
      responsabilidade: string;
    }>;
  };
}

function getInitialFormData(): D5FormData {
  return {
    scheduledDate: dayjs().format("YYYY-MM-DD"),
    prog: 0,
    exec: "",
    startTime: "08:00",
    endTime: "09:00",
    numDp: "",
    serviceType: "",
    chi: "",
    lmTeam: "",
    lvTeam: "",
    regulTeam: "",
    temporaryKey: false,
    technicalId: 1,
    restrictionId: 1,
    restrictionResponsible: "",
    observation: "",
    executionObservation: "",
  };
}

export function useD5ScheduleForm({ schedule, options }: Props) {
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<D5FormData>(getInitialFormData);

  /* ---------------- Anexos ---------------- */

  const [originalFiles, setOriginalFiles] = useState<string[]>([]);
  const [keptFiles, setKeptFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (schedule) {
      setFormData(mapD5ScheduleToForm(schedule, options));

      const stored = schedule.caminhos_arquivos ?? [];

      setOriginalFiles(stored);
      setKeptFiles(stored);
    } else {
      setFormData(getInitialFormData());
      setOriginalFiles([]);
      setKeptFiles([]);
    }

    setNewFiles([]);
    setFormErrors({});
  }, [schedule, options]);

  /** true se o utilizador removeu algum anexo já gravado */
  const filesChanged =
    keptFiles.length !== originalFiles.length ||
    keptFiles.some((file) => !originalFiles.includes(file));

  /* ---------------- Handlers ---------------- */

  const handleAccordionChange =
    (panel: string) => (_: unknown, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const setFieldValue = useCallback(
    (field: keyof D5FormData, value: unknown) => {
      setFormData((previous) => ({ ...previous, [field]: value }));

      setFormErrors((previous) => {
        if (!previous[field]) return previous;
        const { [field]: _removed, ...rest } = previous;
        return rest;
      });
    },
    [],
  );

  const handleInputChange =
    (field: keyof D5FormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const value = target.type === "checkbox" ? target.checked : target.value;
      setFieldValue(field, value);
    };

  /** limpa anexos e observação quando a execução é desfeita */
  const handleExecChange = (value: string | number) => {
    setFieldValue("exec", value);

    const hasExecution = value !== "";

    if (!hasExecution) {
      setFieldValue("executionObservation", "");
      setKeptFiles([]);
      setNewFiles([]);
    }
  };

  /* ---------------- Payload ---------------- */

  const buildFormData = (): FormData => {
    const payload = new FormData();

    payload.append("scheduledDate", formData.scheduledDate);
    payload.append("prog", String(formData.prog));

    if (formData.exec !== "") {
      payload.append("exec", String(formData.exec));
    }

    if (formData.startTime) payload.append("startTime", formData.startTime);
    if (formData.endTime) payload.append("endTime", formData.endTime);
    if (formData.numDp) payload.append("numDp", formData.numDp);
    if (formData.serviceType)
      payload.append("serviceType", formData.serviceType);
    if (formData.chi !== "") payload.append("chi", String(formData.chi));
    if (formData.lmTeam !== "")
      payload.append("lmTeam", String(formData.lmTeam));
    if (formData.lvTeam !== "")
      payload.append("lvTeam", String(formData.lvTeam));
    if (formData.regulTeam !== "") {
      payload.append("regulTeam", String(formData.regulTeam));
    }

    payload.append("temporaryKey", String(formData.temporaryKey));
    payload.append("technicalId", String(formData.technicalId));
    payload.append("restrictionId", String(formData.restrictionId));

    if (formData.restrictionResponsible) {
      payload.append("restrictionResponsible", formData.restrictionResponsible);
    }

    if (formData.observation) {
      payload.append("observation", formData.observation);
    }

    if (formData.executionObservation) {
      payload.append("executionObservation", formData.executionObservation);
    }

    // campo omitido = não mexer nos anexos
    if (filesChanged) {
      payload.append("keptFiles", JSON.stringify(keptFiles));
    }

    newFiles.forEach((file) => payload.append("files", file));

    return payload;
  };

  return {
    expanded,
    formData,
    formErrors,
    setFormErrors,
    handleAccordionChange,
    handleInputChange,
    setFieldValue,
    handleExecChange,

    keptFiles,
    newFiles,
    setKeptFiles,
    setNewFiles,
    filesChanged,

    buildFormData,
  };
}
