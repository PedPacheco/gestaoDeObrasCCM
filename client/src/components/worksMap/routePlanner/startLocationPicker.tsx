"use client";
import { useGeocoding } from "@/hooks/routePlanner/useGeocoding";
import {
  Coordinates,
  useGpsLocation,
} from "@/hooks/routePlanner/useGpsLocation";
import { StartMode } from "@/hooks/routePlanner/useRouteNavigation";
import { useEffect, useState } from "react";

interface Props {
  onCoordChange: (coord: Coordinates | null) => void;
}

export function StartLocationPicker({ onCoordChange }: Props) {
  const [startMode, setStartMode] = useState<StartMode>("gps");
  const [address, setAddress] = useState("");

  const gps = useGpsLocation();
  const geo = useGeocoding();

  // Notifica o pai sempre que as coordenadas mudarem
  useEffect(() => {
    onCoordChange(startMode === "gps" ? gps.coords : geo.coords);
  }, [startMode, gps.coords, geo.coords, onCoordChange]);

  // Auto-GPS ao abrir no modo gps
  useEffect(() => {
    if (startMode === "gps") gps.getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMode]);

  return (
    <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
      <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">
        Ponto de partida
      </div>

      {/* Toggle */}
      <div className="flex gap-2 mb-3">
        {(["gps", "address"] as StartMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setStartMode(mode)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              startMode === mode
                ? "bg-[#212E3E] text-white"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
            }`}
          >
            {mode === "gps" ? "Minha localização" : "Endereço"}
          </button>
        ))}
      </div>

      {startMode === "gps" && (
        <div className="text-xs">
          {gps.loading && (
            <span className="text-zinc-500">Obtendo localização...</span>
          )}
          {gps.error && (
            <div>
              <span className="text-red-500">{gps.error}</span>
              <button
                onClick={gps.getLocation}
                className="ml-2 text-blue-600 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {gps.coords && !gps.loading && (
            <span className="text-green-600 font-medium">
              ✓ Localização obtida ({gps.coords.lat.toFixed(5)},{" "}
              {gps.coords.lng.toFixed(5)})
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
              onKeyDown={(e) => e.key === "Enter" && geo.geocode(address)}
              className="flex-1 text-xs border border-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#212E3E]"
            />
            <button
              onClick={() => geo.geocode(address)}
              disabled={geo.loading || !address.trim()}
              className="text-xs px-3 py-1.5 bg-[#212E3E] text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
            >
              {geo.loading ? "..." : "Buscar"}
            </button>
          </div>
          {geo.error && (
            <span className="text-red-500 text-xs">{geo.error}</span>
          )}
          {geo.coords && !geo.loading && (
            <span className="text-green-600 text-xs font-medium">
              ✓ Endereço encontrado
            </span>
          )}
        </div>
      )}
    </div>
  );
}
