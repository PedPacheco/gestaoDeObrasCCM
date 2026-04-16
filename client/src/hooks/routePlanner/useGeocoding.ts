import { useState, useCallback } from "react";
import { Coordinates } from "./useGpsLocation";

interface UseGeocodingReturn {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  geocode: (address: string) => Promise<void>;
}

export function useGeocoding(): UseGeocodingReturn {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string) => {
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setCoords(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`;
      const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
      const data: Array<{ lat: string; lon: string }> = await res.json();

      if (data.length === 0) {
        setError("Endereço não encontrado. Tente ser mais específico.");
      } else {
        setCoords({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      }
    } catch {
      setError("Erro ao buscar endereço. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, error, geocode };
}
