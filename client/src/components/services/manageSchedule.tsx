"use client";

import { ServicesSection } from "./servicesSection/servicesSection";
import { ScheduleSection } from "./scheduleSection/scheduleSection";
import { useCallback, useEffect, useState } from "react";
import ErrorModal from "../common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ModalComponent from "../common/Modal";
import { TeamModal } from "./servicesSection/teamsModal";
import { useScheduleSubmitV2 } from "@/hooks/useScheduleSubmitV2";
import { useScheduleFormV2 } from "@/hooks/useScheduleFormV2";
import { useUser } from "@/contexts/userContext";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingExecutionReport, setEditingExecutionReport] = useState<any>();

  const [prog, setProg] = useState<number>(0);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [openTeamsModal, setOpenTeamsModal] = useState<boolean>(false);

  const dialogTitle = isInsert ? "Nova Programação" : "Editar Programação";

  const toggleModal = useCallback(() => {
    setOpenModal((prev) => !prev);
  }, []);

  const toggleTeamsModal = useCallback(() => {
    setOpenTeamsModal((prev) => !prev);
  }, []);

  useEffect(() => {
    const totalPlan = servicesData.reduce(
      (acc, item) => acc + item.qtdePlanejada,
      0,
    );
    const selectedPlan = selectedServices.reduce(
      (acc, item) => acc + item.prog,
      0,
    );

    setProg((selectedPlan / totalPlan) * 100);
  }, [selectedServices, servicesData]);

  const scheduleForm = useScheduleFormV2({
    data: scheduleData,
    executionData: editingExecutionReport,
    options,
    prog,
  });

  const { handleSubmit, isPending } = useScheduleSubmitV2({
    formData: scheduleForm.formData,
    idWork: Number(idWork),
    onError: setError,
    onSuccess: (message) => {
      setSuccess(message);
      setOpenModal(true);
    },
    onModalOpen: setOpenModal,
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
          onError={setError}
          setOpenTeamsModal={setOpenTeamsModal}
          prog={prog}
          isPending={isPending}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Services Section */}
      <div className="w-full pb-10 mb-10">
        <ServicesSection
          servicesData={servicesData}
          scheduledServicesData={scheduledServicesData}
          serviceFilters={serviceFilters}
          scheduledServicesHistory={scheduledServicesHistory}
          serviceContractData={serviceContractData}
          serviceTeams={serviceTeams}
          idScheduleExisting={idSchedule}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          setOpenTeamsModal={setOpenTeamsModal}
          isInsert={isInsert}
          idSchedule={idSchedule}
        />
      </div>

      {openTeamsModal && (
        <TeamModal
          onClose={toggleTeamsModal}
          open={openTeamsModal}
          teams={serviceTeams}
          idSchedule={idSchedule ? Number(idSchedule) : null}
          selectedServices={selectedServices}
          scheduleData={{
            ...scheduleForm.formData,
            idWork: idWork,
          }}
          prog={prog}
          isInsert={isInsert}
        />
      )}

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
          {success}
        </span>
      </ModalComponent>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
