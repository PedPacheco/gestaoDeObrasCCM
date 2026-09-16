"use client";

import { useEffect, useState } from "react";

import { ControleSmcColumnGroup, NucleoSmcRow } from "@/types/controleSmc";
import { CONTROLE_SMC_COLUMNS } from "@/utils/controleSmc/columns";
import { XMarkIcon } from "@heroicons/react/20/solid";

const SURFACE_CARD = "#0f1d2e";
const SURFACE_INPUT = "#1e2f42";

const GROUP_LABELS: Record<ControleSmcColumnGroup, string> = {
  geral: "Informações gerais",
  status: "Status e entrega",
  parceiras: "Parceiras",
  ligacoes: "Ligações",
  restricoes: "Restrições (Meio Ambiente, Poder Público, CHI)",
  conjunto: "Conjunto e CHI",
  progresso: "Progresso e prazos",
  pendencias: "Pendências e relatório final",
};

const GROUP_ORDER: ControleSmcColumnGroup[] = [
  "geral",
  "status",
  "parceiras",
  "ligacoes",
  "restricoes",
  "conjunto",
  "progresso",
  "pendencias",
];

const inputCls =
  "w-full bg-transparent border border-white/10 text-sm text-slate-200 py-2 px-2.5 rounded-md outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 placeholder:text-white/25";

interface ControleSmcRowDrawerProps {
  row: NucleoSmcRow | null;
  isNew: boolean;
  optionsByField: Partial<Record<keyof NucleoSmcRow, string[]>>;
  onClose: () => void;
  onSave: (row: NucleoSmcRow) => void;
  onDelete: () => void;
}

export function ControleSmcRowDrawer({
  row,
  isNew,
  optionsByField,
  onClose,
  onSave,
  onDelete,
}: ControleSmcRowDrawerProps) {
  const [values, setValues] = useState<NucleoSmcRow | null>(row);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues(row);
    setError("");
  }, [row]);

  if (!values) return null;

  const setField = (key: keyof NucleoSmcRow, value: string | number | null) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = () => {
    if (!values.nucleo.trim()) {
      setError("Informe o nome do núcleo.");
      return;
    }
    if (!values.regional.trim()) {
      setError("Informe a regional.");
      return;
    }
    onSave(values);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-xl h-full overflow-y-auto border-l border-white/10 shadow-2xl flex flex-col"
        style={{ background: SURFACE_CARD }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-inherit">
          <div>
            <h2 className="text-white font-bold text-lg">
              {isNew ? "Novo núcleo" : values.nucleo || "Editar núcleo"}
            </h2>
            <p className="text-zinc-500 text-xs">
              {isNew
                ? "Cadastro manual"
                : `${values.regional} · ${values.municipio}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6 px-6 py-5">
          {GROUP_ORDER.map((group) => (
            <div key={group} className="flex flex-col gap-3">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                {GROUP_LABELS[group]}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTROLE_SMC_COLUMNS.filter(
                  (column) => column.group === group,
                ).map((column) => {
                  const listId = `smc-options-${column.key}`;
                  const rawValue = values[column.key];

                  if (column.editor === "textarea") {
                    return (
                      <div
                        key={column.key}
                        className="sm:col-span-2 flex flex-col gap-1"
                      >
                        <label className="text-xs text-zinc-400">
                          {column.header}
                        </label>
                        <textarea
                          value={(rawValue as string) ?? ""}
                          onChange={(e) => setField(column.key, e.target.value)}
                          rows={3}
                          className={inputCls}
                          style={{ background: SURFACE_INPUT }}
                        />
                      </div>
                    );
                  }

                  if (column.editor === "number") {
                    return (
                      <div key={column.key} className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400">
                          {column.header}
                          {column.type === "percent" ? " (%)" : ""}
                        </label>
                        <input
                          type="number"
                          value={
                            rawValue === null || rawValue === undefined
                              ? ""
                              : (rawValue as number)
                          }
                          onChange={(e) =>
                            setField(
                              column.key,
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          className={`${inputCls} font-mono`}
                          style={{ background: SURFACE_INPUT }}
                        />
                      </div>
                    );
                  }

                  if (column.editor === "select") {
                    const options = optionsByField[column.key] ?? [];
                    return (
                      <div key={column.key} className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400">
                          {column.header}
                        </label>
                        <input
                          list={listId}
                          value={(rawValue as string) ?? ""}
                          onChange={(e) => setField(column.key, e.target.value)}
                          className={inputCls}
                          style={{ background: SURFACE_INPUT }}
                        />
                        <datalist id={listId}>
                          {options.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </div>
                    );
                  }

                  return (
                    <div key={column.key} className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-400">
                        {column.header}
                      </label>
                      <input
                        type="text"
                        value={(rawValue as string) ?? ""}
                        onChange={(e) => setField(column.key, e.target.value)}
                        className={inputCls}
                        style={{ background: SURFACE_INPUT }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-6 pb-2 text-xs font-semibold text-rose-400">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-inherit">
          {!isNew ? (
            <button
              onClick={onDelete}
              className="text-rose-400 hover:text-rose-300 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              Excluir núcleo
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {isNew ? "Cadastrar" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
