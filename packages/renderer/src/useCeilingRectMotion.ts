import { useEffect, useRef, useState } from "react";
import type { Aircraft } from "@skyos/types";
import { latLonToCeilingScreen } from "@skyos/coordinates";

export interface RectScreenPosition {
  x: number;
  y: number;
  visible: boolean;
}

export function useCeilingRectMotion(
  aircraft: Aircraft[],
  userLat: number,
  userLon: number,
  width: number,
  height: number,
  radiusKm: number,
  dataTick: number,
  durationMs: number,
  interpolate: boolean,
): Map<string, RectScreenPosition> {
  const [positions, setPositions] = useState<Map<string, RectScreenPosition>>(
    () => new Map(),
  );
  const fromRef = useRef<Map<string, RectScreenPosition>>(new Map());
  const startRef = useRef(0);

  useEffect(() => {
    const next = new Map<string, RectScreenPosition>();
    for (const ac of aircraft) {
      const target = latLonToCeilingScreen(
        userLat,
        userLon,
        ac.lat,
        ac.lon,
        width,
        height,
        radiusKm,
      );
      next.set(ac.id, { x: target.x, y: target.y, visible: target.visible });
    }

    if (!interpolate || durationMs <= 0) {
      setPositions(next);
      fromRef.current = next;
      return;
    }

    fromRef.current = new Map(positions);
    startRef.current = performance.now();

    let raf = 0;
    const tick = () => {
      const t = Math.min(
        1,
        (performance.now() - startRef.current) / durationMs,
      );
      const eased = t * (2 - t);
      const blended = new Map<string, RectScreenPosition>();
      for (const [id, end] of next) {
        const start = fromRef.current.get(id) ?? end;
        blended.set(id, {
          x: start.x + (end.x - start.x) * eased,
          y: start.y + (end.y - start.y) * eased,
          visible: end.visible,
        });
      }
      setPositions(blended);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = next;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    aircraft,
    userLat,
    userLon,
    width,
    height,
    radiusKm,
    dataTick,
    durationMs,
    interpolate,
  ]);

  return positions;
}
