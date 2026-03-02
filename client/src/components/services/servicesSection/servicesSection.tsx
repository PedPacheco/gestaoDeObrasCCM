import { useRouter } from "next/navigation";

import { addService, cancelScheduleServices } from "@/actions/services";

import { AddServiceForm, ServiceContract } from "./addServiceForm";
import { ScheduledServices } from "./scheduledServices/scheduledServices";
import { ScheduleHistory } from "./scheduleHistory";
import { ServicesAvaliable } from "./servicesAvailable";
import { useState, useTransition } from "react";

interface ServicesSectionProps {
  executionForm: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  scheduledServicesHistory: any[];
  serviceFilters: any;
  selectedServices: number[];
  setSelectedServices: (services: number[]) => void;
  setOpenTeamsModal: (team: boolean) => void;
  isInsert: boolean;
  idSchedule: number | null;
  idWork: number;
  statusSchedule: string | null;
  options: {
    restricao: Array<{ id: number; restricao: string }>;
  };
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
}

export function ServicesSection({
  executionForm,
  servicesData,
  scheduledServicesData,
  serviceContractData,
  serviceFilters,
  scheduledServicesHistory,
  selectedServices,
  setSelectedServices,
  setOpenTeamsModal,
  isInsert,
  idSchedule,
  idWork,
  statusSchedule,
  options,
  onSuccess,
  onError,
}: ServicesSectionProps) {
  const router = useRouter();

  const [openConfirmationModal, setOpenConfirmationModal] =
    useState<boolean>(false);

  const [isPending, startTransition] = useTransition();

  const cancelServices = async (id: number) => {
    setOpenConfirmationModal(false);
    const response = await cancelScheduleServices(id);

    if (!response.success) {
      onError(response.error);
      return;
    }

    startTransition(() => {
      router.refresh();
    });

    if (response.message) {
      onSuccess(response.message);
    }

    localStorage.removeItem(`scheduled-services-validation:${idSchedule}`);
  };

  const disabledStatus = ["Parcial", "Concluído", "Cancelado"];

  const isDisabledButton = statusSchedule
    ? disabledStatus.includes(statusSchedule)
    : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT SIDE — tables */}
      <div className="lg:col-span-8 space-y-6">
        {/* Serviços Disponíveis */}
        <ServicesAvaliable
          servicesData={servicesData}
          availableServices={serviceFilters.services}
          operations={serviceFilters.operations}
          points={serviceFilters.points}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          setOpenTeamsModal={setOpenTeamsModal}
          isInsert={isInsert}
          isDisabled={isDisabledButton}
          onError={onError}
          onSuccess={onSuccess}
        />

        {/* Serviços Programados */}
        {!isInsert && (
          <ScheduledServices
            scheduledServicesData={scheduledServicesData}
            scheduledServicesHistory={scheduledServicesHistory}
            services={serviceFilters.services}
            operations={serviceFilters.operations}
            points={serviceFilters.points}
            options={options}
            executionForm={executionForm}
            onError={onError}
            onSuccess={onSuccess}
            isDisabled={isDisabledButton}
          />
        )}
      </div>

      {/* RIGHT SIDE — Histórico + Adicionar */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Adicionar Serviços */}
        <AddServiceForm
          idWork={idWork}
          serviceContractData={serviceContractData}
          operations={serviceFilters.operations}
          points={serviceFilters.points}
          onSubmit={async (data) => {
            const response = await addService(data);

            if (!response.success) {
              onError(response.error);
              return;
            }

            onSuccess("Serviço adicionado", () => router.refresh());
          }}
        />

        {/* Histórico */}
        {!isInsert && (
          <ScheduleHistory
            cancelServices={cancelServices}
            idSchedule={idSchedule}
            scheduledServicesHistory={scheduledServicesHistory}
            isDisabled={isDisabledButton}
            isPending={isPending}
            openConfirmationModal={openConfirmationModal}
            setOpenConfirmationModal={setOpenConfirmationModal}
          />
        )}
      </div>
    </div>
  );
}
