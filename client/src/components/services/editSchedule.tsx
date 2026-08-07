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
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Button } from "@mui/material";

import { NewScheduleSection } from "./scheduleSection/newScheduleSection";
import { NewServicesAvaliable } from "./servicesSection/servicesAvaliable";
import { ScheduleSidebar } from "./scheduleSidebar/scheduleSidebar";
import { ScheduleTopbar } from "./scheduleTopbar";

import { ScheduledServices } from "./servicesSection/scheduledServices/scheduledServices";
import {
  ScheduledServicesHistoryData,
  ScheduleHistory,
} from "./servicesSection/scheduleHistory";
import { ButtonComponent } from "../common/Button";
import { TabsServices } from "./TabsServices";
import { ServiceContract } from "../addServiceAccordion/addServiceForm";
import { AddServiceAccordion } from "../addServiceAccordion/addServiceAccordion";
import { SERVICE_OPERATIONS } from "@/constants/services/services";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EditScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  materialsData: any[];
  serviceTeams: any[];
  scheduledServicesHistory: ScheduledServicesHistoryData[];
  options: any;
  idWork: number;
  idStatusWork: number;
  idSchedule: number;
  statusSchedule?: string;
  optionsToAddItem: {
    operation_description: string[];
    operation_number: string[];
    points: string[];
  };
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
  materialsData,
  serviceTeams,
  scheduledServicesHistory,
  options,
  idWork,
  idStatusWork,
  idSchedule,
  statusSchedule,
  optionsToAddItem,
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

  const isDisabled = statusSchedule ? statusSchedule === "Programado" : false;

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

  const todayIsOnOrAfterScheduleDate = useMemo(() => {
    if (!scheduleData?.data_prog) return false;

    const today = dayjs.utc().startOf("day");
    const scheduleDate = dayjs.utc(scheduleData.data_prog).startOf("day");

    return today.isSame(scheduleDate) || today.isAfter(scheduleDate);
  }, [scheduleData?.data_prog]);

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
              options={options}
              executionForm={executionForm}
              onError={showError}
              onSuccess={showSuccess}
              isDisabled={isDisabled}
              todayIsOnOrAfterScheduleDate={todayIsOnOrAfterScheduleDate}
            />
          )}

          {/* TAB: Adicionar serviços da lista disponível */}
          {activeTab === "available" && (
            <div className="grid h-full max-h-[90vh] grid-cols-1 lg:grid-cols-[1fr_35%]">
              {/* Conteúdo principal — scrollável */}
              <div className="min-h-0 overflow-y-auto p-5">
                <NewServicesAvaliable
                  servicesData={servicesAvaliable}
                  setServicesData={setServicesAvaliable}
                  setScheduledServices={setScheduledServices}
                  isInsert={false}
                  statusSchedule={statusSchedule}
                  teams={serviceTeams}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>

              {/* Sidebar — 30% da largura, altura total */}
              <div className="flex min-h-0 h-full flex-col overflow-hidden pr-4 pt-5">
                <div className="grid grid-cols-1 px-2 gap-2 mb-2">
                  <AddServiceAccordion
                    idWork={Number(idWork)}
                    title="Adicionar novo serviço"
                    contracts={serviceContractData}
                    options={optionsToAddItem}
                    type="serviço"
                  />

                  <AddServiceAccordion
                    idWork={Number(idWork)}
                    title="Adicionar novo material"
                    contracts={materialsData}
                    options={optionsToAddItem}
                    type="material"
                  />
                </div>
                <div className="min-h-0 flex-1 w-full overflow-hidden">
                  <ScheduleSidebar
                    selectedServices={scheduledServices}
                    setSelectedServices={setScheduledServices}
                    clearScheduledServices={clearScheduledServices}
                    setServicesData={setServicesAvaliable}
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
