"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { EquipmentData } from "@/components/details/executionReportDialog/EquipmentPanel";
import { ExecutionReportData } from "@/components/details/executionReportDialog/executionReportDialog";
import { ScheduleFormDialogProps } from "@/components/details/scheduleDialog/dialog";
import { mapScheduleToForm, transformExecutionReport } from "@/utils/transform";
import { validationSchedulesSchema } from "@/validations/validationSchedules";

export const staticValidationSchema = validationSchedulesSchema(null);
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
  workSituation: "",
  reason: "",
  provisionalKeyInstalled: false,
  provisionalKeyReference: "",
  provisionalKeyWithdrawn: false,
};

export const INITIAL_FORM_DATA: FormData = {
  id: 0,
  dataProg: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  finishTime: "17:00",
  prog: 0,
  exec: null,
  serviceType: "LV",
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
    console.log(data);
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
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const isCheckbox = event.target.type === "checkbox";
        let value = isCheckbox ? event.target.checked : event.target.value;

        if (field in INITIAL_EXECUTION_REPORT) {
          setExecutionReportData((prev) => {
            return {
              ...prev,
              [field]: value,
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
                [subField]: value,
              },
            };
          }

          return {
            ...prev,
            [field]: value,
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
    type: "DEFAULT" | "CS" = "DEFAULT"
  ) => {
    const newEquipment =
      type === "CS"
        ? { equipment: "CS", power: "", patrimony: "", type: "CS" }
        : { equipment: "", power: "", patrimony: "", type: "DEFAULT" };

    if (prefix === "executionReport.") {
      setFormData((prev) => {
        const execReport = prev.executionReport ?? INITIAL_EXECUTION_REPORT;

        return {
          ...prev,
          executionReport: {
            ...execReport,
            [field]: [...execReport[field], newEquipment],
          },
        };
      });
    } else {
      setExecutionReportData((prev) => {
        return {
          ...prev,
          [field]: [...prev[field], newEquipment],
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
