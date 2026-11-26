import { useCallback, useTransition } from "react";

import { editExecutionReport } from "@/actions/executionReport.action";
import { finalizeServices } from "@/actions/services";
import { useRouter } from "next/navigation";

interface UseExecutionServicesSubmitProps {
  isInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  onClose: () => void;
}

export const useExecutionServicesSubmit = ({
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  onClose,
}: UseExecutionServicesSubmitProps) => {
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSubmit = useCallback(
    (data: any, files?: File[]) => {
      startTransition(async () => {
        let response;

        try {
          if (!isInsert) {
            const { id, ...rest } = data;

            const cleanedExecutionReport = {
              ...rest,
              appliedEquipment: rest.appliedEquipment?.map(
                ({ type, ...e }: { type: string; [key: string]: any }) => e,
              ),
              equipmentRemoved: rest.equipmentRemoved?.map(
                ({ type, ...e }: { type: string; [key: string]: any }) => e,
              ),
            };

            response = await editExecutionReport(
              cleanedExecutionReport,
              id,
              files,
            );
          } else {
            const { finishTime, serviceType, workId, ...dataToBeSent } = data;

            response = await finalizeServices(dataToBeSent, workId, files);
          }

          if (!response.success) {
            onError(response.error);
            return;
          }

          if ("message" in response && response.message) {
            onSuccess(response.message);
          }

          onClose();
          onModalOpen(true);

          router.back();
        } catch (error: any) {
          onError(error.message);
        }
      });
    },
    [isInsert, onClose, onModalOpen, router, onError, onSuccess],
  );

  return { handleSubmit, isPending };
};
