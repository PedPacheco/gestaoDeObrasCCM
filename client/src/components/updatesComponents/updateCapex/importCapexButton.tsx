"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";

export function ImportCapexButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/import/capex", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.message || "Erro ao importar arquivo");
        }

        setSuccess("Arquivo enviado e processamento iniciado com sucesso");
        setOpenModal(true);

        resetFileInput();
        router.refresh();
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <ButtonComponent
        onClick={handleClick}
        startIcon={<DocumentArrowDownIcon width={25} height={25} />}
        text="Importar Arquivo CN52N"
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
