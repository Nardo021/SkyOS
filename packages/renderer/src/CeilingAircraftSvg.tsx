import type { Aircraft, SkyObject } from "@skyos/types";
import type { RendererOptions } from "./types";
import { formatFlightRoute } from "./airportCodes";
import { formatCeilingAltitude, formatCeilingSpeed, screenHeadingDeg } from "./ceiling";
import { altitudeColor } from "./utils";

export interface CeilingAircraftSvgProps {
  obj: SkyObject;
  ac?: Aircraft;
  x: number;
  y: number;
  selected?: boolean;
  options: Pick<
    RendererOptions,
    | "showCallsign"
    | "showAltitude"
    | "showSpeed"
    | "showRoute"
    | "airportCodeFormat"
    | "useAltitudeColor"
    | "iconScale"
    | "ceilingBearingDeg"
  >;
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

const TABLER_PLANE_PATH =
  "M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3l4 7";

const TABLER_PLANE_CENTER = 12;

export function CeilingAircraftIcon({
  ac,
  x,
  y,
  selected,
  options,
}: Pick<CeilingAircraftSvgProps, "ac" | "x" | "y" | "selected" | "options">) {
  const mapBearing = options.ceilingBearingDeg ?? 0;
  const heading = screenHeadingDeg(ac?.track ?? 0) - mapBearing;

  const fill = selected
    ? "#7dd3fc"
    : options.useAltitudeColor
      ? altitudeColor(ac?.altitudeFeet)
      : "#fbbf24";

  const scale = options.iconScale;
  const iconLen = 14 * scale;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g
        transform={`rotate(${heading - 90}) scale(${iconLen / TABLER_PLANE_CENTER})`}
      >
        <path
          d={TABLER_PLANE_PATH}
          transform={`translate(${-TABLER_PLANE_CENTER}, ${-TABLER_PLANE_CENTER})`}
          fill="none"
          stroke={fill}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </g>
  );
}

export function CeilingAircraftLabels({
  obj,
  ac,
  x,
  y,
  selected,
  options,
}: CeilingAircraftSvgProps) {
  const callsign = (
    ac?.callsign?.trim() ||
    obj.label ||
    ac?.id ||
    "—"
  ).toUpperCase();
  const alt = formatCeilingAltitude(ac?.altitudeFeet);
  const speed = formatCeilingSpeed(ac?.groundSpeed);

  const scale = options.iconScale;
  const fontMain = 11 * scale;
  const fontSub = 9 * scale;
  const labelOffset = 14 * scale * 0.55;

  const meta: string[] = [];
  if (options.showAltitude) meta.push(alt);
  if (options.showSpeed) meta.push(speed);
  const line2 = meta.filter((p) => p && p !== "—").join(" · ");
  const routeLine =
    options.showRoute && ac
      ? formatFlightRoute(ac, options.airportCodeFormat ?? "icao")
      : null;
  let lineY = -4 * scale;
  if (options.showCallsign) lineY += 12 * scale;
  else if (line2) lineY += 8 * scale;
  if (line2) lineY += 12 * scale;

  const hasText =
    options.showCallsign || line2.length > 0 || routeLine != null;
  if (!hasText) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {options.showCallsign ? (
        <text
          x={labelOffset}
          y={-4 * scale}
          fill={selected ? "#e0f2fe" : "#f8fafc"}
          fontSize={fontMain}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          stroke="#000"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {truncate(callsign, 14)}
        </text>
      ) : null}
      {line2 ? (
        <text
          x={labelOffset}
          y={(-4 + (options.showCallsign ? 12 : 8)) * scale}
          fill="#cbd5e1"
          fontSize={fontSub}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          stroke="#000"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {truncate(line2, 28)}
        </text>
      ) : null}
      {routeLine ? (
        <text
          x={labelOffset}
          y={lineY}
          fill="#a5b4fc"
          fontSize={fontSub}
          fontFamily="ui-monospace, monospace"
          stroke="#000"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {truncate(routeLine, 24)}
        </text>
      ) : null}
    </g>
  );
}
