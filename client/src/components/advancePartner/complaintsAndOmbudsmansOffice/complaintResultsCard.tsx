"use client";

import { NUM } from "@/utils/formatValue";
import { Dispatch, SetStateAction, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Collapse, Fade } from "@mui/material";
import { NoteSummary, ResultadoBucket } from "@/types/reclamacoesOuvidoria";
import { GREEN, RED } from "./mainComplaintsAndOmbudsmansOffice";

interface ComplaintResultsProps {
  selectedBucket: ResultadoBucket | null;
  setSelectedBucket: Dispatch<SetStateAction<ResultadoBucket | null>>;
  rows: {
    procedente: NoteSummary[];
    improcedente: NoteSummary[];
  };
}

export function ComplaintResults({
  selectedBucket,
  setSelectedBucket,
  rows,
}: ComplaintResultsProps) {
  const notasSelecionadas = selectedBucket ? rows[selectedBucket] : [];

  return (
    <Collapse in={!!selectedBucket} timeout={300} unmountOnExit>
      <div className="rounded-2xl border border-white/8 p-5 shadow-xl bg-gradient-to-br from-[#1a2d42] to-[#182333]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold text-sm uppercase tracking-wide">
            Notas —{" "}
            {selectedBucket === "procedente" ? "Procedentes" : "Improcedentes"}{" "}
            ({NUM(notasSelecionadas.length)})
          </span>
          <button
            onClick={() => setSelectedBucket(null)}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"
          >
            <XMarkIcon className="w-4 h-4" />
            Fechar
          </button>
        </div>

        {notasSelecionadas.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">
            Nenhuma nota encontrada para os filtros atuais.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 pr-1">
            {notasSelecionadas.map((row, i) => (
              <Fade
                key={row.id}
                in
                timeout={300}
                style={{ transitionDelay: `${Math.min(i * 20, 300)}ms` }}
              >
                <div
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                  style={{ background: "#1e2f42" }}
                >
                  <div className="font-bold text-white truncate">
                    {row.nota}
                  </div>
                  <div className="text-zinc-400 truncate">
                    {row.empreiteira}
                  </div>
                  <div className="text-zinc-500 truncate">
                    {row.municipio || "—"}
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        )}
      </div>
    </Collapse>
  );
}

export function ReclamacoesResultadoCard({
  total,
  procedentes,
  improcedentes,
  selected,
  onToggle,
}: {
  total: number;
  procedentes: number;
  improcedentes: number;
  selected: ResultadoBucket | null;
  onToggle: (bucket: "procedente" | "improcedente") => void;
}) {
  const pillCls = (bucket: "procedente" | "improcedente") =>
    `flex-1 flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
      selected === bucket ? "text-[#0f1a26]" : "text-zinc-300 hover:text-white"
    }`;

  return (
    <div className="relative rounded-2xl px-4 py-3 flex flex-col gap-3 overflow-hidden shadow-lg bg-gradient-to-br from-[#182638] to-[#1c2f42]">
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ background: GREEN }}
      />

      <div className="pl-3 flex flex-col">
        <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
          Reclamações
        </span>
        <span className="font-black text-3xl text-white leading-none pt-2">
          {NUM(total)}
        </span>
      </div>

      <div className="pl-3 flex gap-2">
        <button
          type="button"
          onClick={() => onToggle("procedente")}
          className={pillCls("procedente")}
          style={{
            background: selected === "procedente" ? RED : "#0f1e2e",
            borderColor:
              selected === "procedente" ? RED : "rgba(255,255,255,0.1)",
          }}
        >
          <span>Procedente</span>
          <span className="font-black">{NUM(procedentes)}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggle("improcedente")}
          className={pillCls("improcedente")}
          style={{
            background: selected === "improcedente" ? GREEN : "#0f1e2e",
            borderColor:
              selected === "improcedente" ? GREEN : "rgba(255,255,255,0.1)",
          }}
        >
          <span>Improcedente</span>
          <span className="font-black">{NUM(improcedentes)}</span>
        </button>
      </div>
    </div>
  );
}
