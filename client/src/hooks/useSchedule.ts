import { editSchedule, saveSchedule } from "@/actions/schedules";
import { ScheduleFormDialogProps } from "@/components/details/dialog";
import { mapScheduleToForm } from "@/utils/transform";
import { validationSchedulesSchema } from "@/validations/validationSchedules";
import { useCallback, useEffect, useState, useTransition } from "react";
import { z } from "zod";

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
  exec: undefined,
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
  idWork,
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  onClose,
  setFormErrors,
}: UseScheduleSubmitProps) => {
  const [isPending, startTransition] = useTransition();

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

        const validatedData = { idWork, ...result.data };
        const apiCall = isInsert ? saveSchedule : editSchedule;
        const response = await apiCall(validatedData);

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
    isInsert,
    onError,
    onSuccess,
    onModalOpen,
    onClose,
    setFormErrors,
  ]);

  return { handleSubmit, isPending };
};

interface UseScheduleFormProps {
  scheduleData?: any;
  options: ScheduleFormDialogProps["options"];
  onClose: () => void;
}

export const useScheduleForm = ({
  scheduleData,
  options,
  onClose,
}: UseScheduleFormProps) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | false>("panel1");

  useEffect(() => {
    if (scheduleData) {
      const mapped = mapScheduleToForm(scheduleData, options);
      setFormData(mapped);
    }
  }, [options, scheduleData]);

  const handleInputChange = useCallback(
    (field: keyof FormData) =>
      (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
      ) => {
        const value = event.target.value;
        const numericFields = [
          "prog",
          "exec",
          "chi",
          "lmTeam",
          "regulTeam",
          "lvTeam",
          "idTechnical",
          "idExecutionRestriction",
        ];

        setFormData((prev) => ({
          ...prev,
          [field]: numericFields.includes(field) ? Number(value) : value,
        }));
      },
    []
  );

  const handleSliderChange = useCallback(
    (field: "prog" | "exec") => (_: Event, newValue: number | number[]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: newValue as number,
      }));
    },
    []
  );

  const handleAccordionChange = useCallback(
    (panel: string) => (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setExpanded("panel1");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return {
    formData,
    formErrors,
    expanded,
    setFormErrors,
    handleInputChange,
    handleSliderChange,
    handleAccordionChange,
    handleClose,
  };
};

// hooks/useScheduleSubmit.ts
