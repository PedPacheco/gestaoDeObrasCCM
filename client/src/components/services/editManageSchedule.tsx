"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { scheduleServices } from "@/actions/services";
import { useScheduleForm } from "@/hooks/details/useScheduleForm";
import { useScheduleWorkflow } from "@/hooks/details/useScheduleWorkflow";
import { useExecutionServiceForm } from "@/hooks/useExecutionServicesForm";
import { useFeedback } from "@/hooks/useFeedback";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import { schedulesSchema } from "@/validations/validationSchedules";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Button, Tab, Tabs } from "@mui/material";

import { NewScheduleSection } from "./newScheduleSection/newScheduleSection";
import { NewServicesAvaliable } from "./servicesSection/servicesAvaliable";
import { ScheduleSidebar } from "./scheduleSidebar";
import { ScheduleTopbar } from "./scheduleTopbar";
import {
  AddServiceForm,
  ServiceContract,
} from "./servicesSection/addServiceForm";
import { ScheduledServices } from "./servicesSection/scheduledServices/scheduledServices";
import { ScheduleHistory } from "./servicesSection/scheduleHistory";
import { ButtonComponent } from "../common/Button";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EditManageScheduleProps {
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
}

type TabId = "scheduled" | "available" | "add" | "history";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function EditManageSchedule({
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
}: EditManageScheduleProps) {
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<TabId>("scheduled");
  const [scheduledServices, setScheduledServices] = useState<any[]>([]);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

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

  const disabledStatus = ["Parcial", "Concluído", "Cancelado"];
  const isDisabled = scheduleData?.status_programacao
    ? disabledStatus.includes(scheduleData.status_programacao)
    : false;

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
      // scheduleForm.setFormErrors(fieldErrors);
      showError("Erro ao salvar programação");

      return;
    }

    const data = {
      id: idSchedule,
      ...validationResult.data,
    };

    handleSubmit(data);
  };

  // ── Tab config ─────────────────────────────────────────────

  const tabs: TabConfig[] = [
    {
      id: "scheduled",
      label: "Serviços programados",
      icon: <CheckCircleIcon className="h-4 w-4" />,
      badge: scheduledServicesData.length,
    },
    {
      id: "available",
      label: "Serviços disponíveis",
      icon: <PlusIcon className="h-4 w-4" />,
      badge: servicesData.length,
    },
    {
      id: "history",
      label: "Histórico",
      icon: <ClockIcon className="h-4 w-4" />,
      badge: scheduledServicesHistory.length,
    },
  ];

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

            <ButtonComponent
              text={isSubmitPending ? "Salvando..." : "Salvar programação"}
              onClick={handleSaveSchedule}
              disabled={isSubmitPending}
              styled="!py-[5px] !px-[15px]"
              startIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* ── Tab navigation ────────────────────────────────────── */}
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6">
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v as TabId)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: 13,
                minHeight: 44,
                paddingX: 2,
                color: "#6b7280",
                fontWeight: 400,
              },
              "& .Mui-selected": {
                color: "#378ADD !important",
                fontWeight: 500,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#378ADD",
                height: 2,
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <div className="flex items-center gap-1.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                          activeTab === tab.id
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>

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
            <div className="flex h-[860px] overflow-hidden">
              {/* Conteúdo principal — scrollável */}
              <div className="flex-1 p-6 h-full">
                <NewServicesAvaliable
                  servicesData={servicesData}
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
              <div className="flex h-full flex-col items-center overflow-hidden pr-4">
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
