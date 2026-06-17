"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { scheduleServices } from "@/actions/services";
import { useScheduleForm } from "@/hooks/details/useScheduleForm";
import { useScheduleWorkflow } from "@/hooks/details/useScheduleWorkflow";
import { useExecutionServiceForm } from "@/hooks/useExecutionServicesForm";
import { useFeedback } from "@/hooks/useFeedback";
import { useScheduleSubmit } from "@/hooks/details/useScheduleSubmit";
import { schedulesSchema } from "@/validations/validationSchedules";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Button, Tab, Tabs } from "@mui/material";

import { NewScheduleSection } from "./scheduleSection/newScheduleSection";
import { NewServicesAvaliable } from "./servicesSection/servicesAvaliable";
import { ScheduleSidebar } from "./scheduleSidebar/scheduleSidebar";
import { ScheduleTopbar } from "./scheduleTopbar";
import {
  AddServiceForm,
  ServiceContract,
} from "./servicesSection/addServiceForm";
import { ScheduledServices } from "./servicesSection/scheduledServices/scheduledServices";
import { ScheduleHistory } from "./servicesSection/scheduleHistory";
import { ButtonComponent } from "../common/Button";
import { TabsServices } from "./TabsServices";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EditScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  serviceTeams: any[];
  scheduledServicesHistory: any[];
  serviceFilters: any;
  options: any;
  idWork: number;
  idStatusWork: number;
  idSchedule: number;
  isDisabled: boolean;
}

