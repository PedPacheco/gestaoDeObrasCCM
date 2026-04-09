"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useMapFilter } from "@/contexts/mapFilterContext";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { ObraPin } from "@/interfaces/worksMapInterface";
import { buildObraPopup } from "@/utils/worksMapHelpers";

import { FilterBar } from "./filterBar";
import { MapOverlays } from "./mapOverlays";
import RoutePlanner from "./RoutePlanner";
import { ObraListPanel } from "./workListPanel";

interface Props {
  token: string;
}

export default function MapaObrasComponent({ token }: Props) {
  const { ovnotas } = useMapFilter();

  // Hook que encapsula todo o ciclo de vida do Leaflet
  const {
    containerRef,
    mapRef,
    markersLayerRef,
    routeLayerRef,
    LRef,
    mapReady,
  } = useLeafletMap();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [obras, setObras] = useState<ObraPin[]>([]);
  const [requestedOvnotas, setRequestedOvnotas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [search, setSearch] = useState("");

  const displayObras = useMemo(() => {
    if (!search) return obras;
    const q = search.toLowerCase();
    return obras.filter(
      (o) =>
        o.ovnota?.toLowerCase().includes(q) ||
        o.referencia?.toLowerCase().includes(q) ||
        o.municipio?.toLowerCase().includes(q) ||
        o.bairro?.toLowerCase().includes(q) ||
        o.circuito?.toLowerCase().includes(q),
    );
  }, [obras, search]);

  const obrasComLocSet = useMemo(
    () => new Set(obras.map((o) => o.ovnota)),
    [obras],
  );

  const semLocObras = useMemo(
    () => requestedOvnotas.filter((ov) => !obrasComLocSet.has(ov)),
    [requestedOvnotas, obrasComLocSet],
  );

  const faltamCount = useMemo(
    () => (ovnotas ? ovnotas.length - obras.length : semLocObras.length),
    [ovnotas, obras.length, semLocObras.length],
  );

  const repetidasComLoc = useMemo(() => {
    if (!ovnotas) return [];
    return [
      ...new Set(
        ovnotas.filter((ov) => {
          const count = ovnotas.filter((o) => o === ov).length;
          return count > 1 && obrasComLocSet.has(ov);
        }),
      ),
    ];
  }, [ovnotas, obrasComLocSet]);

  // ── Sincroniza markers no mapa ────────────────────────────────────────────
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!L || !map || !markersLayer) return;

    markersLayer.clearLayers();

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (displayObras.length === 0) return;

    const bounds: [number, number][] = [];
    displayObras.forEach((obra) => {
      const latlng: [number, number] = [obra.latitude, obra.longitude];
      bounds.push(latlng);
      L.marker(latlng).bindPopup(buildObraPopup(obra)).addTo(markersLayer);
    });

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [mapReady, displayObras, LRef, mapRef, markersLayerRef, routeLayerRef]);

  // ── API ───────────────────────────────────────────────────────────────────
  const fetchObras = useCallback(
    async (params: Record<string, string>) => {
      setLoading(true);
      setFetchError(null);
      try {
        const query = new URLSearchParams(
          Object.entries(params).filter(([, v]) => Boolean(v)),
        ).toString();
        const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos${
          query ? `?${query}` : ""
        }`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setFetchError(err.message ?? `Erro ${res.status}`);
          setObras([]);
          return;
        }

        const json = await res.json();
        const list: ObraPin[] = json.data ?? [];
        setObras(list);

        if (list.length === 0) {
          setFetchError(
            "Nenhuma obra com localização encontrada para os filtros selecionados.",
          );
        }
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : "Erro ao buscar obras",
        );
        setObras([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  // Auto-carrega ao chegar de outra página com ovnotas no contexto
  useEffect(() => {
    if (!ovnotas?.length) return;
    const unique = [...new Set(ovnotas)];
    setRequestedOvnotas(unique);
    fetchObras({ ovnotas: unique.join(",") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intencional: executa apenas na montagem. fetchObras é estável,
    // mas incluí-lo causaria re-fetch ao abrir/fechar a sidebar.
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePuxarFiltros = useCallback(() => {
    if (!ovnotas?.length) return;
    const unique = [...new Set(ovnotas)];
    setRequestedOvnotas(unique);
    fetchObras({ ovnotas: unique.join(",") });
  }, [ovnotas, fetchObras]);

  const handleExportSemLoc = useCallback(async () => {
    if (!semLocObras.length) return;
    const params = new URLSearchParams({ ovnotas: semLocObras.join(",") });
    const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos/without-location/export?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "obras-sem-localizacao.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, [semLocObras, token]);

  const handleToggleList = () => {
    setShowList((v) => !v);
    setShowPlanner(false);
  };

  const handleTogglePlanner = () => {
    setShowPlanner((v) => !v);
    setShowList(false);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <FilterBar
        loading={loading}
        obras={obras}
        ovnotas={ovnotas}
        displayObras={displayObras}
        faltamCount={faltamCount}
        showPlanner={showPlanner}
        search={search}
        onPuxarFiltros={handlePuxarFiltros}
        onSearchChange={setSearch}
        onToggleList={handleToggleList}
        onTogglePlanner={handleTogglePlanner}
      />

      {/*
       * Wrapper do mapa + painéis laterais.
       * `min-h-0` evita que flex-children cresçam além do container pai.
       * Sem `relative` aqui — o mapa não usa mais `absolute inset-0` neste nível.
       */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/*
         * Wrapper isolado do Leaflet: `relative flex-1` cria um novo contexto
         * de posicionamento, confinando o `absolute inset-0` do container do
         * Leaflet a este div — sem vazar sobre os painéis laterais.
         *
         * MapOverlays fica aqui dentro para continuar posicionado sobre o mapa.
         */}
        <div className="relative flex-1 z-0">
          <div ref={containerRef} className="absolute inset-0 z-0" />
          <MapOverlays
            obras={obras}
            loading={loading}
            fetchError={fetchError}
          />
        </div>

        {/* Painel: Planejador de rota */}
        {showPlanner && (
          <div className="w-80 shrink-0 border-l border-zinc-200 shadow-xl overflow-hidden bg-white">
            <RoutePlanner
              obras={displayObras}
              onClose={() => setShowPlanner(false)}
            />
          </div>
        )}

        {/* Painel: Lista de obras */}
        {showList && !showPlanner && (
          <div className="w-80 shrink-0">
            <ObraListPanel
              displayObras={displayObras}
              semLocObras={semLocObras}
              faltamCount={faltamCount}
              ovnotas={ovnotas}
              repetidasComLoc={repetidasComLoc}
              onClose={() => setShowList(false)}
              onExportSemLoc={handleExportSemLoc}
            />
          </div>
        )}
      </div>
    </div>
  );
}
