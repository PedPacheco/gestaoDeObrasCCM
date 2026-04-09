"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

const MAP_CENTER: [number, number] = [-23.55, -46.63];
const MAP_ZOOM = 9;
const LEAFLET_ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";

/**
 * useLeafletMap
 *
 * Encapsula toda a inicialização e destruição do mapa Leaflet.
 * Retorna refs para o container DOM, o mapa, a layer de markers e a lib L.
 *
 * Separar o ciclo de vida do Leaflet em um hook dedicado:
 *  - Deixa o componente pai limpo, focado apenas em orquestrar dados/estado
 *  - Facilita testes unitários do hook de forma isolada
 *  - Permite reutilizar a inicialização em outros mapas do sistema
 */
export function useLeafletMap(sidebarOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init do mapa — executa apenas uma vez na montagem
  useEffect(() => {
    if (!containerRef.current) return;

    type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };
    // Guard contra double-init (React StrictMode executa effects duas vezes em dev)
    if ((containerRef.current as LeafletContainer)._leaflet_id) return;

    let destroyed = false;

    async function initMap() {
      // Import dinâmico — evita SSR crash (leaflet usa window internamente)
      const L = await import("leaflet");

      // ↓ FIX CRÍTICO: importar o CSS do Leaflet garante que os tiles
      //   tenham dimensões corretas. Sem isso, os tiles renderizam fragmentados.

      if (destroyed || !containerRef.current) return;

      LRef.current = L;

      // Corrige paths dos ícones default quebrados por bundlers (webpack/turbopack)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `${LEAFLET_ICON_BASE}/marker-icon-2x.png`,
        iconUrl: `${LEAFLET_ICON_BASE}/marker-icon.png`,
        shadowUrl: `${LEAFLET_ICON_BASE}/marker-shadow.png`,
      });

      const map = L.map(containerRef.current, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    }

    initMap();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      if (containerRef.current) {
        delete (containerRef.current as LeafletContainer)._leaflet_id;
      }
      LRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Invalida tamanho do mapa após a transição da sidebar (300ms + margem)
  useEffect(() => {
    const SIDEBAR_TRANSITION_DELAY_MS = 320;
    const timer = setTimeout(
      () => mapRef.current?.invalidateSize(),
      SIDEBAR_TRANSITION_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  return {
    containerRef,
    mapRef,
    markersLayerRef,
    routeLayerRef,
    LRef,
    mapReady,
  };
}
