"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useLeafletMap } from "@/hooks/worksMap/useLeafletMap";
import { MapFilterItem, useMapFilter } from "@/contexts/mapFilterContext";
import { ObraPin } from "@/interfaces/worksMapInterface";
import {
  buildKey,
  buildObraPopup,
  buildPayloadForEquipments,
} from "@/utils/worksMapHelpers";

import { FilterBar } from "./filterBar";
import { MapOverlays } from "./mapOverlays";
import RoutePlanner from "./routePlanner/RoutePlanner";
import { ObraListPanel } from "./workListPanel";

interface Props {
  token: string;
}

interface requestItem {
  items: MapFilterItem[];
}

export default function WorksMapComponent({ token }: Props) {
  const { ovnotas } = useMapFilter();

  const {
    containerRef,
    mapRef,
    markersLayerRef,
    routeLayerRef,
    LRef,
    mapReady,
  } = useLeafletMap();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [obras, setObras] = useState<ObraPin[]>([]);
  const [requested, setRequested] = useState<requestItem>({ items: [] });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [search, setSearch] = useState("");

  // ── Filtros ───────────────────────────────────────────────────────────────
  const displayObras = useMemo(() => {
    if (!search) return obras;
    const q = search.toLowerCase();

    return obras.filter(
      (o) =>
        o.ovnota?.toLowerCase().includes(q) ||
        o.ordemDiagrama?.toLowerCase().includes(q) ||
        o.referencia?.toLowerCase().includes(q) ||
        o.municipio?.toLowerCase().includes(q) ||
        o.bairro?.toLowerCase().includes(q) ||
        o.circuito?.toLowerCase().includes(q),
    );
  }, [obras, search]);

  // 🔥 Set correto (string key, não objeto)
  const obrasComLocSet = useMemo(
    () => new Set(obras.map((o) => buildKey(o.ovnota, o.ordemDiagrama))),
    [obras],
  );

  const requestedSet = useMemo(
    () =>
      new Set(requested.items.map((r) => buildKey(r.ovnota, r.ordemDiagrama))),
    [requested],
  );

  const semLocObras = useMemo<requestItem>(
    () => ({
      items: requested.items.filter(
        (r) => !obrasComLocSet.has(buildKey(r.ovnota, r.ordemDiagrama)),
      ),
    }),
    [requested, obrasComLocSet],
  );

  const faltamCount = useMemo(
    () => requestedSet.size - obrasComLocSet.size,
    [requestedSet, obrasComLocSet],
  );

  // ── Map sync ──────────────────────────────────────────────────────────────
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

  // ── API (POST 🔥) ──────────────────────────────────────────────────────────
  const fetchObras = useCallback(
    async (payload: requestItem) => {
      setLoading(true);
      setFetchError(null);

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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

        if (!list.length) {
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

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ovnotas?.length) return;

    const payload = buildPayloadForEquipments(ovnotas);
    setRequested(payload);

    fetchObras(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePuxarFiltros = useCallback(() => {
    if (!ovnotas?.length) return;

    const payload = buildPayloadForEquipments(ovnotas);
    setRequested(payload);

    fetchObras(payload);
  }, [ovnotas, fetchObras]);

  const handleExportSemLoc = useCallback(async () => {
    if (!semLocObras.items.length) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos/without-location/export`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(semLocObras),
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="relative flex-1 z-0">
          <div ref={containerRef} className="absolute inset-0 z-0" />
          <MapOverlays
            obras={obras}
            loading={loading}
            fetchError={fetchError}
          />
        </div>

        {showPlanner && (
          <div className="w-80 shrink-0 border-l border-zinc-200 shadow-xl overflow-hidden bg-white">
            <RoutePlanner
              obras={displayObras}
              onClose={() => setShowPlanner(false)}
            />
          </div>
        )}

        {showList && !showPlanner && (
          <div className="w-80 shrink-0">
            <ObraListPanel
              displayObras={displayObras}
              semLocObras={semLocObras.items}
              faltamCount={faltamCount}
              ovnotas={ovnotas}
              onClose={() => setShowList(false)}
              onExportSemLoc={handleExportSemLoc}
            />
          </div>
        )}
      </div>
    </div>
  );
}
