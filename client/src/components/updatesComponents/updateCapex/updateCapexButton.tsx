"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { UpdateCapex } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";

export function UpdateCapexButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleUpdateCapex = () => {
    startTransition(async () => {
      try {
        await UpdateCapex();

        setSuccess("Capex e M.O atualizados com sucesso");
        setOpenModal(true);

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      <ButtonComponent
        onClick={handleUpdateCapex}
        text="Atualizar Capex - MO"
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
