import { useMemo } from "react";

import { Line } from "@react-three/drei";

import type { TrailPoint } from "@skyos/types";

import { resolveCeilingUvPercent, skyDirToAzEl } from "./ceiling";



const MAX_TRAIL_LINES = 48;



interface TrailLayerProps {

  trails: Record<string, TrailPoint[]>;

  scale?: number;

}



function trailPoints3d(

  points: TrailPoint[],

  scale: number,

): [number, number, number][] {

  return points.map(

    (p) => [p.x * scale, p.y * scale, p.z * scale] as [number, number, number],

  );

}



export function TrailLayer({ trails, scale = 0.92 }: TrailLayerProps) {

  const segments = useMemo(() => {

    return Object.entries(trails)

      .filter(([, pts]) => pts.length >= 2)

      .slice(0, MAX_TRAIL_LINES)

      .map(([id, points]) => ({

        id,

        pts: trailPoints3d(points, scale),

      }));

  }, [trails, scale]);



  return (

    <group>

      {segments.map(({ id, pts }) => (

        <Line

          key={id}

          points={pts}

          color="#fbbf24"

          transparent

          opacity={0.55}

          lineWidth={1}

        />

      ))}

    </group>

  );

}



/** Ceiling SVG polyline in 0–100 viewBox coords (2D polar projection). */

export function ceilingTrailPolyline(

  points: TrailPoint[],

  tailAzEl?: { azimuthDeg: number; elevationDeg: number },

): string | null {

  if (points.length < 2) return null;

  const pairs = points.map((p) => {

    const { azimuthDeg, elevationDeg } = skyDirToAzEl(p.x, p.y, p.z);

    const { u, v } = resolveCeilingUvPercent(azimuthDeg, elevationDeg);

    return `${u},${v}`;

  });

  if (tailAzEl && pairs.length > 0) {

    const { u, v } = resolveCeilingUvPercent(

      tailAzEl.azimuthDeg,

      tailAzEl.elevationDeg,

    );

    pairs[pairs.length - 1] = `${u},${v}`;

  }

  if (pairs.length < 2) return null;

  return pairs.join(" ");

}


