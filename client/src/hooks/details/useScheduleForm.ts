"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { EquipmentData } from "@/components/details/modals/executionReportDialog/EquipmentPanel";
import { ExecutionReportData } from "@/components/details/modals/executionReportDialog/executionReportDialog";
import { ScheduleFormDialogProps } from "@/components/details/modals/scheduleDialog/dialog";
import { mapScheduleToForm, transformExecutionReport } from "@/utils/transform";
import { validationSchedulesSchema } from "@/validations/validationSchedules";

export const staticValidationSchema = validationSchedulesSchema(null, true);
export type FormData = z.infer<typeof staticValidationSchema>;

export const INITIAL_EXECUTION_REPORT: ExecutionReportData = {
  id: 0,
  idUser: 0,
  supervisor: "",
  partialConnectionReleased: false,
  startTime: "00:00",
  finishTime: "00:00",
  startContact: "",
  endContact: "",
  delayJustification: "",
  hasEquipmentInstalled: false,
  appliedEquipment: [],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  generalObservation: "",
  reason: "",
  provisionalKeyInstalled: false,
  provisionalKeyReference: "",
  provisionalKeyWithdrawn: null,
};

export const INITIAL_FORM_DATA: FormData = {
  id: 0,
  dataProg: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  finishTime: "17:00",
  prog: 0,
  exec: null,
  serviceType: "LV",
  observation: "",
  equipment: "",
  chi: 0,
  numDp: "",
  temporaryKey: false,
  lmTeam: 0,
  regulTeam: 0,
  lvTeam: 0,
  idTechnical: 1,
  idExecutionRestriction: 1,
  responsibility: "",
  // Campos de restrições - Bloco 1
  idProgRestriction1: 1,
  responsiblityProg: "",
  responsibleName: "",
  responsibleArea: "",
  restrictionStatus: "",
  resolutionDate: null,
  // Campos de restrições - Bloco 2
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
  executionData: ExecutionReportData;
  options: ScheduleFormDialogProps["options"];
}

export const useScheduleForm = ({
  data,
  executionData,
  options,
}: UseScheduleFormProps) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [executionReportData, setExecutionReportData] =
    useState<ExecutionReportData>(INITIAL_EXECUTION_REPORT);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const [initialExecValue, setInitialExecValue] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const mapped = mapScheduleToForm(data, options);
      setFormData(mapped);
    }

    if (executionData) {
      const executionReportDataMapped = transformExecutionReport(executionData);

      setExecutionReportData(executionReportDataMapped);
    }

    if (data?.exec != null) {
      setInitialExecValue(data.exec);
    }
  }, [options, data, executionData]);

  const handleInputChange = useCallback(
    (
        field:
          | keyof FormData
          | `executionReport.${keyof ExecutionReportData}`
          | keyof ExecutionReportData
      ) =>
      (value: any) => {
        // Se o valor já vier processado (do DatePicker ou Select)
        // usamos diretamente, caso contrário é um evento
        const finalValue = value?.target
          ? value.target.type === "checkbox"
            ? value.target.checked
            : value.target.type === "radio"
            ? value.target.value === "true"
              ? true
              : value.target.value === "false"
              ? false
              : value.target.value
            : value.target.value
          : value;

        if (field in INITIAL_EXECUTION_REPORT) {
          setExecutionReportData((prev) => {
            return {
              ...prev,
              [field]: finalValue,
            };
          });
        }

        setFormData((prev) => {
          if (field.startsWith("executionReport.")) {
            const subField = field.split(".")[1] as keyof ExecutionReportData;

            return {
              ...prev,
              executionReport: {
                ...(prev.executionReport ?? INITIAL_EXECUTION_REPORT),
                [subField]: finalValue,
              },
            };
          }

          return {
            ...prev,
            [field]: finalValue,
            executionReport: INITIAL_EXECUTION_REPORT,
          };
        });
      },
    []
  );

  const handleAccordionChange = useCallback(
    (panel: string) => (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const onEquipmentChange = (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
    prefix: string
  ) => {
    if (prefix === "executionReport.") {
      setFormData((prev) => {
        if (!prev.executionReport) return prev;

        const updatedEquipments = [...prev.executionReport[field]];

        updatedEquipments[index] = {
          ...updatedEquipments[index],
          [subField]: value,
        };

        return {
          ...prev,
          executionReport: {
            ...prev.executionReport,
            [field]: updatedEquipments,
          },
        };
      });
    } else {
      setExecutionReportData((prev) => {
        const updatedEquipments = [...prev[field]];
        updatedEquipments[index] = {
          ...updatedEquipments[index],
          [subField]: value,
        };

        return {
          ...prev,
          [field]: updatedEquipments,
        };
      });
    }
  };

  const onAddEquipment = (
    field: "appliedEquipment" | "equipmentRemoved",
    prefix: string,
    type: "DEFAULT" | "CS" = "DEFAULT",
    insertIndex?: number
  ) => {
    const newEquipment =
      type === "CS"
        ? {
            equipment: "",
            power: "",
            patrimony: "",
            installation: "",
            type: "CS",
          }
        : {
            equipment: "",
            power: "",
            patrimony: "",
            installation: "",
            type: "DEFAULT",
          };

    const insertAt = (arr: any[]) => {
      if (insertIndex !== undefined) {
        return [
          ...arr.slice(0, insertIndex + 1),
          newEquipment,
          ...arr.slice(insertIndex + 1),
        ];
      }

      return [...arr, newEquipment];
    };

    if (prefix === "executionReport.") {
      setFormData((prev) => {
        const execReport = prev.executionReport ?? INITIAL_EXECUTION_REPORT;

        return {
          ...prev,
          executionReport: {
            ...execReport,
            [field]: insertAt(execReport[field]),
          },
        };
      });
    } else {
      setExecutionReportData((prev) => {
        return {
          ...prev,
          [field]: insertAt(prev[field]),
        };
      });
    }
  };

  const onRemoveEquipment = (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    prefix: string
  ) => {
    if (prefix === "executionReport.") {
      setFormData((prev) => {
        if (!prev.executionReport) return prev;

        const updatedList = [...prev.executionReport[field]];
        updatedList.splice(index, 1);

        return {
          ...prev,
          executionReport: {
            ...prev.executionReport,
            [field]: updatedList,
          },
        };
      });
    } else {
      setExecutionReportData((prev) => {
        const updatedList = [...prev[field]];
        updatedList.splice(index, 1);

        return {
          ...prev,
          [field]: updatedList,
        };
      });
    }
  };

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setExecutionReportData(INITIAL_EXECUTION_REPORT);
    setFormErrors({});
    setExpanded("panel1");
  }, []);

  return {
    formData,
    setFormData,
    executionReportData,
    formErrors,
    expanded,
    setFormErrors,
    handleInputChange,
    handleAccordionChange,
    resetForm,
    onAddEquipment,
    onRemoveEquipment,
    onEquipmentChange,
    initialExecValue,
  };
};
