import type { TrailPoint } from "@skyos/types";
import { latLonToCeilingScreen } from "@skyos/coordinates";

export function ceilingRectTrailPolyline(
  points: TrailPoint[],
  userLat: number,
  userLon: number,
  width: number,
  height: number,
  radiusKm: number,
): string | null {
  const parts: string[] = [];
  for (const pt of points) {
    if (pt.lat == null || pt.lon == null) continue;
    const p = latLonToCeilingScreen(
      userLat,
      userLon,
      pt.lat,
      pt.lon,
      width,
      height,
      radiusKm,
    );
    if (!p.visible) continue;
    parts.push(`${p.x},${p.y}`);
  }
  return parts.length >= 2 ? parts.join(" ") : null;
}
