"use client";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import {
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { boolean } from "zod";

export function DeleteSuspensionsButton() {
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const deleteSuspensions = () => {
    try {
      localStorage.removeItem("suspensions");

      setSuccess("Motivos das suspensões removidos");
      setOpenModal(true);
    } catch (error: any) {
      setError(error);
    }
  };

  const toggleModal = () => {
    setOpenModal((prev) => !prev);
    window.location.reload();
  };

  return (
    <>
      <ButtonComponent
        onClick={deleteSuspensions}
        text="Remover Motivos importados"
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
