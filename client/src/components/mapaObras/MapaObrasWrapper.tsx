"use client";

import dynamic from "next/dynamic";

const MapaObrasComponent = dynamic(() => import("./MapaObrasComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-zinc-500">
      Carregando mapa...
    </div>
  ),
});

interface Props {
  token: string;
}

export default function MapaObrasWrapper({ token }: Props) {
  return <MapaObrasComponent token={token} />;
}
