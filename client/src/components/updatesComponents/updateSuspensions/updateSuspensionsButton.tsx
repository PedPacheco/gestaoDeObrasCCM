"use client";

import { useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { InsertContract, SuspensionsWorks } from "@/actions/works";

export function UpdateSuspensionsButton() {
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInsertContract = () => {
    startTransition(async () => {
      try {
        const storedData = localStorage.getItem("suspensions");
        if (!storedData) return;

        const res = await SuspensionsWorks(JSON.parse(storedData));

        if (!res.success) {
          setError(res.error);
          return;
        }

        localStorage.removeItem("suspensions");

        setSuccess("Obras foram suspensas com sucesso!");
        setOpenModal(true);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const toggleModal = () => {
    setOpenModal((prev) => !prev);
    window.location.reload();
  };

  return (
    <>
      <ButtonComponent
        onClick={handleInsertContract}
        text="Suspender Obras"
        disabled={isPending}
        styled="w-72 ml-2 lg:ml-0"
      />

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="font-semibold text-xl">{success}</span>
      </ModalComponent>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
