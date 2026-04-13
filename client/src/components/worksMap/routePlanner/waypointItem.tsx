import { Waypoint } from "@/hooks/routePlanner/useWaypoints";

interface Props {
  waypoint: Waypoint;
  visualIndex: number;
  realIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
}

export function WaypointItem({
  waypoint,
  visualIndex,
  realIndex,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const location = [waypoint.obra.municipio, waypoint.obra.bairro]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      draggable
      onDragStart={() => onDragStart(realIndex)}
      onDragOver={(e) => onDragOver(e, realIndex)}
      onDragEnd={onDragEnd}
      className="flex items-center gap-2 px-2 py-2 mb-1 bg-white border border-zinc-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors"
    >
      <span className="w-6 h-6 rounded-full bg-[#212E3E] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {visualIndex + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-zinc-800 truncate">
          {waypoint.obra.ovnota}
        </div>
        {location && (
          <div className="text-xs text-zinc-400 truncate">{location}</div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={() => onMoveUp(realIndex)}
          disabled={isFirst}
          aria-label="Mover para cima"
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-xs leading-none p-0.5"
        >
          ▲
        </button>
        <button
          onClick={() => onMoveDown(realIndex)}
          disabled={isLast}
          aria-label="Mover para baixo"
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-xs leading-none p-0.5"
        >
          ▼
        </button>
      </div>

      <button
        onClick={() => onRemove(realIndex)}
        aria-label={`Remover ${waypoint.obra.ovnota}`}
        className="text-zinc-300 hover:text-red-500 transition-colors text-sm shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
