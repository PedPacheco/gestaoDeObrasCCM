"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { mapScheduleToForm } from "@/utils/transform";
import { schedulesSchema } from "@/validations/validationSchedules";

export const staticValidationSchema = schedulesSchema();
export type FormData = z.infer<typeof staticValidationSchema>;

export const INITIAL_FORM_DATA: FormData = {
  idWork: 1,
  dataProg: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  finishTime: "17:00",
  prog: 0,
  serviceType: "LV",
  observation: "",
  equipment: "",
  chi: 0,
  numDp: "",
  temporaryKey: false,
  idTechnical: 1,
  idProgRestriction1: 1,
  responsibilityProg: "",
  responsibleName: "",
  responsibleArea: "",
  restrictionStatus: "",
  resolutionDate: null,
  idProgRestriction2: 1,
  responsibilityProg2: "",
  responsibleName2: "",
  responsibleArea2: "",
  restrictionStatus2: "",
  resolutionDate2: null,
  confirmed: false,
  validated: false,
};

interface UseScheduleFormProps {
  data?: FormData;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  idWork: number;
}

export interface UseScheduleFormReturn {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expanded: string | false;
  handleInputChange: (field: keyof FormData) => (value: any) => void;
  handleAccordionChange: (
    panel: string,
  ) => (_: any, isExpanded: boolean) => void;
  resetForm: () => void;
}

export const useScheduleForm = ({
  data,
  options,
  idWork,
}: UseScheduleFormProps) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | false>("panel1");

  const initializedRef = useRef(false);

  // Inicialização completa — só executa quando data existe e apenas uma vez
  useEffect(() => {
    if (!data) return;
    if (initializedRef.current) return;

    const dataWithIdWork = { ...data, idWork };

    const mapped = mapScheduleToForm(dataWithIdWork, options);
    setFormData(mapped);

    initializedRef.current = true;
  }, [data, idWork, options]);

  // Atualiza apenas o idWork sempre que ele mudar
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      idWork,
    }));
  }, [idWork]);

  const handleInputChange = useCallback(
    (field: keyof FormData) => (value: any) => {
      setFormData((prev) => {
        return {
          ...prev,
          [field]: value.target.value,
        };
      });
    },
    [],
  );

  const handleAccordionChange = useCallback(
    (panel: string) => (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setExpanded("panel1");
    initializedRef.current = false;
  }, []);

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    expanded,
    handleInputChange,
    handleAccordionChange,
    resetForm,
  };
};
