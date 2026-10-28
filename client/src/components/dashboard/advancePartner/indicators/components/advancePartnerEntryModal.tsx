"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import {
  AdvancePartnerFormValues,
  AdvancePartnerPillarConfig,
  CreateAdvancePartnerPayload,
  FieldErrors,
  IndicatorKey,
  PartnerOption,
} from "../types";
import { getNumericFormatProps, getPlaceholder } from "../utils";
import { buildInitialValues, toPayload } from "../utils/form";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface AdvancePartnerEntryModalProps {
  open: boolean;
  onClose: () => void;
  pillars: AdvancePartnerPillarConfig[];
  pillarColors: string[];
  partners: PartnerOption[];
  /** Deve lançar erro se o envio falhar, para o modal se manter aberto */
  onSubmit: (payload: CreateAdvancePartnerPayload) => Promise<void>;
}

const inputBase =
  "rounded-md border bg-zinc-900/60 text-zinc-100 outline-none focus:border-blue-500";
const borderFor = (hasError?: string) =>
  hasError ? "border-red-500" : "border-zinc-700";

export function AdvancePartnerEntryModal({
  open,
  onClose,
  pillars,
  pillarColors,
  partners,
  onSubmit,
}: AdvancePartnerEntryModalProps) {
  const [activePillar, setActivePillar] = useState(pillars[0]?.pillar ?? "");
  const [formValues, setFormValues] = useState<AdvancePartnerFormValues>(() =>
    buildInitialValues(pillars, partners),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Reinicia o formulário ao abrir
  useEffect(() => {
    if (!open) return;
    setFormValues(buildInitialValues(pillars, partners));
    setActivePillar(pillars[0]?.pillar ?? "");
    setErrors({});
  }, [open, pillars, partners]);

  // Esc fecha (exceto durante o envio) e o scroll do body fica bloqueado
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, submitting]);

  const activePillarData = useMemo(
    () => pillars.find((p) => p.pillar === activePillar),
    [pillars, activePillar],
  );

  // Pilares com erros, para os assinalar nas abas
  const pillarsWithErrors = useMemo(
    () =>
      new Set(
        pillars
          .filter((p) => p.indicators.some((i) => errors[i.key]))
          .map((p) => p.pillar),
      ),
    [pillars, errors],
  );

  if (!open) return null;

  function requestClose() {
    if (!submitting) onClose();
  }

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }

  function handleValueChange(pillar: string, key: IndicatorKey, value: string) {
    clearError(key);
    setFormValues((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        [pillar]: {
          ...prev.pillars[pillar],
          values: { ...prev.pillars[pillar].values, [key]: value },
        },
      },
    }));
  }

  function handleReflectionChange(pillar: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        [pillar]: { ...prev.pillars[pillar], reflection: value },
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { payload, errors: validationErrors } = toPayload(
      formValues,
      pillars,
    );
    if (!payload) {
      setErrors(validationErrors);
      // Muda para o primeiro pilar com erro
      const first = pillars.find((p) =>
        p.indicators.some((i) => validationErrors[i.key]),
      );
      if (first) setActivePillar(first.pillar);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch {
      // o erro já foi mostrado pelo pai (showError); o modal mantém-se aberto
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={requestClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="advance-partner-title"
        noValidate
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-[#10233b]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-3">
          <h2
            id="advance-partner-title"
            className="text-xl font-bold text-white"
          >
            Lançar Indicadores
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Parceira e mês */}
        <div className="mx-4 mb-5 mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor="ap-parceira"
              className="mb-1 block text-base font-medium text-zinc-300"
            >
              Parceira
            </label>
            <select
              id="ap-parceira"
              value={formValues.idParceira || ""}
              onChange={(e) => {
                clearError("idParceira");
                setFormValues((prev) => ({
                  ...prev,
                  idParceira: Number(e.target.value) || 0,
                }));
              }}
              className={`w-full px-3 py-2 text-base ${inputBase} ${borderFor(errors.idParceira)}`}
            >
              <option value="">Selecionar</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.turma}
                </option>
              ))}
            </select>
            {errors.idParceira && (
              <p className="mt-1 text-sm text-red-400">{errors.idParceira}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="ap-mes"
              className="mb-1 block text-base font-medium text-zinc-300"
            >
              Mês de referência
            </label>
            <select
              id="ap-mes"
              value={formValues.mesReferencia || ""}
              onChange={(e) => {
                clearError("mesReferencia");
                setFormValues((prev) => ({
                  ...prev,
                  mesReferencia: Number(e.target.value) || 0,
                }));
              }}
              className={`w-full px-3 py-2 text-base ${inputBase} ${borderFor(errors.mesReferencia)}`}
            >
              <option value="">Selecionar</option>
              {MESES.map((mes, idx) => (
                <option key={mes} value={idx + 1}>
                  {mes}
                </option>
              ))}
            </select>
            {errors.mesReferencia && (
              <p className="mt-1 text-sm text-red-400">
                {errors.mesReferencia}
              </p>
            )}
          </div>
        </div>

        {/* Abas por pilar */}
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-zinc-700 bg-zinc-900/40 px-3 py-2"
        >
          {pillars.map((pillar, i) => {
            const isActive = activePillar === pillar.pillar;
            const hasError = pillarsWithErrors.has(pillar.pillar);
            return (
              <button
                key={pillar.pillar}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePillar(pillar.pillar)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-lg font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                } ${hasError ? "ring-1 ring-red-500" : ""}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${pillarColors[i % pillarColors.length]}`}
                />
                {pillar.pillar}
                {hasError && (
                  <span className="text-red-400" aria-label="contém erros">
                    •
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activePillarData && (
            <Fragment key={activePillarData.pillar}>
              <div className="space-y-3">
                {activePillarData.indicators.map((indicator) => {
                  const inputId = `ap-${indicator.key}`;
                  const error = errors[indicator.key];
                  return (
                    <div key={indicator.key}>
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor={inputId}
                          className="text-base text-zinc-300"
                        >
                          {indicator.name}
                        </label>
                        <NumericFormat
                          {...getNumericFormatProps(indicator.format)}
                          id={inputId}
                          aria-invalid={!!error}
                          value={
                            formValues.pillars[activePillarData.pillar]?.values[
                              indicator.key
                            ] ?? ""
                          }
                          onValueChange={(v) =>
                            handleValueChange(
                              activePillarData.pillar,
                              indicator.key,
                              v.value,
                            )
                          }
                          placeholder={getPlaceholder(indicator.format)}
                          className={`w-32 px-2 py-1.5 text-right text-base text-white ${inputBase} ${borderFor(error)}`}
                        />
                      </div>
                      {error && (
                        <p className="mt-1 text-right text-sm text-red-400">
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <label
                  htmlFor={`ap-${activePillarData.reflectionKey}`}
                  className="mb-1 block text-base font-medium text-zinc-300"
                >
                  Reflexão do Pilar
                </label>
                <textarea
                  id={`ap-${activePillarData.reflectionKey}`}
                  rows={3}
                  maxLength={2000}
                  value={
                    formValues.pillars[activePillarData.pillar]?.reflection ??
                    ""
                  }
                  onChange={(e) =>
                    handleReflectionChange(
                      activePillarData.pillar,
                      e.target.value,
                    )
                  }
                  placeholder="Comentário sobre os resultados deste pilar..."
                  className={`w-full resize-none px-3 py-2 text-base ${inputBase} border-zinc-700`}
                />
              </div>
            </Fragment>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-700 px-5 py-3">
          <button
            type="button"
            onClick={requestClose}
            disabled={submitting}
            className="rounded-md px-3 py-1.5 text-base font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-base font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? "Salvando..." : "Salvar Lançamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
