"use client";

import { ButtonComponent } from "@/components/common/Button";
import { useD5NoteEdit } from "@/hooks/d5Notes/useD5Edit";

export function SaveD5NoteButton() {
  const { save, dirty, isSaving, readOnly } = useD5NoteEdit();

  if (readOnly) return null;

  return (
    <ButtonComponent
      text={isSaving ? "Salvando..." : "Salvar alterações"}
      disabled={!dirty || isSaving}
      onClick={save}
      styled="px-4 py-3 md:px-6 md:py-4"
    />
  );
}