export type TabId = "scheduled" | "available" | "add" | "history";

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function EditSchedule({
  scheduleData,
  scheduledServicesData,
  servicesData,
  serviceContractData,
  serviceFilters,
  serviceTeams,
  scheduledServicesHistory,
  options,
  idWork,
  idStatusWork,
  idSchedule,
  isDisabled,
}: EditScheduleProps) {
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<TabId>("scheduled");
  const [scheduledServices, setScheduledServices] = useState<any[]>([]);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

  const [servicesAvaliable, setServicesAvaliable] = useState<any[]>(
    servicesData || [],
  );

  const scheduleForm = useScheduleForm({ data: scheduleData, options, idWork });

  const executionFormData = useMemo(
    () => ({
      idWork,
      idSchedule,
      idExecutionRestriction: 1,
      serviceType: scheduleForm.formData.serviceType,
      finishTime: scheduleForm.formData.finishTime,
    }),
    [
      idWork,
      idSchedule,
      scheduleForm.formData.finishTime,
      scheduleForm.formData.serviceType,
    ],
  );

  const executionForm = useExecutionServiceForm({
    enabled: true,
    data: executionFormData,
  });

  const { handleSubmit, isPending: isSubmitPending } = useScheduleSubmit({
    idWork: Number(idWork),
    onError: showError,
    onSuccess: (message) => showSuccess(message),
    formData: scheduleData,
  });

  const workflow = useScheduleWorkflow({ selectedServices: scheduledServices });

  // ── Handlers ──────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    router.replace(`/detalhes/${idWork}`);
    router.refresh();
  }, [router, idWork]);

  const handleScheduledServices = useCallback(async () => {
    const formattedService = scheduledServices.map((service) => ({
      id: service.id,
      idTeam: service.idTeam,
      idSchedule,
      prog: service.prog,
      additional: service.qtdeAdicional,
    }));

    const response = await scheduleServices(idWork, formattedService);

    if (!response.success) {
      showError(response.error);
      return;
    }

    setScheduledServices([]);
    showSuccess("DEU CERTO", () => router.refresh());
  }, [scheduledServices, idWork, showSuccess, idSchedule, showError, router]);

  const handleSaveSchedule = () => {
    const validationResult = schedulesSchema().safeParse(scheduleForm.formData);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      scheduleForm.setFormErrors(fieldErrors);
      showError("Erro ao salvar programação");

      return;
    }

    scheduleForm.setFormErrors({});

    const data = {
      id: idSchedule,
      ...validationResult.data,
    };

    handleSubmit(data);
  };

  const clearScheduledServices = () => {
    setServicesAvaliable(servicesData);
    setScheduledServices([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex  w-full flex-col bg-gray-50 overflow-y-auto">
      <ScheduleTopbar title="Editar Programação" idWork={idWork} />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* ── Schedule form ──────────────────────────────────── */}
        <div className="border-b border-gray-200 bg-white px-6">
          <NewScheduleSection
            isInsert={false}
            options={options}
            scheduleForm={scheduleForm}
            statusWork={idStatusWork}
          />
        </div>

        <div className="flex justify-end gap-4 bg-white border-b border-gray-200 pr-10 pb-4">
          {/* Ações principais */}
          <div className="flex shrink-0 items-center gap-2">
            <ButtonComponent
              text={isSubmitPending ? "Salvando..." : "Salvar programação"}
              onClick={handleSaveSchedule}
              disabled={isSubmitPending}
              styled="!py-[5px] !px-[15px]"
              startIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
            />

            <Button
              variant="outlined"
              startIcon={<XMarkIcon className="h-4 w-4" />}
              onClick={handleCancel}
              disabled={isSubmitPending}
              sx={{
                textTransform: "none",
                fontSize: 16,
                height: 48,
              }}
            >
              CANCELAR
            </Button>
          </div>
        </div>

        {/* ── Tab navigation ────────────────────────────────────── */}
        <TabsServices
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scheduledServicesHistoryLength={scheduledServicesHistory.length}
          scheduledServicesLength={scheduledServicesData.length}
          servicesDataLength={servicesData.length}
        />

        {/* ── Tab panels ────────────────────────────────────────── */}
        <div
          className={
            activeTab === "available"
              ? "min-w-0"
              : "min-w-0 overflow-x-auto p-6"
          }
        >
          {/* TAB: Serviços programados */}
          {activeTab === "scheduled" && (
            <ScheduledServices
              scheduledServicesData={scheduledServicesData}
              scheduledServicesHistory={scheduledServicesHistory}
              services={serviceFilters.services}
              operations={serviceFilters.operations}
              points={serviceFilters.points}
              options={options}
              executionForm={executionForm}
              onError={showError}
              onSuccess={showSuccess}
              isDisabled={isDisabled}
            />
          )}

          {/* TAB: Adicionar serviços da lista disponível */}
          {activeTab === "available" && (
            <div className="flex flex-1 h-[820px] justify-between items-center">
              {/* Conteúdo principal — scrollável */}
              <div className="flex-1 p-5 h-full max-w-[70%] 2xl:max-w-full">
                <NewServicesAvaliable
                  servicesData={servicesAvaliable}
                  setServicesData={setServicesAvaliable}
                  availableServices={serviceFilters.services}
                  operations={serviceFilters.operations}
                  points={serviceFilters.points}
                  setScheduledServices={setScheduledServices}
                  isInsert={false}
                  isDisabled={isDisabled}
                  teams={serviceTeams}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>

              {/* Sidebar — altura total restante, fixa à direita */}
              <div className="flex h-full flex-col items-center overflow-hidden pr-4 pt-5">
                <div className="mx-auto max-w-xl my-3 w-full shrink-0">
                  <div className="mb-4">
                    <h2 className="text-[14px] font-medium text-gray-800">
                      Adicionar novo serviço
                    </h2>
                    <p className="mt-0.5 text-[12px] text-gray-500">
                      Busque um serviço no contrato e defina ponto, operação e
                      quantidade planejada.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <AddServiceForm
                      idWork={idWork}
                      serviceContractData={serviceContractData}
                      operations={serviceFilters.operations}
                      points={serviceFilters.points}
                      onSubmit={async (data) => {
                        const { addService } =
                          await import("@/actions/services");
                        const response = await addService(data);
                        if (!response.success) {
                          showError(response.error);
                          return;
                        }
                        showSuccess("Serviço adicionado", () => {
                          startTransition(() => router.refresh());
                          setActiveTab("scheduled");
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1 w-full overflow-hidden">
                  <ScheduleSidebar
                    selectedServices={scheduledServices}
                    setSelectedServices={setScheduledServices}
                    clearScheduledServices={clearScheduledServices}
                    setServicesData={setServicesAvaliable}
                    servicesData={servicesData}
                    selectedCount={workflow.selectedCount}
                    canCreate={workflow.canCreate}
                    isPending={isPending}
                    onCancel={handleCancel}
                    onSubmit={handleScheduledServices}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Histórico */}
          {activeTab === "history" && (
            <ScheduleHistory
              cancelServices={async (id: number) => {
                setOpenConfirmationModal(false);
                const { cancelScheduleServices } =
                  await import("@/actions/services");
                const response = await cancelScheduleServices(id);

                if (!response.success) {
                  showError(response.error);
                  return;
                }

                startTransition(() => router.refresh());

                if (response.message) {
                  showSuccess(response.message);
                }

                localStorage.removeItem(
                  `scheduled-services-validation:${idSchedule}`,
                );
              }}
              idSchedule={idSchedule}
              scheduledServicesHistory={scheduledServicesHistory}
              isDisabled={isDisabled}
              isPending={isPending}
              openConfirmationModal={openConfirmationModal}
              setOpenConfirmationModal={setOpenConfirmationModal}
            />
          )}
        </div>
      </main>
    </div>
  );
}
