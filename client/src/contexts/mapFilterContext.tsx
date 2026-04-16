"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "mapFilterOvnotas";

export type MapFilterItem = {
  ovnota?: string;
  ordemDiagrama?: string;
};

interface MapFilterContextType {
  ovnotas: MapFilterItem[] | null;
  setOvnotas: (data: any[]) => void;
}

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [ovnotas, setOvnotasState] = useState<MapFilterItem[] | null>(null);

  // On mount, read from localStorage (in case another tab already set it)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setOvnotasState(JSON.parse(stored));
    }
  }, []);

  // Listen for changes made by OTHER tabs/windows
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            setOvnotasState(JSON.parse(e.newValue));
          } catch {
            setOvnotasState(null);
          }
        } else {
          setOvnotasState(null);
        }
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function setOvnotas(data: any[]) {
    const ovnotasList: MapFilterItem[] = (data ?? [])
      .map((w: any) => ({ ovnota: w.ovnota, ordemDiagrama: w.ordemdiagrama }))
      .filter(Boolean);

    const works = ovnotasList.length > 0 ? ovnotasList : null;

    setOvnotasState(works);
    // Persist so other tabs can read it
    if (works && works.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <MapFilterContext.Provider value={{ ovnotas, setOvnotas }}>
      {children}
    </MapFilterContext.Provider>
  );
}

export function useMapFilter() {
  const ctx = useContext(MapFilterContext);
  if (!ctx) {
    throw new Error("useMapFilter must be used within MapFilterProvider");
  }
  return ctx;
}
