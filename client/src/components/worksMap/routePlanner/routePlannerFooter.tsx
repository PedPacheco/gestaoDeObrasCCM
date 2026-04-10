import { StartMode } from "@/hooks/routePlanner/useRouteNavigation";

interface Props {
  hasCoord: boolean;
  canNavigate: boolean;
  startMode: StartMode;
  onOpenGoogleMaps: () => void;
  onOpenWaze: () => void;
}

export function RoutePlannerFooter({
  hasCoord,
  canNavigate,
  startMode,
  onOpenGoogleMaps,
  onOpenWaze,
}: Props) {
  return (
    <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-2 shrink-0">
      {!hasCoord && (
        <p className="text-xs text-amber-600 text-center">
          {startMode === "gps"
            ? "Aguardando localização..."
            : "Informe um endereço de partida"}
        </p>
      )}
      <button
        onClick={onOpenGoogleMaps}
        disabled={!canNavigate}
        className="w-full py-2 bg-[#53FF75] text-[#212E3E] text-sm font-bold rounded-lg hover:brightness-90 disabled:opacity-40 transition-all"
      >
        Abrir no Google Maps
      </button>
      <button
        onClick={onOpenWaze}
        disabled={!canNavigate}
        className="w-full py-2 bg-[#212E3E] text-white text-sm font-semibold rounded-lg hover:bg-[#2a3a50] disabled:opacity-40 transition-all"
      >
        Abrir no Waze (1ª parada)
      </button>
    </div>
  );
}
