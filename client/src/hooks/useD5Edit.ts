import {
  D5NoteEditContext,
  D5NoteEditContextValue,
} from "@/contexts/d5NoteEditContext";
import { useContext } from "react";

export function useD5NoteEdit(): D5NoteEditContextValue {
  const context = useContext(D5NoteEditContext);

  if (!context) {
    throw new Error(
      "useD5NoteEdit deve ser usado dentro de D5NoteEditProvider",
    );
  }

  return context;
}
