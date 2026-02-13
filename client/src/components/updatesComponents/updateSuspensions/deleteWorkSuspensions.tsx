"use client";

import { ButtonComponent } from "@/components/common/Button";
import { useFeedback } from "@/hooks/useFeedback";

export function DeleteSuspensionsButton() {
  const { showError, showSuccess } = useFeedback();

  const deleteSuspensions = () => {
    try {
      localStorage.removeItem("suspensions");

      showSuccess("Motivos das suspensões removidos", () =>
        window.location.reload(),
      );
    } catch (error: any) {
      showError(error);
    }
  };

  return (
    <>
      <ButtonComponent
        onClick={deleteSuspensions}
        text="Remover Motivos importados"
      />
    </>
  );
}
