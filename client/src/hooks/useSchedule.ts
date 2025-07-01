"use client";

import { editSchedule, saveSchedule } from "@/actions/schedules";
import { ScheduleFormDialogProps } from "@/components/details/scheduleDialog/dialog";
import { EquipmentData } from "@/components/details/executionReportDialog/EquipmentPanel";
import { ExecutionReportData } from "@/components/details/executionReportDialog/executionReportDialog";
import { mapScheduleToForm } from "@/utils/transform";
import { validationSchedulesSchema } from "@/validations/validationSchedules";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";
import { z } from "zod";

const cookies = new Cookies();

export type FormData = z.infer<typeof validationSchedulesSchema>;

interface UseScheduleSubmitProps {
  formData: FormData;
  idWork: number;
  isInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  onClose: () => void;
  setFormErrors: (errors: Record<string, string>) => void;
}

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

export const INITIAL_EXECUTION_REPORT: ExecutionReportData = {
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

export const useScheduleSubmit = ({
  formData,
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

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const result = validationSchedulesSchema.safeParse(formData);

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
            ...scheduleFields,
            id: undefined,
          },
          ...(executionReport && {
            executionReportData: {
              idUser: user?.id,
              ...(() => {
                const { idUser, ...rest } = executionReport;
                return rest;
              })(),
            },
          }),
        };

        const apiCall = isInsert ? saveSchedule : editSchedule;

        const response = await apiCall(payload, scheduleFields.id);

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
  }, [
    formData,
    idWork,
    user?.id,
    isInsert,
    onSuccess,
    onClose,
    onModalOpen,
    setFormErrors,
    onError,
  ]);

  return { handleSubmit, isPending };
};

interface UseScheduleFormProps {
  data?: any;
  options: ScheduleFormDialogProps["options"];
}

export const useScheduleForm = ({ data, options }: UseScheduleFormProps) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const [initialExecValue, setInitialExecValue] = useState<string | null>(null);
  const [openExecChangeDialog, setOpenExecChangeDialog] = useState(false);

  useEffect(() => {
    if (data) {
      const mapped = mapScheduleToForm(data, options);
      setFormData(mapped);
    }

    if (data?.exec != null) {
      setInitialExecValue(data.exec);
    }
  }, [options, data]);

  const handleInputChange = useCallback(
    (field: keyof FormData | `executionReport.${keyof ExecutionReportData}`) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const isCheckbox = event.target.type === "checkbox";
        let value = isCheckbox ? event.target.checked : event.target.value;

        if (field === "exec" && value !== "" && value !== initialExecValue) {
          setOpenExecChangeDialog(true);
        } else {
          setOpenExecChangeDialog(false);
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
    value: string
  ) => {
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
  };

  const onAddEquipment = (field: "appliedEquipment" | "equipmentRemoved") => {
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
  };

  const onRemoveEquipment = (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number
  ) => {
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
  };

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setExpanded("panel1");
  }, []);

  return {
    formData,
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
  };
};
