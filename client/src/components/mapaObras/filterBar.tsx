"use client";

import { ObraPin } from "@/interfaces/worksMapInterface";

interface FilterBarProps {
  loading: boolean;
  obras: ObraPin[];
  ovnotas: string[] | null;
  displayObras: ObraPin[];
  faltamCount: number;
  showPlanner: boolean;
  search: string;
  onPuxarFiltros: () => void;
  onSearchChange: (value: string) => void;
  onToggleList: () => void;
  onTogglePlanner: () => void;
}

export function FilterBar({
  loading,
  obras,
  ovnotas,
  displayObras,
  faltamCount,
  showPlanner,
  search,
  onPuxarFiltros,
  onSearchChange,
  onToggleList,
  onTogglePlanner,
}: FilterBarProps) {
  return (
    <div className="bg-white px-4 py-3 shrink-0 flex flex-wrap gap-2 items-end relative z-[30]">
      <button
        onClick={onPuxarFiltros}
        disabled={loading || !ovnotas?.length}
        title={
          ovnotas?.length
            ? "Usar as obras filtradas em outra aba"
            : "Aplique filtros em outra aba primeiro"
        }
        className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:enabled:bg-blue-500"
      >
        Puxar filtros de outras abas
        {!!ovnotas?.length && (
          <span className="ml-1.5 bg-blue-400 text-white text-xs px-1.5 py-0.5 rounded-full">
            {ovnotas.length}
          </span>
        )}
      </button>

      {/* Busca + controles de visualização (visíveis apenas com obras carregadas) */}
      {obras.length > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onToggleList}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#53FF75] text-[#212E3E] hover:brightness-90 transition-all"
            title="Ver lista de obras"
          >
            {displayObras.length} ponto{displayObras.length !== 1 ? "s" : ""}
            {faltamCount > 0 && (
              <span className="ml-1 text-[#212E3E]/60">
                (faltam {faltamCount})
              </span>
            )}
          </button>

          <input
            type="text"
            placeholder="Buscar OV, ref, município..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-sm bg-[#404d5e] text-zinc-200 rounded-lg px-3 py-1.5 w-52 outline-none focus:ring-2 focus:ring-[#53FF75]"
          />

          <button
            onClick={onTogglePlanner}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              showPlanner
                ? "bg-[#53FF75] text-[#212E3E]"
                : "bg-[#404d5e] text-zinc-200 hover:bg-[#53FF75] hover:text-[#212E3E]"
            }`}
          >
            Planejar rota
          </button>
        </div>
      )}
    </div>
  );
}
