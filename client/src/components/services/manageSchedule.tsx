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
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const scheduleForm = useScheduleForm({ data: scheduleData, options, idWork });

  const workflow = useScheduleWorkflow({ selectedServices: selectedServices });

  const isDisabled = statusSchedule ? statusSchedule === "PROGRAMADO" : false;

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

          <div className="flex min-h-0 h-full flex-col overflow-hidden pr-4 pt-2">
            <div className="mb-3 px-4 w-full shrink-0">
              <button
                onClick={() => setIsServiceFormOpen((prev) => !prev)}
                className={`
                  group flex w-full items-center justify-between
                  rounded-xl border px-5 py-3
                  text-sm font-semibold transition-all duration-200
                  ${
                    isServiceFormOpen
                      ? "border-[#53FF75] text-[#53FF75]"
                      : "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-[#A4D65E]/50 hover:shadow-md"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <PlusIcon
                    className={`
                      w-5 h-5 transition-transform duration-300
                      ${isServiceFormOpen ? "rotate-45 text-[#5A8A1E]" : "text-[#A4D65E]"}
                    `}
                  />
                  Adicionar novo serviço
                </span>

                <span
                  className={`
                    text-xs font-normal transition-colors
                    ${isServiceFormOpen ? "text-[#5A8A1E]/60" : "text-gray-400"}
                  `}
                >
                  {isServiceFormOpen ? "Fechar" : "Expandir"}
                </span>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${
                    isServiceFormOpen
                      ? "mt-3 max-h-[600px] opacity-100"
                      : "max-h-0 opacity-0"
                  }
                `}
              >
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm w-full">
                  <AddServiceForm
                    idWork={idWork}
                    serviceContractData={serviceContractData}
                    operations={serviceFilters.operations}
                    points={serviceFilters.points}
                    onSubmit={async (data) => {
                      const { addService } = await import("@/actions/services");
                      const response = await addService(data);
                      if (!response.success) {
                        showError(response.error);
                        return;
                      }
                      showSuccess("Serviço adicionado", () => {
                        startTransition(() => router.refresh());
                      });
                    }}
                  />
                </div>
              </div>
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
