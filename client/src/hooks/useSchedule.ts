"use client";

import { editSchedule, saveSchedule } from "@/actions/schedules";
import { ScheduleFormDialogProps } from "@/components/details/scheduleDialog/dialog";
import { EquipmentData } from "@/components/details/executionReportDialog/EquipmentPanel";
import { ExecutionReportData } from "@/components/details/executionReportDialog/executionReportDialog";
import { mapScheduleToForm, transformExecutionReport } from "@/utils/transform";
import {
  executionReportSchema,
  validationSchedulesSchema,
} from "@/validations/validationSchedules";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";
import { z } from "zod";
import { editExecutionReport } from "@/actions/executionReport.action";

const cookies = new Cookies();

export const staticValidationSchema = validationSchedulesSchema(null);
export type FormData = z.infer<typeof staticValidationSchema>;

interface UseScheduleSubmitProps {
  formData: FormData;
  executionReportData: ExecutionReportData;
  idWork: number;
  isInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  onClose: () => void;
  setFormErrors: (errors: Record<string, string>) => void;
}

export const INITIAL_EXECUTION_REPORT: ExecutionReportData = {
  id: 0,
  idUser: 0,
  supervisor: "",
  partialConnectionReleased: false,
  startTime: "08:00",
  finishTime: "17:00",
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

export const useScheduleSubmit = ({
  formData,
  executionReportData,
  idWork,
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  onClose,
  setFormErrors,
}: UseScheduleSubmitProps) => {
  const [isPending, startTransition] = useTransition();
  const rawUser = cookies.get("userInfo");
  const user = rawUser ?? null;

  const handleSubmit = useCallback(
    (initialExecValue: string | null, type: string) => {
      startTransition(async () => {
        let response;

        try {
          if (!isInsert && type === "executionReport") {
            const result = executionReportSchema.safeParse(executionReportData);

            if (!result.success) {
              const fieldErrors: Record<string, string> = {};
              result.error.errors.forEach((err: any) => {
                const field = err.path[0] as string;
                fieldErrors[field] = err.message;
              });
              setFormErrors(fieldErrors);
              return;
            }

            const updatedData = {
              ...(() => {
                const { id, ...rest } = result.data;
                return rest;
              })(),
            };

            response = await editExecutionReport(updatedData, result.data.id);
          } else {
            const validationSchema =
              validationSchedulesSchema(initialExecValue);

            const result = validationSchema.safeParse(formData);

            if (!result.success) {
              const fieldErrors: Record<string, string> = {};
              result.error.errors.forEach((err: any) => {
                const field = err.path[0] as string;
                fieldErrors[field] = err.message;
              });
              setFormErrors(fieldErrors);
              return;
            }

            const { executionReport, ...scheduleFields } = result.data;

            const payload = {
              updateData: {
                idWork,
                ...(() => {
                  const { id, ...rest } = scheduleFields;
                  return rest;
                })(),
              },
              ...(executionReport && {
                executionReportData: {
                  idUser: user?.id,
                  ...(() => {
                    const { idUser, id, ...rest } = executionReport;
                    return rest;
                  })(),
                },
              }),
            };

            const apiCall = isInsert ? saveSchedule : editSchedule;

            response = await apiCall(payload, scheduleFields.id);
          }

          if (!response.success) {
            onError(response.error);
            return;
          }

          onSuccess(response.message);
          onClose();
          onModalOpen(true);
        } catch (error: any) {
          onError(error.message);
        }
      });
    },
    [
      isInsert,
      onSuccess,
      onClose,
      onModalOpen,
      executionReportData,
      setFormErrors,
      formData,
      idWork,
      user?.id,
      onError,
    ]
  );

  return { handleSubmit, isPending };
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
  const [openExecChangeDialog, setOpenExecChangeDialog] = useState(false);

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
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const isCheckbox = event.target.type === "checkbox";
        let value = isCheckbox ? event.target.checked : event.target.value;

        if (
          field === "exec" &&
          value !== initialExecValue &&
          initialExecValue === "null"
        ) {
          setOpenExecChangeDialog(true);
        } else {
          setOpenExecChangeDialog(false);
        }

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

          if (value !== initialExecValue && initialExecValue === "null") {
            return {
              ...prev,
              [field]: value,
              executionReport: INITIAL_EXECUTION_REPORT,
            };
          }

          return {
            ...prev,
            [field]: value,
          };
        });
      },
    [initialExecValue]
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
    prefix: string
  ) => {
    if (prefix === "executionReport.") {
      setFormData((prev) => {
        const execReport = prev.executionReport ?? INITIAL_EXECUTION_REPORT;

        return {
          ...prev,
          executionReport: {
            ...execReport,
            [field]: [
              ...execReport[field],
              { equipment: "", power: "", patrimony: "" },
            ],
          },
        };
      });
    } else {
      setExecutionReportData((prev) => {
        return {
          ...prev,
          [field]: [
            ...prev[field],
            { equipment: "", power: "", patrimony: "" },
          ],
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
    openExecChangeDialog,
    resetForm,
    setOpenExecChangeDialog,
    onAddEquipment,
    onRemoveEquipment,
    onEquipmentChange,
    initialExecValue,
  };
};
