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

import { NewServicesAvaliable } from "./servicesSection/servicesAvaliable";
import { PlusIcon } from "@heroicons/react/20/solid";
import { AddServiceForm, ServiceContract } from "../common/addServiceForm";
import { AddServiceAccordion } from "../feasibility/addServiceAccordion";
import { SERVICE_OPERATIONS } from "@/constants/services/services";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ManageScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  materialsData: any[];
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
// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function NewManageSchedule({
  scheduleData,
  scheduledServicesData,
  servicesData,
  serviceContractData,
  materialsData,
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

  const isDisabled = statusSchedule ? statusSchedule === "Programado" : false;

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
        materialsData={materialsData}
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

        <div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-[1fr_30%]">
          <main className="flex flex-col items-center gap-5 overflow-y-auto py-4">
            <div className="flex w-full max-w-[95%] flex-col gap-5">
              <NewScheduleSection
                isInsert={isInsert}
                options={options}
                scheduleForm={scheduleForm}
                statusWork={idStatusWork}
                scheduleStatus={statusSchedule}
              />

              <div className="h-[620px] 2xl:h-full max-h-[90vh]">
                <NewServicesAvaliable
                  servicesData={servicesAvaliable}
                  setServicesData={setServicesAvaliable}
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

          <div className="flex min-h-0 h-full flex-col overflow-hidden pr-4 pt-2">
            <div className="grid grid-cols-1 px-2 gap-2 mb-2">
              <AddServiceAccordion
                idWork={Number(idWork)}
                title="Adicionar novo serviço"
                contracts={serviceContractData}
                operations={SERVICE_OPERATIONS}
                points={serviceFilters.points}
                type="serviço"
              />

              <AddServiceAccordion
                idWork={Number(idWork)}
                title="Adicionar novo material"
                contracts={materialsData}
                operations={SERVICE_OPERATIONS}
                points={serviceFilters.points}
                type="material"
              />
            </div>

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
    </div>
  );
}
