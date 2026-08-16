// ── GoalsFilters.tsx ──────────────────────────────────────────────────────────

"use client";

import { type Dayjs } from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { FiltersData } from "@/types/dashboard/recompositionGoals/goals";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { FilterTag } from "../common/FilterTag";
import { EXCLUDE_PARCEIRAS } from "../DashboardClient";

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────

const DATE_PICKER_SX = {
  width: { xs: 90, sm: 100 },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
  },
  "& .MuiInputLabel-root": { color: "#94a3b8" },
  "& .MuiSvgIcon-root": { color: "#94a3b8" },
} as const;

const MONTH_SELECT_SX = {
  width: { xs: 110, sm: 130 },
  height: 40,
  color: "#fff",
  backgroundColor: "#0f1e2e",

  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.15)",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.3)",
  },

  "& .MuiSvgIcon-root": {
    color: "#94a3b8",
  },

  "& .MuiSelect-select": {
    py: 1,
  },
} as const;

// ── Meses ─────────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

interface GoalsFiltersProps {
  filtersData: FiltersData;
  filtersTop: number;
  tiposRecomp: FiltersData["tipo"];

  year: Dayjs;
  yearPlan: Dayjs;

  selectedStartMonth: number;
  selectedEndMonth: number;

  selRegional: string[];
  selPartner: string[];
  selType: string[];

  isPending: boolean;

  setYear: (v: Dayjs) => void;
  setYearPlan: (v: Dayjs) => void;

  setSelectedStartMonth: (v: number) => void;
  setSelectedEndMonth: (v: number) => void;

  setSelRegional: (v: string[]) => void;
  setSelPartner: (v: string[]) => void;
  setSelType: (v: string[]) => void;

  onApply: () => void;
  onClear: () => void;
}

export function GoalsFilters({
  filtersData,
  filtersTop,
  tiposRecomp,
  year,
  yearPlan,
  selectedStartMonth,
  selectedEndMonth,
  selRegional,
  selPartner,
  selType,
  isPending,
  setYear,
  setYearPlan,
  setSelectedStartMonth,
  setSelectedEndMonth,
  setSelRegional,
  setSelPartner,
  setSelType,
  onApply,
  onClear,
}: GoalsFiltersProps) {
  const hasActiveFilters =
    selRegional.length > 0 || selPartner.length > 0 || selType.length > 0;

  return (
    <div
      className="
        sticky z-30
        bg-gradient-to-br from-[#1e2f42] to-[#192535]
        p-3 sm:p-4
        border border-white/5 shadow-xl
        backdrop-blur-sm
      "
      style={{ top: filtersTop }}
    >
      {/* Linha principal de filtros */}
      <div className="flex flex-col xl:flex-row xl:items-end gap-3">
        {/* Grupo: Anos + Meses */}
        <div className="flex flex-wrap items-end gap-2">
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <YearPicker label="Ano" value={year} onChange={setYear} />
            <YearPicker
              label="Ano Plano"
              value={yearPlan}
              onChange={setYearPlan}
            />
          </LocalizationProvider>

          <MonthPicker
            label="Mês Inicial"
            value={selectedStartMonth}
            onChange={setSelectedStartMonth}
          />
          <MonthPicker
            label="Mês Final"
            value={selectedEndMonth}
            onChange={setSelectedEndMonth}
          />
        </div>

        {/* Grupo: Selects */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="min-w-[160px] flex-1">
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

          <div className="min-w-[160px] flex-1">
            <MultipleSelectComponent
              label="Parceiras"
              menuItems={
                filtersData.parceira?.filter(
                  (item) =>
                    !EXCLUDE_PARCEIRAS.has(item.turma.toUpperCase().trim()),
                ) ?? []
              }
              selectedItem={selPartner}
              setSelectedItem={setSelPartner}
              valueKey="id"
              displayKey="turma"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="min-w-[160px] flex-1">
            <MultipleSelectComponent
              label="Tipos de Obra"
              menuItems={
                filtersData.tipo?.filter((item) => item.id_grupo === 2) ?? []
              }
              selectedItem={selType}
              setSelectedItem={setSelType}
              valueKey="id"
              displayKey="tipo_obra"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>
        </div>

        {/* Grupo: Botões */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApply}
            disabled={isPending}
            className="
              px-4 sm:px-6 py-2 rounded-xl
              bg-[#3b82f6] hover:bg-[#2563eb]
              text-white text-xs sm:text-sm font-semibold
              transition-all shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isPending ? "Carregando..." : "Aplicar"}
          </button>

          <button
            onClick={onClear}
            disabled={isPending}
            className="
              px-4 sm:px-6 py-2 rounded-xl
              bg-[#3b82f6] hover:bg-[#2563eb]
              text-white text-xs sm:text-sm font-semibold
              transition-all shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex gap-1.5 flex-wrap pt-2 mt-3 border-t border-white/5">
          {selRegional.map((id) => {
            const r = filtersData.regional.find((x) => x.id === id);
            return r ? (
              <FilterTag key={id} label={r.regional} variant="blue" />
            ) : null;
          })}

          {selPartner.map((id) => {
            const p = filtersData.parceira.find((x) => x.id === id);
            return p ? <FilterTag key={id} label={p.turma} /> : null;
          })}

          {selType.map((id) => {
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
      <span className="text-zinc-300 text-[10px] uppercase tracking-wider">
        {label}
      </span>

      <DatePicker
        views={["year"]}
        format="YYYY"
        value={value}
        onChange={(v) => v && onChange(v)}
        slotProps={{
          textField: {
            size: "small",
            sx: DATE_PICKER_SX,
          },
        }}
      />
    </div>
  );
}

function MonthPicker({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (v: number) => void;
}) {
  function handleChange(event: SelectChangeEvent<number>) {
    onChange(Number(event.target.value));
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-zinc-300 text-[10px] uppercase tracking-wider">
        {label}
      </span>

      <FormControl size="small">
        <Select<number>
          value={value}
          onChange={handleChange}
          sx={MONTH_SELECT_SX}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: "#0f1e2e",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",

                "& .MuiMenuItem-root": {
                  fontSize: 14,
                },

                "& .MuiMenuItem-root:hover": {
                  backgroundColor: "rgba(59,130,246,0.15)",
                },

                "& .Mui-selected": {
                  backgroundColor: "rgba(59,130,246,0.25) !important",
                },
              },
            },
          }}
        >
          {MONTH_OPTIONS.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
