import { useRouter } from "next/navigation";

import { addService, cancelScheduleServices } from "@/actions/services";

import { AddServiceForm, ServiceContract } from "./addServiceForm";
import { ScheduledServices } from "./scheduledServices/scheduledServices";
import { ScheduleHistory } from "./scheduleHistory";
import { ServicesAvaliable } from "./servicesAvailable";

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
  options,
  onSuccess,
  onError,
}: ServicesSectionProps) {
  const router = useRouter();

  const cancelServices = async (id: number) => {
    const response = await cancelScheduleServices(id);

    if (!response.success) {
      onError(response.error);
      return;
    }

    if (response.message) {
      onSuccess(response.message, () => router.refresh());
    }

    localStorage.removeItem(`scheduled-services-validation:${idSchedule}`);
  };

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
          />
        )}
      </div>
    </div>
  );
}
