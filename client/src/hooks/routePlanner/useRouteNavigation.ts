import { useCallback } from "react";
import { Waypoint } from "./useWaypoints";
import { Coordinates } from "./useGpsLocation";

export type StartMode = "gps" | "address";
export type RouteDirection = "outbound" | "return";

interface UseRouteNavigationParams {
  waypoints: Waypoint[];
  startCoord: Coordinates | null;
  routeDirection: RouteDirection;
}

export function useRouteNavigation({
  waypoints,
  startCoord,
  routeDirection,
}: UseRouteNavigationParams) {
  const orderedWaypoints =
    routeDirection === "return" ? [...waypoints].reverse() : waypoints;

  const openGoogleMaps = useCallback(() => {
    if (orderedWaypoints.length === 0) return;

    const stops = orderedWaypoints.map(
      (w) => `${w.obra.latitude},${w.obra.longitude}`,
    );

    let origin: string;
    let destination: string;
    let intermediates: string[];

    if (routeDirection === "outbound") {
      destination = stops[stops.length - 1];
      intermediates = stops.slice(0, -1);
      origin = startCoord
        ? `${startCoord.lat},${startCoord.lng}`
        : intermediates.shift()!;
    } else {
      origin = stops[0];
      intermediates = stops.slice(1);
      destination = startCoord
        ? `${startCoord.lat},${startCoord.lng}`
        : (intermediates.pop() ?? origin);
    }

    const waypointsParam =
      intermediates.length > 0 ? `&waypoints=${intermediates.join("|")}` : "";

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    window.open(url, "_blank");
  }, [orderedWaypoints, startCoord, routeDirection]);

  const openWaze = useCallback(() => {
    if (orderedWaypoints.length === 0) return;
    const first = orderedWaypoints[0];
    const url = `https://waze.com/ul?ll=${first.obra.latitude},${first.obra.longitude}&navigate=yes`;
    window.open(url, "_blank");
  }, [orderedWaypoints]);

  return { openGoogleMaps, openWaze, orderedWaypoints };
}
