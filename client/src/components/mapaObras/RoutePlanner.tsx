"use client";

import { useEffect, useRef, useState } from "react";

interface ObraPin {
  id: number;
  ovnota: string;
  referencia: string | null;
  tipo_obra: string | null;
  status: string | null;
  municipio: string | null;
  bairro: string | null;
  latitude: number;
  longitude: number;
}

interface Props {
  obras: ObraPin[];
  onClose: () => void;
}

interface Waypoint {
  obra: ObraPin;
  order: number;
}

type StartMode = "gps" | "address";
type RouteDirection = "outbound" | "return";

export default function RoutePlanner({ obras, onClose }: Props) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    obras.map((o, i) => ({ obra: o, order: i }))
  );
  const [startMode, setStartMode] = useState<StartMode>("gps");
  const [address, setAddress] = useState("");
  const [startCoord, setStartCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [routeDirection, setRouteDirection] = useState<RouteDirection>("outbound");
  const dragIndex = useRef<number | null>(null);

  // PG Waypoints ordered according to the selected route direction
  const orderedWaypoints = routeDirection === "return" ? [...waypoints].reverse() : waypoints;

  // Auto-get GPS on open
  useEffect(() => {
    if (startMode === "gps") getGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMode]);

  function getGPS() {
    if (!navigator.geolocation) {
      setGpsError("Geolocalização não suportada pelo navegador.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    setStartCoord(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsError("Não foi possível obter sua localização. Verifique as permissões.");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function geocodeAddress() {
    if (!address.trim()) return;
    setGeocoding(true);
    setGeocodeError(null);
    setStartCoord(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`;
      const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
      const data = await res.json();
      if (data.length === 0) {
        setGeocodeError("Endereço não encontrado. Tente ser mais específico.");
      } else {
        setStartCoord({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch {
      setGeocodeError("Erro ao buscar endereço. Verifique a conexão.");
    } finally {
      setGeocoding(false);
    }
  }

  // Drag-to-reorder
  function onDragStart(index: number) {
    dragIndex.current = index;
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const newWp = [...waypoints];
    const [moved] = newWp.splice(dragIndex.current, 1);
    newWp.splice(index, 0, moved);
    dragIndex.current = index;
    setWaypoints(newWp.map((w, i) => ({ ...w, order: i })));
  }

  function onDragEnd() {
    dragIndex.current = null;
  }

  function removeWaypoint(index: number) {
    setWaypoints((prev) => prev.filter((_, i) => i !== index).map((w, i) => ({ ...w, order: i })));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newWp = [...waypoints];
    [newWp[index - 1], newWp[index]] = [newWp[index], newWp[index - 1]];
    setWaypoints(newWp.map((w, i) => ({ ...w, order: i })));
  }

  function moveDown(index: number) {
    if (index === waypoints.length - 1) return;
    const newWp = [...waypoints];
    [newWp[index], newWp[index + 1]] = [newWp[index + 1], newWp[index]];
    setWaypoints(newWp.map((w, i) => ({ ...w, order: i })));
  }

  function openGoogleMaps() {
    if (orderedWaypoints.length === 0) return;

    const stops = orderedWaypoints.map((w) => `${w.obra.latitude},${w.obra.longitude}`);

    // PG Outbound: origin = startCoord (or 1st stop), destination = last stop
    // PG Return: origin = 1st stop (farthest), destination = startCoord (or last stop)
    let origin: string;
    let destination: string;
    let intermediates: string[];

    if (routeDirection === "outbound") {
      destination = stops[stops.length - 1];
      intermediates = stops.slice(0, -1);
      if (startCoord) {
        origin = `${startCoord.lat},${startCoord.lng}`;
      } else {
        origin = intermediates.shift()!;
      }
    } else {
      // PG Return: starts from the farthest obra and ends at the user's origin
      origin = stops[0];
      intermediates = stops.slice(1);
      if (startCoord) {
        destination = `${startCoord.lat},${startCoord.lng}`;
      } else {
        destination = intermediates.pop() ?? origin;
      }
    }

    const waypointsParam = intermediates.length > 0
      ? `&waypoints=${intermediates.join("|")}`
      : "";

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    window.open(url, "_blank");
  }

  function openWaze() {
    if (orderedWaypoints.length === 0) return;
    // PG Waze only supports a single destination — opens for the first stop in the selected direction
    const first = orderedWaypoints[0];
    const url = `https://waze.com/ul?ll=${first.obra.latitude},${first.obra.longitude}&navigate=yes`;
    window.open(url, "_blank");
  }

  const canNavigate = waypoints.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#212E3E] px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-white font-semibold text-sm">Planejador de rota</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="overflow-y-auto flex-1 flex flex-col gap-0">
        {/* Start location */}
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">Ponto de partida</div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setStartMode("gps")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${startMode === "gps" ? "bg-[#212E3E] text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}
            >
              Minha localização
            </button>
            <button
              onClick={() => setStartMode("address")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${startMode === "address" ? "bg-[#212E3E] text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}
            >
              Endereço
            </button>
          </div>

          {startMode === "gps" && (
            <div className="text-xs">
              {gpsLoading && <span className="text-zinc-500">Obtendo localização...</span>}
              {gpsError && (
                <div>
                  <span className="text-red-500">{gpsError}</span>
                  <button onClick={getGPS} className="ml-2 text-blue-600 underline">Tentar novamente</button>
                </div>
              )}
              {startCoord && !gpsLoading && (
                <span className="text-green-600 font-medium">
                  ✓ Localização obtida ({startCoord.lat.toFixed(5)}, {startCoord.lng.toFixed(5)})
                </span>
              )}
            </div>
          )}

          {startMode === "address" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Ex: Rua das Flores, 123, São Paulo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && geocodeAddress()}
                  className="flex-1 text-xs border border-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#212E3E]"
                />
                <button
                  onClick={geocodeAddress}
                  disabled={geocoding || !address.trim()}
                  className="text-xs px-3 py-1.5 bg-[#212E3E] text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {geocoding ? "..." : "Buscar"}
                </button>
              </div>
              {geocodeError && <span className="text-red-500 text-xs">{geocodeError}</span>}
              {startCoord && !geocoding && (
                <span className="text-green-600 text-xs font-medium">✓ Endereço encontrado</span>
              )}
            </div>
          )}
        </div>

        {/* Route direction */}
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">Sentido da rota</div>
          <div className="flex gap-2">
            <button
              onClick={() => setRouteDirection("outbound")}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors text-left leading-tight ${
                routeDirection === "outbound"
                  ? "bg-[#212E3E] text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
              }`}
            >
              <div>Ida</div>
              <div className={`font-normal mt-0.5 ${routeDirection === "outbound" ? "text-zinc-300" : "text-zinc-400"}`}>
                Partida → obra mais distante
              </div>
            </button>
            <button
              onClick={() => setRouteDirection("return")}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors text-left leading-tight ${
                routeDirection === "return"
                  ? "bg-[#212E3E] text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
              }`}
            >
              <div>Volta</div>
              <div className={`font-normal mt-0.5 ${routeDirection === "return" ? "text-zinc-300" : "text-zinc-400"}`}>
                Obra mais distante → partida
              </div>
            </button>
          </div>
        </div>

        {/* Waypoints list */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
            Paradas ({waypoints.length})
          </span>
          <span className="text-xs text-zinc-400">Arraste para reordenar</span>
        </div>

        <div className="px-2 pb-3">
          {orderedWaypoints.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">Nenhuma obra selecionada</p>
          )}
          {orderedWaypoints.map((wp, visualIndex) => {
            // PG Real index within `waypoints` (always in outbound order)
            const realIndex = routeDirection === "return"
              ? waypoints.length - 1 - visualIndex
              : visualIndex;
            return (
              <div
                key={wp.obra.id}
                draggable
                onDragStart={() => onDragStart(realIndex)}
                onDragOver={(e) => onDragOver(e, realIndex)}
                onDragEnd={onDragEnd}
                className="flex items-center gap-2 px-2 py-2 mb-1 bg-white border border-zinc-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors"
              >
                {/* Order badge */}
                <span className="w-6 h-6 rounded-full bg-[#212E3E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {visualIndex + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-zinc-800 truncate">{wp.obra.ovnota}</div>
                  <div className="text-xs text-zinc-400 truncate">
                    {[wp.obra.municipio, wp.obra.bairro].filter(Boolean).join(" · ")}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(realIndex)}
                    disabled={realIndex === 0}
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-xs leading-none p-0.5"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(realIndex)}
                    disabled={realIndex === waypoints.length - 1}
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-xs leading-none p-0.5"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => removeWaypoint(realIndex)}
                  className="text-zinc-300 hover:text-red-500 transition-colors text-sm shrink-0"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-2 shrink-0">
        {!startCoord && (
          <p className="text-xs text-amber-600 text-center">
            {startMode === "gps" ? "Aguardando localização..." : "Informe um endereço de partida"}
          </p>
        )}
        <button
          onClick={openGoogleMaps}
          disabled={!canNavigate}
          className="w-full py-2 bg-[#53FF75] text-[#212E3E] text-sm font-bold rounded-lg hover:brightness-90 disabled:opacity-40 transition-all"
        >
          Abrir no Google Maps
        </button>
        <button
          onClick={openWaze}
          disabled={!canNavigate}
          className="w-full py-2 bg-[#212E3E] text-white text-sm font-semibold rounded-lg hover:bg-[#2a3a50] disabled:opacity-40 transition-all"
        >
          Abrir no Waze (1ª parada)
        </button>
      </div>
    </div>
  );
}
