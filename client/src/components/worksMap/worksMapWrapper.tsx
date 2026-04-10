"use client";

import dynamic from "next/dynamic";

const WorksMapComponent = dynamic(() => import("./worksMapComponent"), {
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

export default function WorksMapWrapper({ token }: Props) {
  return <WorksMapComponent token={token} />;
}
