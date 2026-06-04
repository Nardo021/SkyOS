import { useMemo } from "react";
import type { AirportLabel, RunwaySegment } from "@skyos/types";
import {
  buildCeilingRunwayLayouts,
  latLonToCeilingScreen,
  latLonToLocalMeters,
  localMetersToCeilingScreen,
  ceilingMetersPerPixel,
  type CeilingRunwayLayout,
} from "@skyos/coordinates";
import { formatAirportCodeLines, formatRunwayIdent } from "./airportCodes";
import { rotateMapPoint } from "./ceiling";

const AIRPORT_LABEL_OFFSET_M = 1200;

export interface CeilingRectRunwaysProps {
  runways: RunwaySegment[];
  airportLabels: AirportLabel[];
  userLat: number;
  userLon: number;
  width: number;
  height: number;
  radiusKm: number;
}

export function useCeilingRectRunwayLayout(props: CeilingRectRunwaysProps) {
  const { runways, userLat, userLon, width, height, radiusKm } = props;
  return useMemo(
    () =>
      buildCeilingRunwayLayouts(
        runways,
        userLat,
        userLon,
        width,
        height,
        radiusKm,
      ),
    [runways, userLat, userLon, width, height, radiusKm],
  );
}

export type CeilingRectRunwayLayout = CeilingRunwayLayout[];

export function CeilingRectAirportDots({
  airportLabels,
  userLat,
  userLon,
  width,
  height,
  radiusKm,
}: Pick<
  CeilingRectRunwaysProps,
  "airportLabels" | "userLat" | "userLon" | "width" | "height" | "radiusKm"
>) {
  const dots = useMemo(() => {
    const seen = new Set<string>();
    return airportLabels
      .filter((l) => {
        if (seen.has(l.icao)) return false;
        seen.add(l.icao);
        return true;
      })
      .map((l) =>
        latLonToCeilingScreen(
          userLat,
          userLon,
          l.lat,
          l.lon,
          width,
          height,
          radiusKm,
        ),
      )
      .filter((p) => p.visible);
  }, [airportLabels, userLat, userLon, width, height, radiusKm]);

  return (
    <g aria-label="Airport markers">
      {dots.map((p, i) => (
        <circle
          key={`ap-dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#64748b"
          fillOpacity={0.85}
        />
      ))}
    </g>
  );
}

export function CeilingRectRunwaysGeometry({
  layout,
}: {
  layout: CeilingRectRunwayLayout;
}) {
  return (
    <g aria-label="Runways">
      {layout.map((rw) => (
        <polygon
          key={rw.id}
          points={rw.corners.map((c) => `${c.x},${c.y}`).join(" ")}
          fill="#334155"
          fillOpacity={0.35}
          stroke="#e2e8f0"
          strokeOpacity={0.9}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export function CeilingRectRunwaysLabels({
  layout,
  airportLabels,
  userLat,
  userLon,
  width,
  height,
  radiusKm,
  centerX,
  centerY,
  bearingDeg,
}: {
  layout: CeilingRectRunwayLayout;
  airportLabels: AirportLabel[];
  userLat: number;
  userLon: number;
  width: number;
  height: number;
  radiusKm: number;
  centerX: number;
  centerY: number;
  bearingDeg: number;
}) {
  const airportText = useMemo(() => {
    const seen = new Set<string>();
    return airportLabels
      .filter((l) => {
        if (seen.has(l.icao)) return false;
        seen.add(l.icao);
        return true;
      })
      .map((l) => {
        const enu = latLonToLocalMeters(userLat, userLon, l.lat, l.lon);
        const mpp = ceilingMetersPerPixel(width, radiusKm);
        const center = localMetersToCeilingScreen(
          enu.eastMeters,
          enu.northMeters,
          width,
          height,
          mpp,
        );
        const label = localMetersToCeilingScreen(
          enu.eastMeters,
          enu.northMeters - AIRPORT_LABEL_OFFSET_M,
          width,
          height,
          mpp,
        );
        const onScreen = latLonToCeilingScreen(
          userLat,
          userLon,
          l.lat,
          l.lon,
          width,
          height,
          radiusKm,
        ).visible;
        if (!onScreen) return null;
        const codes = formatAirportCodeLines(l.icao, l.iata);
        const screen = rotateMapPoint(
          label.x,
          label.y,
          centerX,
          centerY,
          bearingDeg,
        );
        return { icao: l.icao, screen, codes };
      })
      .filter((a): a is NonNullable<typeof a> => a != null);
  }, [
    airportLabels,
    userLat,
    userLon,
    width,
    height,
    radiusKm,
    centerX,
    centerY,
    bearingDeg,
  ]);

  const toScreen = (x: number, y: number) =>
    rotateMapPoint(x, y, centerX, centerY, bearingDeg);

  return (
    <g aria-label="Runway and airport labels" pointerEvents="none">
      {layout.map((rw) => (
        <g key={`lbl-${rw.id}`}>
          {rw.leIdent && rw.leText ? (
            <text
              x={toScreen(rw.leText.x, rw.leText.y).x}
              y={toScreen(rw.leText.x, rw.leText.y).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f1f5f9"
              fontSize={10}
              fontWeight={700}
              fontFamily="ui-monospace, monospace"
              stroke="#000"
              strokeWidth={2}
              paintOrder="stroke"
            >
              {formatRunwayIdent(rw.leIdent)}
            </text>
          ) : null}
          {rw.heIdent && rw.heText ? (
            <text
              x={toScreen(rw.heText.x, rw.heText.y).x}
              y={toScreen(rw.heText.x, rw.heText.y).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f1f5f9"
              fontSize={10}
              fontWeight={700}
              fontFamily="ui-monospace, monospace"
              stroke="#000"
              strokeWidth={2}
              paintOrder="stroke"
            >
              {formatRunwayIdent(rw.heIdent)}
            </text>
          ) : null}
        </g>
      ))}

      {airportText.map(({ icao, screen, codes }) => (
        <text
          key={`ap-lbl-${icao}`}
          x={screen.x}
          y={screen.y}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#94a3b8"
          fontFamily="ui-monospace, monospace"
          stroke="#000"
          strokeWidth={2}
          paintOrder="stroke"
        >
          <tspan x={screen.x} fontSize={11} fontWeight={700} fill="#cbd5e1">
            {codes.icao}
          </tspan>
          {codes.iata ? (
            <tspan x={screen.x} dy={13} fontSize={10} fontWeight={600} fill="#94a3b8">
              {codes.iata}
            </tspan>
          ) : null}
        </text>
      ))}
    </g>
  );
}
