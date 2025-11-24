"use client";

import { ServicesSection } from "./servicesSection/servicesSection";
import { ScheduleSection } from "./scheduleSection/scheduleSection";
import { useCallback, useState } from "react";
import ErrorModal from "../common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ModalComponent from "../common/Modal";

interface ManageScheduleProps {
  scheduleData: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: any[];
  serviceTeams: any[];
  serviceFilters: any;
  isInsert: boolean;
  options: any;
  idWork: string;
  idStatusWork: any;
  idSchedule: string | null;
}

export function ManageSchedule({
  scheduleData,
  scheduledServicesData,
  servicesData,
  serviceContractData,
  serviceFilters,
  serviceTeams,
  isInsert,
  options,
  idWork,
  idStatusWork,
  idSchedule,
}: ManageScheduleProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [idScheduleExisting, setIdScheduleExisting] = useState<string | null>(
    idSchedule
  );

  const dialogTitle = isInsert ? "Nova Programação" : "Editar Programação";

  const toggleModal = useCallback(() => {
    setOpenModal((prev) => !prev);
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-800">
        {dialogTitle}
      </h1>

      {/* Schedule Section */}
      <div className="w-full mb-8">
        <ScheduleSection
          idWork={Number(idWork)}
          isInsert={isInsert}
          options={options}
          scheduleData={scheduleData}
          statusWork={idStatusWork}
          onModalOpen={setOpenModal}
          onError={setError}
          onSuccess={(message) => {
            setSuccess(message);
            setOpenModal(true);
          }}
          onIdScheduleExisting={setIdScheduleExisting}
        />
      </div>

      {/* Services Section */}
      <div className="w-full pb-10">
        {(!isInsert || idScheduleExisting) && (
          <ServicesSection
            servicesData={servicesData}
            scheduledServicesData={scheduledServicesData}
            serviceFilters={serviceFilters}
            serviceContractData={serviceContractData}
            serviceTeams={serviceTeams}
            isInsert={isInsert}
            idScheduleExisting={idScheduleExisting}
          />
        )}
      </div>

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
