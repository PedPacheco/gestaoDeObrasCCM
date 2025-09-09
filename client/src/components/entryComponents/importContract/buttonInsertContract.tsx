"use client";

import { useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { InsertContract } from "@/actions/works";

export function ButtonInsertContract() {
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInsertContract = () => {
    startTransition(async () => {
      try {
        const storedData = localStorage.getItem("contracts");
        if (!storedData) return;

        const res = await InsertContract(JSON.parse(storedData));

        if (!res.success) {
          setError(res.error);
          return;
        }

        setSuccess("Empreitamento inserido com sucesso!");
        setOpenModal(true);
        localStorage.removeItem("contracts");
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
        text="Inserir datas de Empreitamento"
        disabled={isPending}
        styled="w-72"
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
