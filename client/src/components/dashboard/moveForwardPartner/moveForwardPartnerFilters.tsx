import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { WEEKS } from "@/utils/weeks";
import { useEffect, useRef, useState } from "react";

interface FiltersData {
  regional?: Array<Record<string, any>>;
  parceira?: Array<Record<string, any>>;
}

interface MoveForwartPartnerFiltesProps {
  filtersData: FiltersData;
  initialWeek: number;
  finalWeek: number;
  selectedRegional: string[];
  selectedParceira: string[];
  setInitialWeek: (week: number) => void;
  setFinalWeek: (week: number) => void;
  setSelectedRegional: (data: string[]) => void;
  setSelectedParceira: (data: string[]) => void;
  applyFilters: () => void;
}

function WeekSelect({
  label,
  value,
  onChange,
  showField,
}: {
  label: string;
  value: number;
  onChange: (num: number) => void;
  showField: "inicio" | "fim";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const week = WEEKS.find((w) => w.num === value) ?? WEEKS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 bg-[#0f1e2e] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 min-w-[210px] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">Sem. {value}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{week[showField]}</span>
        </div>
        <svg
          className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl w-[300px] max-h-[280px] overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {WEEKS.map((w) => {
            const sel = w.num === value;
            return (
              <button
                key={w.num}
                type="button"
                onClick={() => {
                  onChange(w.num);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${sel ? "text-[#3b82f6]" : "text-zinc-400"}`}
              >
                <span
                  className={`font-bold w-12 shrink-0 text-left ${sel ? "text-[#3b82f6]" : "text-zinc-200"}`}
                >
                  Sem. {w.num}
                </span>
                <span className="text-zinc-500 text-[10px] flex-1 text-left">
                  {w.inicio} – {w.fim}
                </span>
                <span
                  className={`text-[10px] shrink-0 ${sel ? "text-blue-400" : "text-zinc-600"}`}
                >
                  {w.mes}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MoveForwartPartnerFilters({
  initialWeek,
  finalWeek,
  selectedParceira,
  selectedRegional,
  setInitialWeek,
  setFinalWeek,
  setSelectedParceira,
  setSelectedRegional,
  filtersData,
  applyFilters,
}: MoveForwartPartnerFiltesProps) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
      <div className="flex flex-row gap-4 items-end">
        <WeekSelect
          label="Semana inicial"
          value={initialWeek}
          onChange={setInitialWeek}
          showField="inicio"
        />
        <WeekSelect
          label="Semana final"
          value={finalWeek}
          onChange={setFinalWeek}
          showField="fim"
        />

        <div className="flex flex-row w-1/2 justify-between">
          <div className="min-w-[120px] flex-1 mr-4">
            <MultipleSelectComponent
              label="Regionais"
              menuItems={filtersData.regional ?? []}
              selectedItem={selectedRegional}
              setSelectedItem={setSelectedRegional}
              valueKey="id"
              displayKey="regional"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="min-w-[120px] flex-1">
            <MultipleSelectComponent
              label="Parceira"
              menuItems={filtersData.parceira ?? []}
              selectedItem={selectedParceira}
              setSelectedItem={setSelectedParceira}
              valueKey="id"
              displayKey="parceira"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={applyFilters}
            disabled={false}
            className="rounded-xl bg-[#3b82f6] px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {false ? "Carregando..." : "Aplicar"}
          </button>

          <button
            type="button"
            onClick={() => console.log("aplicar")}
            disabled={false}
            className="rounded-xl bg-[#3b82f6] px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {false ? "Carregando..." : "Limpar"}
          </button>
        </div>
      </div>
    </div>
  );
}
