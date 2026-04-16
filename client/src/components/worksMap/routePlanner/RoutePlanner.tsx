"use client";
import { useCallback, useState } from "react";

import { Coordinates } from "@/hooks/routePlanner/useGpsLocation";
import {
  RouteDirection,
  useRouteNavigation,
} from "@/hooks/routePlanner/useRouteNavigation";
import { useWaypoints } from "@/hooks/routePlanner/useWaypoints";
import { ObraPin } from "@/interfaces/worksMapInterface";

import { RouteDirectionToggle } from "./routeDirectionToggle";
import { RoutePlannerFooter } from "./routePlannerFooter";
import { RoutePlannerHeader } from "./routePlannerHeader";
import { StartLocationPicker } from "./startLocationPicker";
import { WaypointList } from "./waypointList";

interface Props {
  obras: ObraPin[];
  onClose: () => void;
}

export default function RoutePlanner({ obras, onClose }: Props) {
  const [startCoord, setStartCoord] = useState<Coordinates | null>(null);
  const [routeDirection, setRouteDirection] =
    useState<RouteDirection>("outbound");

  const {
    waypoints,
    onDragStart,
    onDragOver,
    onDragEnd,
    remove,
    moveUp,
    moveDown,
  } = useWaypoints(obras);

  const { openGoogleMaps, openWaze } = useRouteNavigation({
    waypoints,
    startCoord,
    routeDirection,
  });

  const handleCoordChange = useCallback(
    (coord: Coordinates | null) => setStartCoord(coord),
    [],
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <RoutePlannerHeader onClose={onClose} />

      <div className="overflow-y-auto flex-1 flex flex-col gap-0">
        <StartLocationPicker onCoordChange={handleCoordChange} />

        <RouteDirectionToggle
          value={routeDirection}
          onChange={setRouteDirection}
        />

        <WaypointList
          waypoints={waypoints}
          routeDirection={routeDirection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onRemove={remove}
        />
      </div>

      <RoutePlannerFooter
        hasCoord={!!startCoord}
        canNavigate={waypoints.length > 0}
        startMode="gps" // derivado do StartLocationPicker se necessário
        onOpenGoogleMaps={openGoogleMaps}
        onOpenWaze={openWaze}
      />
    </div>
  );
}
