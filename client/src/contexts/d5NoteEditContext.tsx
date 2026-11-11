"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import { updateD5NoteAction } from "@/actions/d5Notes";

export interface UpdateD5NotePayload {
  partnerId?: number;
  statusId?: number;
  observation?: string;
}

export interface D5NoteEditableForm {
  id_parceira: string;
  id_status: string;
  observacao: string;
}

type InitialValues = {
  id_parceira?: string | number | null;
  id_status?: string | null;
  observacao?: string | null;
};

export interface D5NoteEditContextValue {
  form: D5NoteEditableForm;
  setField: <K extends keyof D5NoteEditableForm>(
    field: K,
    value: D5NoteEditableForm[K],
  ) => void;
  dirty: boolean;
  isSaving: boolean;
  readOnly: boolean;
  save: () => void;
}

export const D5NoteEditContext = createContext<D5NoteEditContextValue | null>(
  null,
);

/** Normaliza os valores vindos da API (id pode ser number, campos podem ser null). */
function normalize(values: InitialValues): D5NoteEditableForm {
  return {
    id_parceira:
      values.id_parceira === null || values.id_parceira === undefined
        ? ""
        : String(values.id_parceira),
    id_status: values.id_status ?? "",
    observacao: values.observacao ?? "",
  };
}

/** Envia apenas os campos que mudaram em relação ao último estado salvo. */
function buildPayload(
  baseline: D5NoteEditableForm,
  current: D5NoteEditableForm,
): UpdateD5NotePayload {
  const payload: UpdateD5NotePayload = {};

  if (current.id_parceira !== baseline.id_parceira) {
    payload.partnerId = Number(current.id_parceira);
  }
  if (current.id_status !== baseline.id_status) {
    payload.statusId = Number(current.id_status);
  }
  if (current.observacao !== baseline.observacao) {
    payload.observation = current.observacao;
  }

  return payload;
}

interface D5NoteEditProviderProps {
  d5NoteId: number;
  initial: InitialValues;
  children: ReactNode;
}

export function D5NoteEditProvider({
  d5NoteId,
  initial,
  children,
}: D5NoteEditProviderProps) {
  const router = useRouter();
  const { permissions } = useUser();
  const { showError, showSuccess } = useFeedback();
  const [isSaving, startTransition] = useTransition();

  // baseline = último estado salvo (ou o que veio do servidor)
  const [baseline, setBaseline] = useState(() => normalize(initial));
  const [form, setForm] = useState(baseline);

  const readOnly =
    permissions?.tipo_usuario === "PARCEIRA" || !permissions?.permissao_edicao;

  const payload = useMemo(() => buildPayload(baseline, form), [baseline, form]);
  const dirty = Object.keys(payload).length > 0;

  const setField = useCallback(
    <K extends keyof D5NoteEditableForm>(
      field: K,
      value: D5NoteEditableForm[K],
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const save = useCallback(() => {
    if (readOnly || !dirty) return;

    const snapshot = form; // o que está sendo salvo neste clique

    startTransition(async () => {
      const result = await updateD5NoteAction(d5NoteId, payload);

      if (!result.success) {
        showError(result.message ?? "Erro ao salvar a nota D5.");
        return;
      }

      setBaseline(snapshot);
      showSuccess("Nota D5 atualizada com sucesso.");
      router.refresh();
    });
  }, [
    readOnly,
    dirty,
    form,
    d5NoteId,
    payload,
    showError,
    showSuccess,
    router,
  ]);

  const value = useMemo(
    () => ({ form, setField, dirty, isSaving, readOnly, save }),
    [form, setField, dirty, isSaving, readOnly, save],
  );

  return (
    <D5NoteEditContext.Provider value={value}>
      {children}
    </D5NoteEditContext.Provider>
  );
}
