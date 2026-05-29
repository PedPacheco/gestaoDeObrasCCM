import { ObraPin } from "@/types/worksMapInterface";
import { useState, useRef, useCallback } from "react";

export interface Waypoint {
  obra: ObraPin;
  order: number;
}

export function useWaypoints(initial: ObraPin[]) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    initial.map((obra, i) => ({ obra, order: i })),
  );
  const dragIndex = useRef<number | null>(null);

  const onDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setWaypoints((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragIndex.current = null;
  }, []);

  const remove = useCallback((index: number) => {
    setWaypoints((prev) =>
      prev.filter((_, i) => i !== index).map((w, i) => ({ ...w, order: i })),
    );
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setWaypoints((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setWaypoints((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  return {
    waypoints,
    onDragStart,
    onDragOver,
    onDragEnd,
    remove,
    moveUp,
    moveDown,
  };
}
