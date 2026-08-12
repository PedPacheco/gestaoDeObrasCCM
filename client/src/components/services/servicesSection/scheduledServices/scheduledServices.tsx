"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  performScheduleServices,
  reascheduleServices,
} from "@/actions/services";
import { UseExecutionServiceFormReturn } from "@/hooks/useExecutionServicesForm";
import { usePersistentServiceValidation } from "@/hooks/services/usePersistentServiceValidation";
import { Paper, Typography } from "@mui/material";

import { ScheduledServicesTable } from "./scheduledServicesTable";
import { ValidationOfScheduledServices } from "./validationOfScheduledServices";
import { ExecutionReportDialog } from "@/components/executionReport/executionReportDialog";
import { ButtonComponent } from "@/components/common/Button";
import { RestrictionsModal } from "./executionRestrictionModal";
import { ScheduledServicesHistoryData } from "../scheduleHistory";
import { ConfirmRescheduleModal } from "./confirmReascheduled";

dayjs.extend(utc);

interface ScheduledServicesProps {
  scheduledServicesData: any[];
  scheduledServicesHistory: ScheduledServicesHistoryData[];
  options: {
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  executionForm: UseExecutionServiceFormReturn;
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
  isDisabled: boolean;
  todayIsOnOrAfterScheduleDate: boolean;
}

export interface ScheduledServiceState {
  id: number;
  prog: number;
  qtdeRealizada: string | null;
  selected: boolean;
  validationStatus?: "completo" | "reprogramar" | "sem-realizacao" | null;
}

export function ScheduledServices({
  scheduledServicesData,
  scheduledServicesHistory,
  options,
  executionForm,
  onError,
  onSuccess,
  isDisabled,
  todayIsOnOrAfterScheduleDate,
}: ScheduledServicesProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const formData = executionForm.buildPayload();

  const {
    validateServices,
    clearValidation,
    buildSummary,
    hydrateStatuses,
    isValidated,
  } = usePersistentServiceValidation(formData.idSchedule);

  const [scheduledServices, setScheduledServices] = useState<
    ScheduledServiceState[]
  >([]);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  useEffect(() => {
    const mapped = scheduledServicesData.map((item) => ({
      id: item.id,
      prog: item.qtdeProgramada,
      qtdeRealizada: item.qtdeRealizada,
      selected: false,
      validationStatus: null,
    }));

    const hydrated = hydrateStatuses(mapped);

    setScheduledServices(hydrated);
  }, [hydrateStatuses, scheduledServicesData]);

  const validationSummary = buildSummary(scheduledServices);

  const [isRestrictionsModalOpen, setIsRestrictionsModalOpen] = useState(false);
  const [isExecutionReportModalOpen, setIsExecutionReportModalOpen] =
    useState(false);

  const executionIsPartial = useMemo(() => {
    const currentSchedule = scheduledServicesHistory.filter(
      (s) => s.idProg === formData.idSchedule && s.tipo === "S",
    );

    return currentSchedule.some(
      (s) => s.qtdeRealizada === null || s.qtdeProgramada > s.qtdeRealizada,
    );
  }, [scheduledServicesHistory, formData.idSchedule]);

  const executionIsCanceled = useMemo(() => {
    const currentSchedule = scheduledServicesHistory.filter(
      (s) => s.idProg === formData.idSchedule,
    );

    return currentSchedule.every(
      (s) => s.qtdeRealizada === null || s.qtdeProgramada > s.qtdeRealizada,
    );
  }, [scheduledServicesHistory, formData.idSchedule]);

  const isRealConsistentWithHistory = useMemo(() => {
    return scheduledServices.every((service) => {
      const history = scheduledServicesHistory.find(
        (h) => h.idServico === service.id && h.idProg === formData.idSchedule,
      );

      if (!history) return false;

      const realValue =
        service.qtdeRealizada === null ? null : Number(service.qtdeRealizada);

      return realValue === history.qtdeRealizada;
    });
  }, [scheduledServices, scheduledServicesHistory, formData.idSchedule]);

  const canFinalize = useMemo(
    () =>
      isValidated &&
      scheduledServices.length > 0 &&
      scheduledServices.every((s) => s.validationStatus),
    [isValidated, scheduledServices],
  );

  const handleApplyPlannedToReal = () => {
    setScheduledServices((prev) =>
      prev.map((service) => {
        if (!service.selected) return service;

        return { ...service, qtdeRealizada: service.prog.toString() };
      }),
    );

    clearValidation();
  };

  const handlePerformServices = () => {
    const formatted = scheduledServices.map((item) => ({
      id: item.id,
      qtdeRealizada: item.qtdeRealizada ? Number(item.qtdeRealizada) : null,
    }));

    startTransition(async () => {
      const result = await performScheduleServices(formatted);

      if (!result.success) {
        onError(result.error);
        return;
      }

      if (result.message) {
        onSuccess(result.message, () => router.refresh());
      }
    });
  };

  const handleWithReascheduled = () => {
    setIsRescheduleModalOpen(false);

    startTransition(async () => {
      const result = await reascheduleServices(
        formData.idWork,
        formData.idSchedule,
      );

      if (!result.success) {
        onError(result.error);
        return;
      }

      if (result.message) {
        onSuccess(result.message, () => router.back());
      }
    });
  };

  const handleFinalizeServices = () => {
    clearValidation();

    if (executionIsPartial || executionIsCanceled) {
      setIsRestrictionsModalOpen(true);
    } else {
      setIsExecutionReportModalOpen(true);
    }
  };

  const canUseScheduleActions = useMemo(() => {
    return isDisabled && todayIsOnOrAfterScheduleDate;
  }, [isDisabled, todayIsOnOrAfterScheduleDate]);

  return (
    <>
      <Paper className="p-6 min-h-[460px]">
        <Typography className="text-xl font-semibold text-gray-700 mb-2">
          SERVIÇOS PROGRAMADOS
        </Typography>

        <div className="flex justify-end gap-2 my-4">
          <ButtonComponent
            text="Aplicar Planejado como realizado"
            styled="!h-8"
            onClick={handleApplyPlannedToReal}
            disabled={
              isPending ||
              !scheduledServices.some((s) => s.selected) ||
              !isDisabled ||
              scheduledServices.length === 0
            }
          />

          <ButtonComponent
            text="Realizar Serviços"
            styled="!h-8"
            onClick={handlePerformServices}
            disabled={
              isPending ||
              !canUseScheduleActions ||
              scheduledServices.length === 0
            }
          />

          <ButtonComponent
            text="Validar Serviços"
            styled="!h-8"
            onClick={() => {
              setScheduledServices(validateServices(scheduledServices));
            }}
            disabled={
              isPending ||
              !isRealConsistentWithHistory ||
              scheduledServices.length === 0
            }
          />

          <ButtonComponent
            text="Finalizar Execução dos Serviços"
            styled="!h-8"
            onClick={handleFinalizeServices}
            disabled={isPending || !canUseScheduleActions || !canFinalize}
          />
        </div>

        <ScheduledServicesTable
          setScheduledServices={setScheduledServices}
          scheduledServices={scheduledServices}
          scheduledServicesData={scheduledServicesData}
          clearValidation={() => clearValidation()}
        />

        <ValidationOfScheduledServices validationSummary={validationSummary} />
      </Paper>

      <RestrictionsModal
        open={isRestrictionsModalOpen}
        onClose={() => setIsRestrictionsModalOpen(false)}
        onSave={() => setIsExecutionReportModalOpen(true)}
        onReascheduled={() => setIsRescheduleModalOpen(true)}
        options={options}
        executionForm={executionForm}
        executionIsCanceled={executionIsCanceled}
        executionIsPartial={executionIsPartial}
      />

      <ExecutionReportDialog
        open={isExecutionReportModalOpen}
        onClose={() => setIsExecutionReportModalOpen(false)}
        executionReportIsInsert={true}
        executionForm={executionForm}
        executionIsPartial={executionIsPartial}
        onSuccess={onSuccess}
        onModalOpen={setIsExecutionReportModalOpen}
      />

      <ConfirmRescheduleModal
        open={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        isDisabled={isPending}
        onConfirm={handleWithReascheduled}
      />
    </>
  );
}
