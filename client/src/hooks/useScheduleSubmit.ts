import { useCallback, useTransition } from "react";
import { Cookies } from "react-cookie";

import { editExecutionReport } from "@/actions/executionReport.action";
import { editSchedule, saveSchedule } from "@/actions/schedules";
import { ExecutionReportData } from "@/components/details/modals/executionReportDialog/executionReportDialog";

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
  idWork,
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  onClose,
}: UseScheduleSubmitProps) => {
  const [isPending, startTransition] = useTransition();
  const rawUser = cookies.get("userInfo");
  const user = rawUser ?? null;

  const handleSubmit = useCallback(
    (data: any, type: "executionReport" | "schedule", files?: File[]) => {
      startTransition(async () => {
        let response;

        try {
          if (!isInsert && type === "executionReport") {
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
            const { executionReport, ...scheduleFields } = data;

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
                    return {
                      ...rest,
                      appliedEquipment: rest.appliedEquipment?.map(
                        ({
                          type,
                          ...e
                        }: {
                          type: string;
                          [key: string]: any;
                        }) => e,
                      ),
                      equipmentRemoved: rest.equipmentRemoved?.map(
                        ({
                          type,
                          ...e
                        }: {
                          type: string;
                          [key: string]: any;
                        }) => e,
                      ),
                    };
                  })(),
                },
              }),
            };

            const apiCall = isInsert ? saveSchedule : editSchedule;
            response = await apiCall(payload, scheduleFields.id, files);
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
    [isInsert, onSuccess, onClose, onModalOpen, idWork, user?.id, onError],
  );

  return { handleSubmit, isPending };
};
