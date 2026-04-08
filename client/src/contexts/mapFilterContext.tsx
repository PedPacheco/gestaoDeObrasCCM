"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "mapFilterOvnotas";

interface MapFilterContextType {
  ovnotas: string[] | null;
  setOvnotas: (ovnotas: string[] | null) => void;
}

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [ovnotas, setOvnotasState] = useState<string[] | null>(null);

  // On mount, read from localStorage (in case another tab already set it)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setOvnotasState(JSON.parse(stored));
      } catch {
        // ignore
      }
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

  function setOvnotas(ovnotas: string[] | null) {
    setOvnotasState(ovnotas);
    // Persist so other tabs can read it
    if (ovnotas && ovnotas.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ovnotas));
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
