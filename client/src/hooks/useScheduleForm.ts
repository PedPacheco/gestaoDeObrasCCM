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
  responsiblityProg: "",
  responsibleName: "",
  responsibleArea: "",
  restrictionStatus: "",
  resolutionDate: null,
  idProgRestriction2: 1,
  responsiblityProg2: "",
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

export const useScheduleForm = ({
  data,
  options,
  idWork,
}: UseScheduleFormProps) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [expanded, setExpanded] = useState<string | false>("panel1");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!data) return;
    if (initializedRef.current) return;

    const dataWithIdWork = { ...data, idWork };

    const mapped = mapScheduleToForm(dataWithIdWork, options);
    setFormData(mapped);

    initializedRef.current = true;
  }, [data, idWork, options]);

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
  }, []);

  return {
    formData,
    setFormData,
    expanded,
    handleInputChange,
    handleAccordionChange,
    resetForm,
  };
};
