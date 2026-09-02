"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";

import { XMarkIcon } from "@heroicons/react/20/solid";

import { AdvancePartnerPillar } from "../../advancePartner";
import { getNumericFormatProps, getPlaceholder } from "../utils";

interface PartnerOption {
  id: number;
  nome: string;
}

export interface AdvancePartnerFormValues {
  idParceira: number;
  mesReferencia: number;
  pillars: Record<
    string,
    {
      reflection: string;
      values: Record<string, string>;
    }
  >;
}

interface AdvancePartnerEntryModalProps {
  open: boolean;
  onClose: () => void;
  pillars: AdvancePartnerPillar[];
  pillarColors: string[];
  onSubmit: (values: AdvancePartnerFormValues) => void | Promise<void>;
}

function buildInitialValues(
  pillars: AdvancePartnerPillar[],
  partners: PartnerOption[],
): AdvancePartnerFormValues {
  return {
    idParceira: partners[0]?.id ?? 0, // default: primeira parceira
    mesReferencia: new Date().getMonth() + 1, // default: mês atual
    pillars: pillars.reduce(
      (acc, pillar) => {
        acc[pillar.pillar] = {
          reflection: "",
          values: pillar.indicators.reduce(
            (values, indicator) => {
              values[indicator.name] = "";
              return values;
            },
            {} as Record<string, string>,
          ),
        };
        return acc;
      },
      {} as Record<
        string,
        { reflection: string; values: Record<string, string> }
      >,
    ),
  };
}

export function AdvancePartnerEntryModal({
  open,
  onClose,
  pillars,
  pillarColors,
  onSubmit,
}: AdvancePartnerEntryModalProps) {
  const [activePillar, setActivePillar] = useState(pillars[0]?.pillar ?? "");
  const [formValues, setFormValues] = useState<AdvancePartnerFormValues>(() =>
    buildInitialValues(pillars, []),
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormValues(buildInitialValues(pillars, []));
      setActivePillar(pillars[0]?.pillar ?? "");
    }
  }, [open, pillars]);

  // fecha com Esc e trava o scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const activePillarData = useMemo(
    () => pillars.find((p) => p.pillar === activePillar),
    [pillars, activePillar],
  );

  if (!open) return null;

  function handleValueChange(
    pillar: string,
    indicatorName: string,
    value: string,
  ) {
    setFormValues((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        [pillar]: {
          ...prev.pillars[pillar],
          values: {
            ...prev.pillars[pillar].values,
            [indicatorName]: value,
          },
        },
      },
    }));
  }

  function handleReflectionChange(pillar: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        [pillar]: {
          ...prev.pillars[pillar],
          reflection: value,
        },
      },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(formValues);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-[#10233b]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-3">
          <h2 className="text-xl font-bold text-white">Lançar Indicadores</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 mx-4">
          <div>
            <label className="mb-1 block text-base font-medium text-zinc-300">
              Parceira
            </label>
            <select
              value={formValues.idParceira}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  idParceira: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-base text-zinc-100 outline-none focus:border-blue-500"
            >
              {[{ id: 1, nome: "Engelmig" }].map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-base font-medium text-zinc-300">
              Mês de referência
            </label>
            <select
              value={formValues.mesReferencia || ""}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  mesReferencia: e.target.value ? Number(e.target.value) : 0,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-base text-zinc-100 outline-none focus:border-blue-500"
            >
              <option value="">Selecionar</option>
              {[
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
              ].map((mes, idx) => (
                <option key={mes} value={idx + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs por pilar */}
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-700 bg-zinc-900/40 px-3 py-2">
          {pillars.map((pillar, i) => (
            <button
              key={pillar.pillar}
              type="button"
              onClick={() => setActivePillar(pillar.pillar)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-lg font-medium transition-colors ${
                activePillar === pillar.pillar
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${pillarColors[i % pillarColors.length]}`}
              />
              {pillar.pillar}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activePillarData && (
            <Fragment key={activePillarData.pillar}>
              <div className="space-y-3">
                {activePillarData.indicators.map((indicator) => (
                  <div
                    key={indicator.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <label
                      htmlFor={`${activePillarData.pillar}-${indicator.name}`}
                      className="text-base text-zinc-300"
                    >
                      {indicator.name}
                    </label>
                    <NumericFormat
                      {...getNumericFormatProps(indicator.format)}
                      value={
                        formValues.pillars[activePillarData.pillar]?.values[
                          indicator.name
                        ] ?? ""
                      }
                      onValueChange={(values) =>
                        handleValueChange(
                          activePillarData.pillar,
                          indicator.name,
                          values.value,
                        )
                      }
                      placeholder={getPlaceholder(indicator.format)}
                      className="w-32 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1.5 text-right text-base text-white outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <label
                  htmlFor={`${activePillarData.pillar}-reflection`}
                  className="mb-1 block text-base font-medium text-zinc-300"
                >
                  Reflexão do Pilar
                </label>
                <textarea
                  id={`${activePillarData.pillar}-reflection`}
                  rows={3}
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
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-base text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </Fragment>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-700 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-base font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-base font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? "Salvando..." : "Salvar Lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
