"use client";

import { MapFilterItem } from "@/contexts/mapFilterContext";
import { ObraPin } from "@/types/worksMapInterface";

interface ObraListPanelProps {
  displayObras: ObraPin[];
  semLocObras: MapFilterItem[];
  faltamCount: number;
  ovnotas: MapFilterItem[] | null;
  onClose: () => void;
  onExportSemLoc: () => void;
}

/**
 * ObraListPanel
 *
 * Painel lateral deslizante com três seções:
 *  1. Obras COM localização — exibidas no mapa
 *  2. Obras SEM coordenadas — com opção de exportar para Excel
 *
 * Responsabilidade única: apresentar dados. Nenhuma lógica de fetch ou estado global aqui.
 */
export function ObraListPanel({
  displayObras,
  semLocObras,
  faltamCount,
  ovnotas,
  onClose,
  onExportSemLoc,
}: ObraListPanelProps) {
  return (
    <div className="w-80 shrink-0 bg-white border-l border-zinc-200 flex flex-col h-full shadow-xl">
      {/* Cabeçalho */}
      <div className="bg-[#212E3E] px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-white font-semibold text-sm">Lista de obras</span>
        <button
          onClick={onClose}
          aria-label="Fechar lista de obras"
          className="text-zinc-400 hover:text-white text-lg leading-none transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto flex-1 text-sm ">
        {/* ── Seção: Com localização ─────────────────────────────────────── */}
        <div className="px-3 py-2 bg-green-50 border-b border-green-200 sticky top-0">
          <span className="font-semibold text-green-700 text-xs uppercase tracking-wide">
            Com localização — {displayObras.length}
          </span>
        </div>

        {displayObras.map((o) => (
          <div
            key={o.id}
            className="px-3 py-2 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
          >
            <div className="font-semibold text-zinc-800">{`${o.ovnota}-${o.ordemDiagrama ?? "Sem ordem/diagrama"}`}</div>
            <div className="text-zinc-500 text-xs mt-0.5">
              {[o.municipio, o.bairro, o.tipo_obra].filter(Boolean).join(" · ")}
            </div>
            {o.status && (
              <div className="text-zinc-400 text-xs">{o.status}</div>
            )}
          </div>
        ))}

        {/* ── Seção: Sem localização ─────────────────────────────────────── */}
        {faltamCount > 0 && (
          <>
            <div className="px-3 py-2 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-orange-700 text-xs uppercase tracking-wide">
                  Faltam no mapa — {faltamCount}
                </div>
                {semLocObras.length > 0 && (
                  <button
                    onClick={onExportSemLoc}
                    title="Exportar obras sem localização para Excel"
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
                  >
                    ↓ Excel
                  </button>
                )}
              </div>

              {faltamCount > semLocObras.length && (
                <div className="text-orange-500 text-xs mt-0.5">
                  {semLocObras.length} sem coordenada ·{" "}
                  {faltamCount - semLocObras.length} repetida
                  {faltamCount - semLocObras.length !== 1 ? "s" : ""} na aba
                </div>
              )}
            </div>

            {semLocObras.map((ov) => {
              const repeats = ovnotas
                ? ovnotas.filter(
                    (o) =>
                      o.ovnota === ov.ovnota &&
                      o.ordemDiagrama === ov.ordemDiagrama,
                  ).length
                : 1;

              return (
                <div
                  key={`${ov.ovnota}-${ov.ordemDiagrama ?? "Sem ordem/diagrama"}`}
                  className="px-3 py-2 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <div className="font-semibold text-zinc-500 flex items-center gap-2">
                    {`${ov.ovnota}-${ov.ordemDiagrama ?? "Sem ordem/diagrama"}`}
                    {repeats > 1 && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                        ×{repeats}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    Sem coordenadas cadastradas
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
