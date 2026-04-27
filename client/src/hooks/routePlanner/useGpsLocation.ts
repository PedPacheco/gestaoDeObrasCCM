import { useState, useCallback } from "react";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface UseGpsLocationReturn {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  getLocation: () => void;
}

export function useGpsLocation(): UseGpsLocationReturn {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador.");
      return;
    }

    setLoading(true);
    setError(null);
    setCoords(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError(
          "Não foi possível obter sua localização. Verifique as permissões.",
        );
        setLoading(false);
      },
      { timeout: 10000 },
    );
  }, []);

  return { coords, loading, error, getLocation };
}
