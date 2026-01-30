import { useCallback, useTransition } from "react";
import { Cookies } from "react-cookie";

import { editSchedule } from "@/actions/schedules";
import { ExecutionReportData } from "@/components/details/modals/executionReportDialog/executionReportDialog";

import { FormData } from "./useScheduleForm";

const cookies = new Cookies();

interface UseScheduleSubmitProps {
  formData: FormData;
  idWork: number;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
}

export const useScheduleSubmitV2 = ({
  idWork,
  onError,
  onSuccess,
  onModalOpen,
}: UseScheduleSubmitProps) => {
  const [isPending, startTransition] = useTransition();
  const rawUser = cookies.get("userInfo");
  const user = rawUser ?? null;

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

          console.log(payload, data.id);
          response = await editSchedule(payload, data.id);

          if (!response.success) {
            onError(response.error);
            return;
          }

          onSuccess(response.message);

          onModalOpen(true);
        } catch (error: any) {
          onError(error.message);
        }
      });
    },
    [onSuccess, onModalOpen, idWork, user?.id, onError],
  );

  return { handleSubmit, isPending };
};
