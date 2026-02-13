import { useCallback, startTransition, useEffect, useState } from "react";
import {
  deleteSchedule,
  ValidatedSchedule,
  ConfirmedSchedule,
  RejectedSchedule,
} from "@/actions/schedules";
import { deleteExecutionReport } from "@/actions/executionReport.action";
import { useFeedback } from "./useFeedback";

interface UseScheduleHandlersProps {
  data: Record<string, any>;
  idWork: string;
}

export function useScheduleHandlers({
  data,
  idWork,
}: UseScheduleHandlersProps) {
  const { showError, showSuccess } = useFeedback();

  const [validatedSchedule, setValidatedSchedule] = useState<
    { id: number; validate: boolean }[]
  >([]);

  const [confirmedSchedule, setConfirmedSchedule] = useState<
    { id: number; confirm: boolean }[]
  >([]);

  const [rejectedSchedule, setRejectedSchedule] = useState<{
    id: number;
    reject: boolean;
  } | null>(null);

  useEffect(() => {
    if (!data?.programacoes) return;

    setValidatedSchedule((prev) => {
      const newValidated = data.programacoes
        .filter((item: any) => item.exec === null)
        .map((item: any) => {
          const existing = prev.find((v) => v.id === item.id);
          return existing ?? { id: item.id, validate: !!item.validada };
        });
      return newValidated;
    });

    setConfirmedSchedule((prev) => {
      const newConfirmed = data.programacoes
        .filter((item: any) => item.exec === null)
        .map((item: any) => {
          const existing = prev.find((c) => c.id === item.id);
          return existing ?? { id: item.id, confirm: !!item.confirmada };
        });
      return newConfirmed;
    });
  }, [data?.programacoes]);

  const handleOperation = useCallback(
    async (operation: () => Promise<any>) => {
      startTransition(async () => {
        try {
          const response = await operation();
          if (!response.success) {
            showError(response.error);
            return;
          }
          showSuccess(response.message);
        } catch (error: any) {
          showError(error.message);
        }
      });
    },
    [showError, showSuccess],
  );

  const handleExecutionReportDelete = useCallback(
    (id: number) =>
      handleOperation(() => deleteExecutionReport(id, Number(idWork))),
    [idWork, handleOperation],
  );

  const handleDelete = useCallback(
    (id: number) => handleOperation(() => deleteSchedule(id, Number(idWork))),
    [idWork, handleOperation],
  );

  const handleValidated = useCallback(() => {
    handleOperation(() => ValidatedSchedule(validatedSchedule, idWork));
  }, [validatedSchedule, idWork, handleOperation]);

  const handleConfirm = useCallback(
    () => handleOperation(() => ConfirmedSchedule(confirmedSchedule, idWork)),
    [confirmedSchedule, idWork, handleOperation],
  );

  const handleReject = useCallback(
    (data: {
      id: number;
      reject: boolean;
      reason: string;
      description: string;
    }) => {
      handleOperation(() => RejectedSchedule(data, idWork));
    },
    [idWork, handleOperation],
  );

  return {
    handleDelete,
    handleExecutionReportDelete,
    handleValidated,
    handleConfirm,
    handleReject,
    rejectedSchedule,
    setConfirmedSchedule,
    setValidatedSchedule,
    setRejectedSchedule,
  };
}
