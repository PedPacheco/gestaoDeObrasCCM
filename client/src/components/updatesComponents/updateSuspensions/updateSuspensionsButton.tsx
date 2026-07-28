"use client";

import { useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { SuspensionsWorks } from "@/actions/works";
import { useFeedback } from "@/hooks/useFeedback";

export function UpdateSuspensionsButton() {
  const { showError, showSuccess } = useFeedback();
  const [isPending, startTransition] = useTransition();

  const handleInsertContract = () => {
    startTransition(async () => {
      try {
        const storedData = localStorage.getItem("suspensions");
        if (!storedData) return;

        const res = await SuspensionsWorks(JSON.parse(storedData));

        if (!res.success) {
          showError(res.error);
          return;
        }

        localStorage.removeItem("suspensions");

        showSuccess("Obras foram suspensas com sucesso!", () =>
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
        text="Suspender Obras"
        disabled={isPending}
        styled="w-72 ml-2 lg:ml-0"
      />
    </>
  );
}
