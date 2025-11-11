"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { DeleteWork } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Button } from "@mui/material";

const cookies = new Cookies();

interface DeleteButtonProps {
  storageKey: string;
  id: number;
}

export function DeleteButton({ storageKey, id }: DeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>();
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await DeleteWork(storageKey, id);

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
      <Button
        disabled={isPending}
        onClick={handleClick}
        className="text-red-500 hover:underline"
      >
        Remover
      </Button>

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
