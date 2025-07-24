import { useCallback, useTransition } from "react";
import { Cookies } from "react-cookie";

import { editExecutionReport } from "@/actions/executionReport.action";
import { editSchedule, saveSchedule } from "@/actions/schedules";
import { ExecutionReportData } from "@/components/details/executionReportDialog/executionReportDialog";
import {
  executionReportSchema,
  validationSchedulesSchema,
} from "@/validations/validationSchedules";

import { FormData } from "./useScheduleForm";

const cookies = new Cookies();

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

              result.error.issues.forEach((err: any) => {
                if (err.code === "custom") {
                  const field = err.path.join(".");
                  fieldErrors[field] = err.message;

                  return;
                }

                const field = err.path[0];
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

              result.error.issues.forEach((item: any) => {
                if (item.errors) {
                  item.errors[0].map((err: any) => {
                    if (err.code === "invalid_type") return;
                    if (err.code === "custom") {
                      const field = err.path.join(".");
                      fieldErrors[field] = err.message;

                      return;
                    }

                    const field = err.path[0];
                    fieldErrors[field] = err.message;
                  });

                  return;
                }

                const field = item.path[1];
                fieldErrors[field] = item.message;
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
