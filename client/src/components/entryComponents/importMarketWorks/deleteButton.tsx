"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DeleteWork } from "@/actions/works";

const cookies = new Cookies();

interface DeleteButtonProps {
  storageKey: string;
}

export function DeleteButton({ storageKey }: DeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>();
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await DeleteWork(storageKey);

        if (!res.success) {
          setError(res.error);
          return;
        }

        setSuccess(res.message);
        setOpenModal(true);

        setSuccess(res.message);
        localStorage.removeItem(storageKey);
        cookies.remove(storageKey);

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      <ButtonComponent
        disabled={isPending}
        text={getButtonContent(isPending, "Limpar filtros")}
        onClick={handleClick}
        styled="w-48"
      />

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className=" font-semibold text-xl">{success}</span>
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
