"use client";

import { useEffect, useRef, useState } from "react";
import { useMapFilter } from "@/contexts/mapFilterContext";
import { useSidebar } from "@/contexts/sidebarContext";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import RoutePlanner from "./RoutePlanner";

// PG ---------------------------------------------------------------------------
// PG MultiSelectDropdown — dropdown with checkboxes for multiple selection
// PG ---------------------------------------------------------------------------
interface MultiSelectOption { id: string | number; label: string }
interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

function MultiSelectDropdown({ label, placeholder, options, values, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // PG Closes when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id: string) {
    if (values.includes(id)) onChange(values.filter((v) => v !== id));
    else onChange([...values, id]);
  }

  const displayText =
    values.length === 0
      ? placeholder
      : values.length === 1
      ? options.find((o) => String(o.id) === values[0])?.label ?? values[0]
      : `${values.length} selecionados`;

  return (
    <div className="flex flex-col gap-0.5 relative" ref={ref}>
      <label className="text-zinc-400 text-xs">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm bg-[#404d5e] text-zinc-200 rounded px-2 py-1.5 outline-none text-left flex items-center justify-between gap-2 min-w-[120px] whitespace-nowrap"
      >
        <span className="truncate max-w-[130px]">{displayText}</span>
        <span className="text-zinc-400 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#2e3c4e] border border-[#404d5e] rounded shadow-xl max-h-56 overflow-y-auto min-w-[170px]" style={{ zIndex: 1000 }}>
          {options.length === 0 && (
            <div className="px-3 py-2 text-zinc-400 text-xs">Nenhuma opção</div>
          )}
          {/* Opção "Limpar seleção" */}
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-[#404d5e] transition-colors border-b border-[#404d5e]"
            >
              Limpar seleção
            </button>
          )}
          {options.map((opt) => {
            const checked = values.includes(String(opt.id));
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#404d5e] cursor-pointer transition-colors text-sm text-zinc-200"
              >
                <input
                  type="checkbox"
                  className="accent-[#53FF75]"
                  checked={checked}
                  onChange={() => toggle(String(opt.id))}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ObraPin {
  id: number;
  ovnota: string;
  referencia: string | null;
  tipo_obra: string | null;
  status: string | null;
  municipio: string | null;
  circuito: string | null;
  bairro: string | null;
  latitude: number;
  longitude: number;
}

interface Props {
  filtersData: FiltersInterface;
  token: string;
}

interface SelectedFilters {
  idRegional: string[];
  idMunicipio: string[];
  idGrupo: string[];
  idTipo: string[];
  idTurma: string[];
  idStatus: string[];
}

export default function MapaObrasComponent({ filtersData, token }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [obras, setObras] = useState<ObraPin[]>([]);
  // Exact deduplicated list sent to the API — used to compute sem-localização
  const [requestedOvnotas, setRequestedOvnotas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SelectedFilters>({
    idRegional: [],
    idMunicipio: [],
    idGrupo: [],
    idTipo: [],
    idTurma: [],
    idStatus: [],
  });

  const { ovnotas, setOvnotas } = useMapFilter();
  const { open: sidebarOpen } = useSidebar();

  // Municipios filtered by selected regional
  const municipiosFiltrados = filters.idRegional.length > 0
    ? (filtersData.municipio ?? []).filter(
        (m) => filters.idRegional.includes(String(m.id_regional))
      )
    : (filtersData.municipio ?? []);

  // Init Leaflet map (once)
  useEffect(() => {
    if (!containerRef.current) return;
    // Avoid double-init (React StrictMode runs effects twice in dev)
    if ((containerRef.current as any)._leaflet_id) return;

    let destroyed = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (destroyed || !containerRef.current) return;

      LRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center: [-23.55, -46.63],
        zoom: 9,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        delete (containerRef.current as any)._leaflet_id;
      }
      LRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Invalidate Leaflet size after sidebar transition (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 320);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // If arriving from another page with ovnotas set in context, load automatically
  useEffect(() => {
    if (ovnotas && ovnotas.length > 0) {
      const unique = [...new Set(ovnotas)];
      setRequestedOvnotas(unique);
      fetchObras({ ovnotas: unique.join(",") });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch obras from API
  async function fetchObras(params: Record<string, string>) {
    setLoading(true);
    setFetchError(null);
    try {
      const query = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v)
      ).toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos${query ? `?${query}` : ""}`;
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
      const list = json.data ?? [];
      setObras(list);
      if (list.length === 0) {
        setFetchError("Nenhuma obra com localização encontrada para os filtros selecionados.");
      }
    } catch (e: any) {
      setFetchError(e.message ?? "Erro ao buscar obras");
      setObras([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAplicar() {
    const params: Record<string, string> = {};
    if (filters.idRegional.length > 0) params.idRegional = filters.idRegional.join(",");
    if (filters.idMunicipio.length > 0) params.idMunicipio = filters.idMunicipio.join(",");
    if (filters.idGrupo.length > 0) params.idGrupo = filters.idGrupo.join(",");
    if (filters.idTipo.length > 0) params.idTipo = filters.idTipo.join(",");
    if (filters.idTurma.length > 0) params.idTurma = filters.idTurma.join(",");
    if (filters.idStatus.length > 0) params.idStatus = filters.idStatus.join(",");
    setRequestedOvnotas([]);
    fetchObras(params);
  }

  function handleLimpar() {
    setFilters({ idRegional: [], idMunicipio: [], idGrupo: [], idTipo: [], idTurma: [], idStatus: [] });
    setObras([]);
    setRequestedOvnotas([]);
    setOvnotas(null);
    setSearch("");
  }

  // Obras sem localização:
  // requestedOvnotas = deduplicated list sent to API
  // semLocObras = unique ovnotas that didn't come back with coordinates
  // faltamCount = total rows in source tab (ovnotas with dups) minus obras returned
  const obrasComLocSet = new Set(obras.map((o) => o.ovnota));
  const semLocObras = requestedOvnotas.filter((ov) => !obrasComLocSet.has(ov));
  const faltamCount = ovnotas ? ovnotas.length - obras.length : semLocObras.length;

  // Filtered obras for map display (search box)
  const displayObras = obras.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.ovnota?.toLowerCase().includes(q) ||
      o.referencia?.toLowerCase().includes(q) ||
      o.municipio?.toLowerCase().includes(q) ||
      o.bairro?.toLowerCase().includes(q) ||
      o.circuito?.toLowerCase().includes(q)
    );
  });

  // Update markers on map
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

      const icon = new L.Icon.Default();

      const marker = L.marker(latlng, { icon });
      marker.bindPopup(`
        <div style="min-width:190px;font-family:sans-serif;font-size:13px;line-height:1.6">
          <strong style="font-size:14px">${obra.ovnota}</strong><br/>
          <b>Ref:</b> ${obra.referencia ?? "-"}<br/>
          <b>Tipo:</b> ${obra.tipo_obra ?? "-"}<br/>
          <b>Status:</b> ${obra.status ?? "-"}<br/>
          <b>Município:</b> ${obra.municipio ?? "-"}<br/>
          <b>Bairro:</b> ${obra.bairro ?? "-"}<br/>
          <a href="/detalhes/${obra.ovnota}" style="color:#2563eb;font-weight:600">Ver detalhes →</a>
        </div>
      `);
      markersLayerRef.current.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [mapReady, displayObras]);

  function handlePuxarFiltros() {
    if (ovnotas && ovnotas.length > 0) {
      // Deduplica antes de enviar e guarda como referência para calcular sem-localização
      const unique = [...new Set(ovnotas)];
      setRequestedOvnotas(unique);
      fetchObras({ ovnotas: unique.join(",") });
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Filter bar */}
      <div className="bg-[#212E3E] px-4 py-3 shrink-0 flex flex-wrap gap-2 items-end relative" style={{ zIndex: 1000 }}>
        <>
            <MultiSelectDropdown
              label="Regional"
              placeholder="Todas"
              options={(filtersData.regional ?? []).map((r) => ({ id: r.id, label: r.regional }))}
              values={filters.idRegional}
              onChange={(v) => setFilters((f) => ({ ...f, idRegional: v, idMunicipio: [] }))}
            />

            <MultiSelectDropdown
              label="Município"
              placeholder="Todos"
              options={municipiosFiltrados.map((m) => ({ id: m.id, label: m.municipio }))}
              values={filters.idMunicipio}
              onChange={(v) => setFilters((f) => ({ ...f, idMunicipio: v }))}
            />

            <MultiSelectDropdown
              label="Grupo"
              placeholder="Todos"
              options={(filtersData.grupo ?? []).map((g) => ({ id: g.id, label: g.grupo }))}
              values={filters.idGrupo}
              onChange={(v) => setFilters((f) => ({ ...f, idGrupo: v }))}
            />

            <MultiSelectDropdown
              label="Parceira"
              placeholder="Todas"
              options={(filtersData.parceira ?? []).map((p) => ({ id: p.id, label: p.turma }))}
              values={filters.idTurma}
              onChange={(v) => setFilters((f) => ({ ...f, idTurma: v }))}
            />

            <MultiSelectDropdown
              label="Tipo"
              placeholder="Todos"
              options={(filtersData.tipo ?? []).map((t) => ({ id: t.id, label: t.tipo_obra }))}
              values={filters.idTipo}
              onChange={(v) => setFilters((f) => ({ ...f, idTipo: v }))}
            />

            <MultiSelectDropdown
              label="Status"
              placeholder="Todos"
              options={(filtersData.status ?? []).map((s) => ({ id: s.id, label: s.status }))}
              values={filters.idStatus}
              onChange={(v) => setFilters((f) => ({ ...f, idStatus: v }))}
            />

            <button
              onClick={handleAplicar}
              disabled={loading}
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#53FF75] text-[#212E3E] hover:brightness-90 transition-all disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Aplicar"}
            </button>

            {obras.length > 0 && (
              <button
                onClick={handleLimpar}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#404d5e] text-zinc-200 hover:bg-red-600 hover:text-white transition-colors"
              >
                Limpar
              </button>
            )}

            {/* Pull from other tab — always visible */}
            <button
              onClick={handlePuxarFiltros}
              disabled={loading || !ovnotas || ovnotas.length === 0}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:enabled:bg-blue-500"
              title={ovnotas && ovnotas.length > 0 ? "Usar as obras filtradas em outra aba" : "Aplique filtros em outra aba primeiro"}
            >
              Puxar filtros de outras abas
              {ovnotas && ovnotas.length > 0 && (
                <span className="ml-1.5 bg-blue-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {ovnotas.length}
                </span>
              )}
            </button>
        </>

        {/* Search + route controls (always visible when there are obras) */}
        {obras.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setShowList((v) => !v); setShowPlanner(false); }}
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
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm bg-[#404d5e] text-zinc-200 rounded-lg px-3 py-1.5 w-52 outline-none focus:ring-2 focus:ring-[#53FF75]"
            />
            <button
              onClick={() => { setShowPlanner((v) => !v); setShowList(false); }}
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

      {/* Empty / error state overlay */}
      {obras.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ top: 160 }}>
          <p className={`text-sm px-4 py-2 rounded-lg shadow ${fetchError ? "bg-red-50 text-red-600 border border-red-200" : "bg-white/80 text-zinc-500"}`}>
            {fetchError ?? <>Selecione os filtros e clique em <strong>Aplicar</strong> para ver as obras no mapa</>}
          </p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{ top: 160 }}>
          <p className="bg-white/90 text-zinc-600 text-sm px-4 py-2 rounded-lg shadow">
            Buscando obras...
          </p>
        </div>
      )}

      {/* Map + list panel wrapper */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="flex-1" />

        {/* Route planner panel */}
        {showPlanner && (
          <div className="w-80 shrink-0 border-l border-zinc-200 shadow-xl overflow-hidden">
            <RoutePlanner
              obras={displayObras}
              onClose={() => setShowPlanner(false)}
            />
          </div>
        )}

        {/* Sliding list panel */}
        {showList && !showPlanner && (
          <div className="w-80 shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-hidden shadow-xl">
            {/* Panel header */}
            <div className="bg-[#212E3E] px-4 py-3 flex items-center justify-between shrink-0">
              <span className="text-white font-semibold text-sm">Lista de obras</span>
              <button
                onClick={() => setShowList(false)}
                className="text-zinc-400 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-sm">
              {/* Obras COM localização */}
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
                  <div className="font-semibold text-zinc-800">{o.ovnota}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">
                    {[o.municipio, o.bairro, o.tipo_obra].filter(Boolean).join(" · ")}
                  </div>
                  {o.status && (
                    <div className="text-zinc-400 text-xs">{o.status}</div>
                  )}
                </div>
              ))}

              {/* Obras SEM localização */}
              {faltamCount > 0 && (
                <>
                  <div className="px-3 py-2 bg-orange-50 border-b border-orange-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-orange-700 text-xs uppercase tracking-wide">
                        Faltam no mapa — {faltamCount}
                      </div>
                      {semLocObras.length > 0 && (
                        <button
                          onClick={async () => {
                            const params = new URLSearchParams({ ovnotas: semLocObras.join(",") });
                            const url = `${process.env.NEXT_PUBLIC_API_URL}/equipamentos/without-location/export?${params}`;
                            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                            const blob = await res.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = blobUrl;
                            a.download = "obras-sem-localizacao.xlsx";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                          }}
                          className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
                          title="Exportar obras sem localização para Excel"
                        >
                          ↓ Excel
                        </button>
                      )}
                    </div>
                    {faltamCount > semLocObras.length && (
                      <div className="text-orange-500 text-xs mt-0.5">
                        {semLocObras.length} sem coordenada · {faltamCount - semLocObras.length} repetida{faltamCount - semLocObras.length !== 1 ? "s" : ""} na aba
                      </div>
                    )}
                  </div>
                  {semLocObras.map((ov) => {
                    const repeats = ovnotas ? ovnotas.filter((o) => o === ov).length : 1;
                    return (
                      <div
                        key={ov}
                        className="px-3 py-2 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="font-semibold text-zinc-500 flex items-center gap-2">
                          {ov}
                          {repeats > 1 && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                              ×{repeats}
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 text-xs mt-0.5">Sem coordenadas cadastradas</div>
                      </div>
                    );
                  })}
                  {/* Ovnotas repetidas que têm coordenada (aparecem múltiplas vezes na aba mas 1x no mapa) */}
                  {(() => {
                    const repetidas = ovnotas
                      ? [...new Set(ovnotas.filter((ov) => {
                          const count = ovnotas.filter((o) => o === ov).length;
                          return count > 1 && obrasComLocSet.has(ov);
                        }))]
                      : [];
                    if (repetidas.length === 0) return null;
                    return repetidas.map((ov) => {
                      const repeats = ovnotas!.filter((o) => o === ov).length;
                      return (
                        <div key={ov} className="px-3 py-2 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                          <div className="font-semibold text-zinc-500 flex items-center gap-2">
                            {ov}
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                              ×{repeats} na aba
                            </span>
                          </div>
                          <div className="text-zinc-400 text-xs mt-0.5">No mapa aparece 1 vez (localização única)</div>
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
