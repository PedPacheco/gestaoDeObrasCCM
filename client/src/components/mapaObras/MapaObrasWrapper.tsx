"use client";

import dynamic from "next/dynamic";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";

const MapaObrasComponent = dynamic(
  () => import("./MapaObrasComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Carregando mapa...
      </div>
    ),
  }
);

interface Props {
  filtersData: FiltersInterface;
  token: string;
}

export default function MapaObrasWrapper({ filtersData, token }: Props) {
  return <MapaObrasComponent filtersData={filtersData} token={token} />;
}
