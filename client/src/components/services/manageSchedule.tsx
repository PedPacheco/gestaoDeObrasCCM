"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { newSaveSchedule, saveSchedule } from "@/actions/schedules";
import { useScheduleForm } from "@/hooks/details/useScheduleForm";
import { useScheduleWorkflow } from "@/hooks/details/useScheduleWorkflow";
import { useFeedback } from "@/hooks/useFeedback";
import { schedulesSchema } from "@/validations/validationSchedules";

import { EditSchedule } from "./editSchedule";
import { NewScheduleSection } from "./scheduleSection/newScheduleSection";
import { ScheduleSidebar } from "./scheduleSidebar/scheduleSidebar";
import { ScheduleTopbar } from "./scheduleTopbar";
import { ServiceContract } from "./servicesSection/addServiceForm";
import { NewServicesAvaliable } from "./servicesSection/servicesAvaliable";

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
  statusSchedule?: string;
}

const disabledStatus = ["Parcial", "Concluído", "Cancelado"];

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
  statusSchedule,
}: ManageScheduleProps) {
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();

  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [servicesAvaliable, setServicesAvaliable] = useState<any[]>(
    servicesData || [],
  );

  const [isPending, startTransition] = useTransition();

  const scheduleForm = useScheduleForm({ data: scheduleData, options, idWork });

  const workflow = useScheduleWorkflow({ selectedServices: selectedServices });

  const isDisabled = statusSchedule
    ? disabledStatus.includes(statusSchedule)
    : false;

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

    if (selectedServices.length === 0) {
      showError("Selecione ao menos um serviço para criar a programação");
      return;
    }

    const formattedService = selectedServices.map((service) => ({
      id: service.id,
      idTeam: service.idTeam,
      prog: service.prog,
      additional: service.qtdeAdicional,
    }));

    const data = {
      schedule: validationResult.data,
      services: formattedService,
    };

    startTransition(async () => {
      try {
        const response = await newSaveSchedule(data);

        if (!response.success) {
          showError(response.error);
          return;
        }

        showSuccess(response.message, () => router.push(`/detalhes/${idWork}`));
      } catch {
        showError("Erro inesperado ao salvar a programação");
      }
    });
  }, [
    scheduleForm.formData,
    selectedServices,
    showError,
    showSuccess,
    router,
    idWork,
  ]);

  const clearScheduledServices = () => {
    setServicesAvaliable(servicesData);
    setSelectedServices([]);
  };

  // ─── Modo edição: delega ao layout específico ──────────────

  if (!isInsert && idSchedule !== null) {
    return (
      <EditSchedule
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
        isDisabled={isDisabled}
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
                scheduleStatus={statusSchedule}
              />

              <div className="h-[760px]">
                <NewServicesAvaliable
                  servicesData={servicesAvaliable}
                  setServicesData={setServicesAvaliable}
                  availableServices={serviceFilters.services}
                  operations={serviceFilters.operations}
                  points={serviceFilters.points}
                  setScheduledServices={setSelectedServices}
                  isInsert={isInsert}
                  teams={serviceTeams}
                  isDisabled={isDisabled}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>
            </div>
          </main>

          <div className="min-h-0 flex-1 w-full overflow-hidden">
            <ScheduleSidebar
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              clearScheduledServices={clearScheduledServices}
              servicesData={servicesData}
              setServicesData={setServicesAvaliable}
              selectedCount={workflow.selectedCount}
              canCreate={workflow.canCreate}
              isPending={isPending}
              onCancel={handleCancel}
              onSubmit={handleSaveSchedule}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
