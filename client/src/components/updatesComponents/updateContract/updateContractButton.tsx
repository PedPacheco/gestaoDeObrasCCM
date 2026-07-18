"use client";

import { useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { InsertContract } from "@/actions/works";
import { useFeedback } from "@/hooks/useFeedback";

export function UpdateContractButton() {
  const { showError, showSuccess } = useFeedback();
  const [isPending, startTransition] = useTransition();

  const handleInsertContract = () => {
    startTransition(async () => {
      try {
        const storedData = localStorage.getItem("contracts");
        if (!storedData) return;

        const res = await InsertContract(JSON.parse(storedData));

        if (!res.success) {
          showError(res.error);
          return;
        }

        localStorage.removeItem("contracts");

        showSuccess("Empreitamento inserido com sucesso!", () =>
          window.location.reload(),
        );
      } catch (err: any) {
        showError(err.message);
      }
    });
  };

  return (
    <>
      <ButtonComponent
        onClick={handleInsertContract}
        text="Inserir datas de Empreitamento"
        disabled={isPending}
        styled="w-72"
      />
    </>
  );
}
