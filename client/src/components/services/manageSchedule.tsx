"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useExecutionServiceForm } from "@/hooks/useExecutionServicesForm";
import { useFeedback } from "@/hooks/useFeedback";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import { useScheduleForm } from "@/hooks/details/useScheduleForm";
import { useScheduleWorkflow } from "@/hooks/details/useScheduleWorkflow";

import { schedulesSchema } from "@/validations/validationSchedules";
import { saveSchedule } from "@/actions/schedules";

import { ScheduleTopbar } from "./scheduleTopbar";
import { NewScheduleSection } from "./newScheduleSection/newScheduleSection";
import { NewServicesSection } from "./servicesSection/servicesSection";
import { ScheduleSidebar } from "./scheduleSidebar";
import { EditManageSchedule } from "./editManageSchedule";
import { ServiceContract } from "./servicesSection/addServiceForm";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ManageScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  serviceTeams: any[];
  scheduledServicesHistory: any[];
  serviceFilters: any;
  isInsert: boolean;
  options: any;
  idWork: number;
  idStatusWork: number;
  idSchedule: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function NewManageSchedule({
  scheduleData,
  scheduledServicesData,
  servicesData,
  serviceContractData,
  serviceFilters,
  serviceTeams,
  scheduledServicesHistory,
  isInsert,
  options,
  idWork,
  idStatusWork,
  idSchedule,
}: ManageScheduleProps) {
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();

  const [scheduledServices, setScheduledService] = useState<any[]>([]);

  const scheduleForm = useScheduleForm({ data: scheduleData, options, idWork });

  const executionFormData = useMemo(() => {
    if (!idSchedule) return null;
    return {
      idWork,
      idSchedule,
      idExecutionRestriction: 1,
      serviceType: scheduleForm.formData.serviceType,
      finishTime: scheduleForm.formData.finishTime,
    };
  }, [
    idWork,
    idSchedule,
    scheduleForm.formData.finishTime,
    scheduleForm.formData.serviceType,
  ]);

  const executionForm = useExecutionServiceForm({
    enabled: Boolean(idSchedule),
    data: executionFormData,
  });

  const { isPending } = useScheduleSubmit({
    idWork: Number(idWork),
    onError: showError,
    onSuccess: (message) => showSuccess(message),
    formData: scheduleData,
  });

  const workflow = useScheduleWorkflow({ selectedServices: scheduledServices });

  const handleCancel = useCallback(() => {
    router.replace(`/detalhes/${idWork}`);
    router.refresh();
  }, [router, idWork]);

  const handleSaveSchedule = useCallback(async () => {
    const validationResult = schedulesSchema().safeParse(scheduleForm.formData);

    if (!validationResult.success) {
      showError("Preencha todos os campos obrigatórios");
      return;
    }

    if (scheduledServices.length === 0) {
      showError("Selecione ao menos um serviço para criar a programação");
      return;
    }

    const formattedService = scheduledServices.map((service) => ({
      id: service.id,
      idTeam: service.idTeam,
      prog: service.prog,
      additional: service.qtdeAdicional,
    }));

    const data = {
      schedule: validationResult.data,
      services: formattedService,
    };

    const response = await saveSchedule(data);

    if (!response.success) {
      showError(response.error);
      return;
    }

    showSuccess(response.message, () => router.refresh());
  }, [
    scheduleForm.formData,
    scheduledServices,
    showSuccess,
    showError,
    router,
  ]);

  // ─── Modo edição: delega ao layout específico ──────────────

  if (!isInsert && idSchedule !== null) {
    return (
      <EditManageSchedule
        scheduleData={scheduleData}
        servicesData={servicesData}
        scheduledServicesData={scheduledServicesData}
        serviceContractData={serviceContractData}
        serviceTeams={serviceTeams}
        scheduledServicesHistory={scheduledServicesHistory}
        serviceFilters={serviceFilters}
        options={options}
        idWork={idWork}
        idStatusWork={idStatusWork}
        idSchedule={idSchedule}
      />
    );
  }

  // ─── Modo inserção ──────────────────────────────────────────

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)]">
        <ScheduleTopbar title="Adicionar programação" idWork={idWork} />

        <div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-[1fr_320px]">
          <main className="flex flex-col items-center gap-5 overflow-y-auto py-4">
            <div className="flex w-full max-w-[90%] flex-col gap-5">
              <NewScheduleSection
                isInsert={isInsert}
                options={options}
                scheduleForm={scheduleForm}
                statusWork={idStatusWork}
              />

              <NewServicesSection
                servicesData={servicesData}
                serviceFilters={serviceFilters}
                setScheduledServices={setScheduledService}
                isInsert={isInsert}
                idSchedule={idSchedule}
                statusSchedule={
                  scheduleData ? scheduleData.status_programacao : null
                }
                teams={serviceTeams}
                onError={showError}
                onSuccess={showSuccess}
              />
            </div>
          </main>

          <ScheduleSidebar
            selectedServices={scheduledServices}
            setSelectedServices={setScheduledService}
            servicesData={servicesData}
            selectedCount={workflow.selectedCount}
            canCreate={workflow.canCreate}
            isPending={isPending}
            onCancel={handleCancel}
            onSubmit={handleSaveSchedule}
          />
        </div>
      </div>
    </div>
  );
}
