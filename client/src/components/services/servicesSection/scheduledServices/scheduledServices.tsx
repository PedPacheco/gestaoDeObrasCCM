"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  performScheduleServices,
  reascheduleServices,
} from "@/actions/services";
import { ExecutionReportDialog } from "@/components/details/modals/executionReportDialog/executionReportDialog";
import { UseExecutionServiceFormReturn } from "@/hooks/useExecutionServicesForm";
import { usePersistentServiceValidation } from "@/hooks/usePersistentServiceValidation";
import { Button, Paper, Typography } from "@mui/material";

import { RestrictionsModal } from "../../scheduleSection/restrictionsCard";
import { ScheduledServicesTable } from "./scheduledServicesTable";
import { ValidationOfScheduledServices } from "./validationOfScheduledServices";

dayjs.extend(utc);

interface ScheduledServicesProps {
  scheduledServicesData: any[];
  scheduledServicesHistory: any[];
  options: {
    restricao: Array<{ id: number; restricao: string }>;
  };
  points: string[];
  operations: string[];
  services: any[];
  executionForm: UseExecutionServiceFormReturn;
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
  isDisabled: boolean;
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
  operations,
  points,
  services,
  options,
  executionForm,
  onError,
  onSuccess,
  isDisabled,
}: ScheduledServicesProps) {
  const router = useRouter();

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
      (s) => s.id_programacao === formData.idSchedule,
    );

    return currentSchedule.some((s) => s.real === null || s.prog > s.real);
  }, [scheduledServicesHistory, formData.idSchedule]);

  const isRealConsistentWithHistory = useMemo(() => {
    return scheduledServices.every((service) => {
      const history = scheduledServicesHistory.find(
        (h) =>
          h.id_servico === service.id &&
          h.id_programacao === formData.idSchedule,
      );

      if (!history) return false;

      const realValue =
        service.qtdeRealizada === null ? null : Number(service.qtdeRealizada);

      return realValue === history.real;
    });
  }, [scheduledServices, scheduledServicesHistory, formData.idSchedule]);

  const canFinalize = useMemo(
    () =>
      isValidated &&
      scheduledServices.every(
        (s) =>
          s.validationStatus === "completo" ||
          s.validationStatus === "sem-realizacao",
      ),
    [isValidated, scheduledServices],
  );

  const canReschedule = useMemo(
    () =>
      isValidated &&
      scheduledServices.some((s) => s.validationStatus === "reprogramar"),
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

  const handlePerformServices = async () => {
    const formatted = scheduledServices.map((item) => ({
      id: item.id,
      qtdeRealizada: item.qtdeRealizada ? Number(item.qtdeRealizada) : null,
    }));

    const result = await performScheduleServices(formatted);

    if (!result.success) {
      onError(result.error);
      return;
    }

    if (result.message) {
      onSuccess(result.message, () => router.refresh());
    }
  };

  const handleRescheduleServices = async () => {
    const toReschedule = scheduledServices
      .filter((s) => s.validationStatus === "reprogramar")
      .map((s) => ({ id: s.id }));

    if (!toReschedule.length) return;

    const result = await reascheduleServices(toReschedule);

    if (!result.success) {
      onError(result.error);
      return;
    }

    if (result.message) {
      onSuccess(result.message, () => router.refresh());
    }
  };

  const handleFinalizeServices = () => {
    clearValidation();

    if (executionIsPartial) {
      setIsRestrictionsModalOpen(true);
    } else {
      setIsExecutionReportModalOpen(true);
    }
  };

  return (
    <>
      <Paper className="p-6 min-h-96">
        <Typography className="text-xl font-semibold text-gray-700 mb-2">
          SERVIÇOS PROGRAMADOS
        </Typography>

        <div className="flex justify-end gap-2 my-4">
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyPlannedToReal}
            disabled={!scheduledServices.some((s) => s.selected) || isDisabled}
          >
            APLICAR PLANEJADO COMO REALIZADO
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handlePerformServices}
            disabled={isDisabled}
          >
            REALIZAR SERVIÇOS
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setScheduledServices(validateServices(scheduledServices));
            }}
            disabled={!isRealConsistentWithHistory}
          >
            VALIDAR REALIZAÇÃO DOS SERVIÇOS
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handleRescheduleServices}
            disabled={!canReschedule || isDisabled}
          >
            REPROGRAMAR SERVIÇOS
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handleFinalizeServices}
            disabled={!canFinalize || isDisabled}
          >
            FINALIZAR EXECUÇÃO DOS SERVIÇOS
          </Button>
        </div>

        <ScheduledServicesTable
          setScheduledServices={setScheduledServices}
          scheduledServices={scheduledServices}
          scheduledServicesData={scheduledServicesData}
          clearValidation={() => clearValidation()}
          operations={operations}
          points={points}
          services={services}
        />

        <ValidationOfScheduledServices validationSummary={validationSummary} />
      </Paper>

      <RestrictionsModal
        open={isRestrictionsModalOpen}
        onClose={() => setIsRestrictionsModalOpen(false)}
        onSave={() => setIsExecutionReportModalOpen(true)}
        options={options}
        formData={executionForm.editableData}
        onInputChange={executionForm.handleEditableChange}
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
    </>
  );
}
