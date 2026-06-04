import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { AirportLabel, Observer, RunwaySegment } from "@skyos/types";
import { buildSkyDomeRunwayLines, latLonAltToSkyDome } from "@skyos/coordinates";
import { SkyDomeLabel } from "./SkyDomeLabel";
import { formatAirportCodeLines } from "./airportCodes";

const MAX_AIRPORT_LABELS = 32;

function formatAirportCodes(icao: string, iata?: string): string {
  const { icao: four, iata: three } = formatAirportCodeLines(icao, iata);
  return three ? `${four}\n${three}` : four;
}

interface RunwayLayerProps {
  runways: RunwaySegment[];
  airportLabels: AirportLabel[];
  observer: Observer;
  scale?: number;
}

export function RunwayLayer({
  runways,
  airportLabels,
  observer,
  scale = 0.92,
}: RunwayLayerProps) {
  const lines = useMemo(
    () =>
      buildSkyDomeRunwayLines(runways, observer).map((r) => ({
        id: r.id,
        pts: [
          [r.x1 * scale, r.y1 * scale, r.z1 * scale],
          [r.x2 * scale, r.y2 * scale, r.z2 * scale],
        ] as [number, number, number][],
      })),
    [runways, observer, scale],
  );

  const labels = useMemo(() => {
    const seen = new Set<string>();
    const unique = airportLabels.filter((l) => {
      if (seen.has(l.icao)) return false;
      seen.add(l.icao);
      return true;
    });
    return unique
      .sort(
        (a, b) =>
          (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
      )
      .slice(0, MAX_AIRPORT_LABELS)
      .map((l) => {
        const sky = latLonAltToSkyDome(
          observer.lat,
          observer.lon,
          observer.altitudeM,
          l.lat,
          l.lon,
          0,
        );
        if (!sky) return null;
        return {
          icao: l.icao,
          iata: l.iata,
          x: sky.x * scale,
          y: sky.y * scale,
          z: sky.z * scale,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [airportLabels, observer, scale]);

  return (
    <group>
      {lines.map(({ id, pts }) => (
        <Line
          key={id}
          points={pts}
          color="#e2e8f0"
          transparent
          opacity={0.75}
          lineWidth={1.25}
        />
      ))}
      {labels.map((l) => (
        <SkyDomeLabel
          key={`ap-${l.icao}`}
          position={[l.x, l.y, l.z]}
          color="#cbd5e1"
          fontSize={0.022}
          anchorY="middle"
        >
          {formatAirportCodes(l.icao, l.iata)}
        </SkyDomeLabel>
      ))}
    </group>
  );
}

export function formatAirportLabelText(icao: string, iata?: string): string {
  return formatAirportCodes(icao, iata);
}
