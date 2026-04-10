"use client";

interface MapOverlaysProps {
  obras: unknown[];
  loading: boolean;
  fetchError: string | null;
}

/**
 * MapOverlays
 *
 * Overlays posicionados absolutamente sobre o mapa:
 *  - Estado vazio / erro: orienta o usuário ou exibe mensagem de erro da API
 *  - Carregando: spinner textual enquanto a requisição está em andamento
 *
 * pointer-events-none garante que os overlays não bloqueiem interações com o mapa.
 */
export function MapOverlays({ obras, loading, fetchError }: MapOverlaysProps) {
  return (
    <>
      {obras.length === 0 && !loading && (
        <div
          className="absolute inset-x-0 flex items-start justify-center pointer-events-none z-10 pt-8"
          // top fixo em 160px para ficar abaixo da barra de filtros
          style={{ top: 160 }}
        >
          <p
            className={`text-sm px-4 py-2 rounded-lg shadow ${
              fetchError
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-white/80 text-zinc-500"
            }`}
          >
            {fetchError ?? (
              <>
                Selecione os filtros e clique em <strong>Aplicar</strong> para
                ver as obras no mapa
              </>
            )}
          </p>
        </div>
      )}

      {loading && (
        <div
          className="absolute inset-x-0 flex items-start justify-center z-10 pointer-events-none pt-8"
          style={{ top: 160 }}
        >
          <p className="bg-white/90 text-zinc-600 text-sm px-4 py-2 rounded-lg shadow">
            Buscando obras...
          </p>
        </div>
      )}
    </>
  );
}
