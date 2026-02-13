import { useCallback, useTransition } from "react";

import { editSchedule } from "@/actions/schedules";
import { FormData } from "./useExecutionServicesForm";

interface UseScheduleSubmitProps {
  formData: FormData;
  idWork: number;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  setFormErrors: (errors: Record<string, string>) => void;
}

export const useScheduleSubmit = ({
  idWork,
  onError,
  onSuccess,
}: UseScheduleSubmitProps) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (data: any) => {
      startTransition(async () => {
        let response;

        try {
          const payload = {
            idWork,
            ...(() => {
              const { id, prog, ...rest } = data;
              return rest;
            })(),
          };

          response = await editSchedule(payload, data.id);

          if (!response.success) {
            onError(response.error);
            return;
          }

          onSuccess(response.message);
        } catch (error: any) {
          onError(error.message);
        }
      });
    },
    [onSuccess, idWork, onError],
  );

  return { handleSubmit, isPending };
};
