"use client";

import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useTransition } from "react";

import { cancelScheduleServices } from "@/actions/services";
import { ServiceContract } from "./addServiceForm";
import { NewServicesAvaliable } from "./servicesAvaliable";

interface ServicesSectionProps {
  servicesData: any[];
  serviceFilters: any;
  setScheduledServices: Dispatch<SetStateAction<any[]>>;
  isInsert: boolean;
  idSchedule: number | null;
  statusSchedule: string | null;
  teams: any[];
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
}

export function NewServicesSection({
  servicesData,
  serviceFilters,
  setScheduledServices,
  isInsert,
  idSchedule,
  statusSchedule,
  teams,
  onSuccess,
  onError,
}: ServicesSectionProps) {
  const router = useRouter();
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const disabledStatus = ["Parcial", "Concluído", "Cancelado"];
  const isDisabledButton = statusSchedule
    ? disabledStatus.includes(statusSchedule)
    : false;

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODO INSERÇÃO: apenas a tabela de serviços disponíveis
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="flex h-[760px] overflow-hidden">
      <NewServicesAvaliable
        servicesData={servicesData}
        availableServices={serviceFilters.services}
        operations={serviceFilters.operations}
        points={serviceFilters.points}
        setScheduledServices={setScheduledServices}
        isInsert={isInsert}
        teams={teams}
        isDisabled={isDisabledButton}
        onError={onError}
        onSuccess={onSuccess}
      />
    </div>
  );
}
