import { useCallback, useTransition } from "react";

import { newEditSchedule } from "@/actions/schedules";
import { FormData } from "../useExecutionServicesForm";

interface UseScheduleSubmitProps {
  formData: FormData;
  workId: number;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
}

export const useScheduleSubmit = ({
  workId,
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
            workId,
            ...(() => {
              const { id, prog, ...rest } = data;
              return rest;
            })(),
          };

          response = await newEditSchedule(payload, data.id);

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
    [onSuccess, workId, onError],
  );

  return { handleSubmit, isPending };
};
