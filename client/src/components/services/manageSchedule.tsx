"use client";

import { useCallback, useMemo, useState } from "react";

import { useExecutionServiceForm } from "@/hooks/useExecutionServicesForm";
import { useFeedback } from "@/hooks/useFeedback";
import { useScheduleForm } from "@/hooks/useScheduleForm";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";

import { ScheduleSection } from "./scheduleSection/scheduleSection";
import { ServicesSection } from "./servicesSection/servicesSection";
import { TeamModal } from "./servicesSection/teamsModal";

interface ManageScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: any[];
  serviceTeams: any[];
  scheduledServicesHistory: any[];
  serviceFilters: any;
  isInsert: boolean;
  options: any;
  idWork: number;
  idStatusWork: number;
  idSchedule: number | null;
}

export function ManageSchedule({
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
  const { showError, showSuccess } = useFeedback();
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [openTeamsModal, setOpenTeamsModal] = useState<boolean>(false);

  const dialogTitle = isInsert ? "Nova Programação" : "Editar Programação";

  const toggleTeamsModal = useCallback(() => {
    setOpenTeamsModal((prev) => !prev);
  }, []);

  const scheduleForm = useScheduleForm({
    data: scheduleData,
    options: options,
    idWork,
  });

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

  const { handleSubmit, isPending } = useScheduleSubmit({
    idWork: Number(idWork),
    onError: showError,
    onSuccess: (message) => {
      showSuccess(message);
    },
    formData: scheduleData,
    setFormErrors: scheduleForm.setFormErrors,
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full overflow-y-auto">
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-800">
        {dialogTitle}
      </h1>

      {/* Schedule Section */}
      <div className="w-full mb-8">
        <ScheduleSection
          idWork={Number(idWork)}
          idSchedule={Number(idSchedule)}
          isInsert={isInsert}
          options={options}
          scheduleForm={scheduleForm}
          statusWork={idStatusWork}
          onError={showError}
          setOpenTeamsModal={setOpenTeamsModal}
          isPending={isPending}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Services Section */}
      <div className="w-full pb-10 mb-10">
        <ServicesSection
          executionForm={executionForm}
          servicesData={servicesData}
          scheduledServicesData={scheduledServicesData}
          serviceFilters={serviceFilters}
          scheduledServicesHistory={scheduledServicesHistory}
          serviceContractData={serviceContractData}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          setOpenTeamsModal={setOpenTeamsModal}
          isInsert={isInsert}
          idSchedule={idSchedule}
          idWork={Number(idWork)}
          statusSchedule={scheduleData ? scheduleData.status_programacao : null}
          options={options}
          onError={showError}
          onSuccess={showSuccess}
        />
      </div>

      {openTeamsModal && (
        <TeamModal
          onClose={toggleTeamsModal}
          open={openTeamsModal}
          teams={serviceTeams}
          idSchedule={idSchedule ? Number(idSchedule) : null}
          selectedServices={selectedServices}
          scheduleData={
            idSchedule
              ? {
                  idWork,
                }
              : { ...scheduleForm.formData, idWork }
          }
          isInsert={isInsert}
        />
      )}
    </div>
  );
}
