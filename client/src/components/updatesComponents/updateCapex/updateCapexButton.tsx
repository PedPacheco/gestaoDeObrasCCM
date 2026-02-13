"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { UpdateCapex } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";

import { useFeedback } from "@/hooks/useFeedback";

export function UpdateCapexButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { showError, showSuccess } = useFeedback();

  const handleUpdateCapex = () => {
    startTransition(async () => {
      try {
        await UpdateCapex();

        showSuccess("Capex e M.O atualizados com sucesso");

        router.refresh();
      } catch (err: any) {
        showError(err.message);
      }
    });
  };

  return (
    <>
      <ButtonComponent
        onClick={handleUpdateCapex}
        text="Atualizar Capex/M.O"
        disabled={isPending}
        styled="w-72"
      />
    </>
  );
}
