"use client";

import type { DashboardFiltersState } from "@/types/dashboard/labor/types";

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  partners: string[];
  onChange: <K extends keyof DashboardFiltersState>(
    key: K,
    value: DashboardFiltersState[K],
  ) => void;
  onReset: () => void;
}

export function DashboardFilters({
  filters,
  partners,
  onChange,
  onReset,
}: DashboardFiltersProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <input
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          placeholder="Buscar parceira..."
          className="rounded-lg border px-4 py-2"
        />

        <select
          value={filters.partner}
          onChange={(e) => onChange("partner", e.target.value)}
          className="rounded-lg border px-4 py-2"
        >
          <option value="all">Todas as parceiras</option>
          {partners.map((partner, index) => (
            <option key={index} value={partner}>
              {partner}
            </option>
          ))}
        </select>

        <button onClick={onReset} className="rounded-lg border px-4 py-2">
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
