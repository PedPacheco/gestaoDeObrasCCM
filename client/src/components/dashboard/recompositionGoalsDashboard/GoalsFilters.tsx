// ── GoalsFilters.tsx ──────────────────────────────────────────────────────────
// Barra de filtros extraída do componente de 1900 linhas.
// Recebe estado e callbacks do hook useGoalsFilter → sem fetch interno.
//
// ANTES: ~140 linhas misturadas com KPIs, charts e tabela.
// DEPOIS: componente focado, props bem tipadas.

"use client";

import { type Dayjs } from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FiltersData } from "@/types/dashboard/recompositionGoals/goals";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";

// Estilo reutilizável para o DatePicker MUI com tema escuro
const DATE_PICKER_SX = {
  width: 100,
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
  },
  "& .MuiInputLabel-root": { color: "#94a3b8" },
  "& .MuiSvgIcon-root": { color: "#94a3b8" },
} as const;

interface GoalsFiltersProps {
  filtersData: FiltersData;
  tiposRecomp: FiltersData["tipo"];
  // Estado
  ano: Dayjs;
  anoPlan: Dayjs;
  selRegional: string[];
  selParceira: string[];
  selTipo: string[];
  isPending: boolean;
  // Callbacks
  setAno: (v: Dayjs) => void;
  setAnoPlan: (v: Dayjs) => void;
  setSelRegional: (v: string[]) => void;
  setSelParceira: (v: string[]) => void;
  setSelTipo: (v: string[]) => void;
  onApply: () => void;
  onClear: () => void;
}

export function GoalsFilters({
  filtersData,
  tiposRecomp,
  ano,
  anoPlan,
  selRegional,
  selParceira,
  selTipo,
  isPending,
  setAno,
  setAnoPlan,
  setSelRegional,
  setSelParceira,
  setSelTipo,
  onApply,
  onClear,
}: GoalsFiltersProps) {
  const hasActiveFilters =
    selRegional.length > 0 || selParceira.length > 0 || selTipo.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-4 border border-white/5 shadow-xl">
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <YearPicker label="Ano" value={ano} onChange={setAno} />
        <YearPicker label="Ano Plano" value={anoPlan} onChange={setAnoPlan} />
      </LocalizationProvider>

      <div className=" min-w-[220px] flex-1">
        <MultipleSelectComponent
          label="Regionais"
          menuItems={filtersData.regional ?? []}
          selectedItem={selRegional}
          setSelectedItem={setSelRegional}
          valueKey="id"
          displayKey="regional"
          backgroundColor="#0f1e2e"
          textColor="#a1a1aa"
        />
      </div>

      <div className="min-w-[220px] flex-1">
        <MultipleSelectComponent
          label="Parceiras"
          menuItems={filtersData.parceira ?? []}
          selectedItem={selParceira}
          setSelectedItem={setSelParceira}
          valueKey="id"
          displayKey="turma"
          backgroundColor="#0f1e2e"
          textColor="#a1a1aa"
        />
      </div>

      <div className="min-w-[220px] flex-1">
        <MultipleSelectComponent
          label="Tipos de Obra"
          menuItems={
            filtersData.tipo?.filter((item) => item.id_grupo === 2) ?? []
          }
          selectedItem={selTipo}
          setSelectedItem={setSelTipo}
          valueKey="id"
          displayKey="tipo_obra"
          backgroundColor="#0f1e2e"
          textColor="#a1a1aa"
        />
      </div>

      <div className="flex gap-2 ml-auto">
        <button
          onClick={onClear}
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 text-sm font-semibold transition-all disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          onClick={onApply}
          disabled={isPending}
          className="px-6 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-all shadow-lg disabled:opacity-50"
        >
          {isPending ? "Carregando..." : "Aplicar"}
        </button>
      </div>

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="w-full flex gap-1.5 flex-wrap pt-1 border-t border-white/5 mt-1">
          {selRegional.map((id) => {
            const r = filtersData.regional.find((x) => x.id === id);
            return r ? (
              <FilterTag key={id} label={r.regional} variant="blue" />
            ) : null;
          })}
          {selParceira.map((id) => {
            const p = filtersData.parceira.find((x) => x.id === id);
            return p ? <FilterTag key={id} label={p.turma} /> : null;
          })}
          {selTipo.map((id) => {
            const t = tiposRecomp.find((x) => x.id === id);
            return t ? <FilterTag key={id} label={t.tipo_obra} /> : null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Subcomponentes locais ─────────────────────────────────────────────────────

function YearPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Dayjs;
  onChange: (v: Dayjs) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <DatePicker
        views={["year"]}
        format="YYYY"
        value={value}
        onChange={(v) => v && onChange(v)}
        slotProps={{ textField: { size: "small", sx: DATE_PICKER_SX } }}
      />
    </div>
  );
}

function FilterTag({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "blue" | "default";
}) {
  const cls =
    variant === "blue"
      ? "bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#60a5fa]"
      : "bg-white/5 border-white/10 text-zinc-400";
  return (
    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}
