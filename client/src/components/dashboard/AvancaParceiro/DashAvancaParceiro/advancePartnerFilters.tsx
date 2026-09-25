import { DateFilter } from "@/components/common/DateFilter";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import {
  FilterMode,
  MotivoTab,
} from "@/hooks/dashboard/advancePartner/useAdvancePartnerFilters";
import { WEEKS } from "@/utils/weeks";
import { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { EXCLUDE_PARCEIRAS } from "../../DashboardClient";

interface FiltersData {
  regional?: Array<Record<string, any>>;
  parceira?: Array<Record<string, any>>;
}

interface AdvancePartnerFiltersProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  filtersData: FiltersData;
  initialWeek: number;
  finalWeek: number;
  selectedRegional: string[];
  selectedParceira: string[];
  filterMode: FilterMode;
  motivoTab: MotivoTab;
  setMotivoTab: (tab: MotivoTab) => void;
  setFilterMode: (mode: FilterMode) => void;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  setInitialWeek: (week: number) => void;
  setFinalWeek: (week: number) => void;
  setSelectedRegional: (data: string[]) => void;
  setSelectedParceira: (data: string[]) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  isPending: boolean;
  filtersTop: number;
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
    <div ref={ref} className="relative flex flex-col gap-1 w-full sm:w-auto">
      <span className="text-zinc-500 text-xs uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        // FIX: min-w fixo substituído por w-full no mobile e min-w no desktop
        className="flex items-center justify-between gap-2 bg-[#0f1e2e] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-xl pl-3 pr-2.5 py-2 w-full sm:min-w-[180px] lg:min-w-[210px] transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-white shrink-0">Sem. {value}</span>
          <span className="text-zinc-600 shrink-0">·</span>
          {/* FIX: truncate adicionado para textos longos não quebrarem layout */}
          <span className="text-zinc-400 truncate">{week[showField]}</span>
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
          // FIX: max-w e min-w para evitar que o dropdown estoure o viewport em mobile
          className="absolute top-full mt-1.5 left-0 z-50 bg-[#0f1e2e] border border-white/10 rounded-xl shadow-2xl w-[280px] sm:w-[300px] max-h-[280px] overflow-y-auto"
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
                  className={`font-bold w-12 shrink-0 text-left ${sel ? "text-[#3b82f6]" : "text-zinc-400"}`}
                >
                  Sem. {w.num}
                </span>
                <span className="text-zinc-500 text-xs flex-1 text-left">
                  {w.inicio} – {w.fim}
                </span>
                <span
                  className={`text-xs shrink-0 ${sel ? "text-blue-400" : "text-zinc-400"}`}
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

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  activeColor = "bg-[#3b82f6]",
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (val: T) => void;
  activeColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-zinc-500 text-xs uppercase tracking-wider">
        {label}
      </span>
      <div className="flex rounded-xl overflow-hidden border border-white/10">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            // FIX: py-2 padronizado para altura igual ao WeekSelect e DateFilter
            className={`px-2.5 sm:px-3 py-2 text-[10px] sm:text-xs font-bold transition-colors ${
              value === opt
                ? `${activeColor} text-white`
                : "bg-[#0f1e2e] text-zinc-400 hover:text-white"
            }`}
          >
            {opt === "semana" ? "Semana" : opt === "data" ? "Data" : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdvancePartnerFilters({
  startDate,
  endDate,
  initialWeek,
  finalWeek,
  selectedParceira,
  selectedRegional,
  filterMode,
  motivoTab,
  setMotivoTab,
  setFilterMode,
  setStartDate,
  setEndDate,
  setInitialWeek,
  setFinalWeek,
  setSelectedParceira,
  setSelectedRegional,
  filtersData,
  applyFilters,
  clearFilters,
  filtersTop,
  isPending,
}: AdvancePartnerFiltersProps) {
  return (
    <div
      className="
        sticky z-30
        flex flex-col gap-3
        border border-white/5
        bg-gradient-to-br from-[#1e2f42] to-[#192535]
        p-3 sm:p-4
        shadow-xl backdrop-blur-sm
      "
      style={{ top: filtersTop }}
    >
      {/*
        ANTES: flex-col xl:flex-row (quebrava em 2 linhas até xl=1280px sem organização clara)
        AGORA: flex-col com quebra inteligente por seção — Toggles | Período | Selects | Botões
        O layout se adapta em 3 fases:
          mobile  (<640px)  → tudo empilhado
          tablet  (sm/md)   → toggles em linha, semanas/datas em linha, selects em linha
          desktop (lg+)     → tudo em uma única linha horizontal
      */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        {/* ── Grupo 1: Todos os filtros ── */}
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:items-end flex-1 min-w-0">
          {/* Toggles: Filtrar por + Responsabilidade */}
          {/* FIX: flex-wrap para acomodar em telas estreitas sem overflow */}
          <div className="flex flex-wrap gap-2 items-end shrink-0">
            <ToggleGroup
              label="Filtrar por"
              options={["semana", "data"] as FilterMode[]}
              value={filterMode}
              onChange={setFilterMode}
            />

            <ToggleGroup
              label="Responsabilidade"
              options={["Geral", "Edp", "Parceira", "Terceiro"] as MotivoTab[]}
              value={motivoTab}
              onChange={setMotivoTab}
              activeColor="bg-[#1d4ed8]"
            />
          </div>

          {/* Semana ou Data */}
          {/* FIX: flex-wrap para WeekSelects lado a lado no mobile sem overflow */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-end min-w-0">
            {filterMode === "semana" ? (
              <>
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
              </>
            ) : (
              <DateFilter
                endDate={endDate}
                setEndDate={setEndDate}
                setStartDate={setStartDate}
                startDate={startDate}
                backgroundColor="#0f1e2e"
                textColor="#a1a1aa"
                svgColor="#94a3b8"
                // FIX: margin removida — espaçamento controlado pelo gap do flex pai
                spacing="!mb-0"
              />
            )}
          </div>

          {/* Selects: Regionais + Parceira */}
          {/* FIX: flex-col em mobile, flex-row em sm+ com flex-1 para ocupar espaço disponível */}
          <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
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

            <div className="min-w-0 flex-1">
              <MultipleSelectComponent
                label="Parceira"
                menuItems={
                  filtersData.parceira?.filter(
                    (item) =>
                      !EXCLUDE_PARCEIRAS.has(item.turma.toUpperCase().trim()),
                  ) ?? []
                }
                selectedItem={selectedParceira}
                setSelectedItem={setSelectedParceira}
                valueKey="id"
                displayKey="turma"
                backgroundColor="#0f1e2e"
                textColor="#a1a1aa"
              />
            </div>
          </div>
        </div>

        {/* ── Grupo 2: Botões de ação ── */}
        {/*
          ANTES: shrink-0 sem controle de alinhamento mobile
          AGORA: self-stretch em mobile (botões full-width), auto em lg+
          Os botões Aplicar/Limpar têm visual diferente para distingui-los
        */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            // FIX: botão Aplicar com cor cheia (ação primária)
            className="flex-1 lg:flex-none rounded-xl bg-[#3b82f6] px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? "Carregando..." : "Aplicar"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            // FIX: botão Limpar com estilo outline (ação secundária) para distinguir visualmente
            className="flex-1 lg:flex-none rounded-xl bg-transparent border border-white/20 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-zinc-300 transition-all hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? "Carregando..." : "Limpar"}
          </button>
        </div>
      </div>
    </div>
  );
}
