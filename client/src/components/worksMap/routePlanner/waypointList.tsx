import { RouteDirection } from "@/hooks/routePlanner/useRouteNavigation";
import { Waypoint } from "@/hooks/routePlanner/useWaypoints";
import { WaypointItem } from "./waypointItem";

interface Props {
  waypoints: Waypoint[];
  routeDirection: RouteDirection;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
}

export function WaypointList({
  waypoints,
  routeDirection,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const orderedWaypoints =
    routeDirection === "return" ? [...waypoints].reverse() : waypoints;

  return (
    <div>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
          Paradas ({waypoints.length})
        </span>
        <span className="text-xs text-zinc-400">Arraste para reordenar</span>
      </div>

      <div className="px-2 pb-3">
        {orderedWaypoints.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            Nenhuma obra selecionada
          </p>
        ) : (
          orderedWaypoints.map((wp, visualIndex) => {
            const realIndex =
              routeDirection === "return"
                ? waypoints.length - 1 - visualIndex
                : visualIndex;

            return (
              <WaypointItem
                key={wp.obra.id}
                waypoint={wp}
                visualIndex={visualIndex}
                realIndex={realIndex}
                isFirst={realIndex === 0}
                isLast={realIndex === waypoints.length - 1}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onRemove={onRemove}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
