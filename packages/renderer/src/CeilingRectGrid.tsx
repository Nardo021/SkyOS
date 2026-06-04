import { rotateMapPoint } from "./ceiling";

interface CeilingRectGridProps {
  width: number;
  height: number;
  radiusKm: number;
  showGrid?: boolean;
  showRangeRings?: boolean;
  omitCompassLabels?: boolean;
}

function gridStepKm(radiusKm: number): number {
  if (radiusKm <= 15) return 2;
  if (radiusKm <= 35) return 5;
  if (radiusKm <= 75) return 10;
  return 20;
}

export function CeilingRectGrid({
  width,
  height,
  radiusKm,
  showGrid = true,
  showRangeRings = true,
  omitCompassLabels = false,
}: CeilingRectGridProps) {
  const cx = width / 2;
  const cy = height / 2;
  const halfWidthKm = radiusKm;
  const halfHeightKm = radiusKm * (height / width);

  const step = gridStepKm(radiusKm);
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (showGrid) {
    for (let km = -halfWidthKm; km <= halfWidthKm; km += step) {
      if (Math.abs(km) < 0.001) continue;
      const x = cx + (km / halfWidthKm) * (width / 2);
      if (x < 0 || x > width) continue;
      lines.push({ x1: x, y1: 0, x2: x, y2: height });
    }
    for (let km = -halfHeightKm; km <= halfHeightKm; km += step) {
      if (Math.abs(km) < 0.001) continue;
      const y = cy - (km / halfHeightKm) * (height / 2);
      if (y < 0 || y > height) continue;
      lines.push({ x1: 0, y1: y, x2: width, y2: y });
    }
  }

  const ringFractions = [0.25, 0.5, 0.75];
  const edgePad = Math.min(width, height) * 0.04;

  return (
    <g aria-hidden pointerEvents="none">
      {showGrid
        ? lines.map((l, i) => (
            <line
              key={`g-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))
        : null}

      {showRangeRings
        ? ringFractions.map((f) => {
            const ringKm = radiusKm * f;
            const rx = (ringKm / halfWidthKm) * (width / 2);
            const ry = (ringKm / halfHeightKm) * (height / 2);
            return (
              <ellipse
                key={`ring-${f}`}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke="#334155"
                strokeWidth={1}
                strokeOpacity={0.45}
                strokeDasharray="4 6"
              />
            );
          })
        : null}

      <line
        x1={cx - 12}
        y1={cy}
        x2={cx + 12}
        y2={cy}
        stroke="#64748b"
        strokeWidth={1.5}
      />
      <line
        x1={cx}
        y1={cy - 12}
        x2={cx}
        y2={cy + 12}
        stroke="#64748b"
        strokeWidth={1.5}
      />
      <circle cx={cx} cy={cy} r={5} fill="#38bdf8" fillOpacity={0.9} />
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {omitCompassLabels ? null : (
        <>
          <text
            x={cx}
            y={edgePad + 10}
            textAnchor="middle"
            fill="#64748b"
            fontSize={12}
            fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            N
          </text>
          <text
            x={width - edgePad}
            y={cy + 4}
            textAnchor="end"
            fill="#64748b"
            fontSize={12}
            fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            E
          </text>
          <text
            x={cx}
            y={height - edgePad}
            textAnchor="middle"
            fill="#64748b"
            fontSize={12}
            fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            S
          </text>
          <text
            x={edgePad}
            y={cy + 4}
            textAnchor="start"
            fill="#64748b"
            fontSize={12}
            fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            W
          </text>
        </>
      )}
    </g>
  );
}

const COMPASS_FONT =
  "ui-sans-serif, system-ui, sans-serif";

export function CeilingRectCompassLabels({
  width,
  height,
  centerX,
  centerY,
  bearingDeg,
}: {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  bearingDeg: number;
}) {
  const edgePad = Math.min(width, height) * 0.04;

  const markers: { key: string; mapX: number; mapY: number; anchor: string }[] =
    [
      { key: "N", mapX: centerX, mapY: edgePad + 10, anchor: "middle" },
      {
        key: "E",
        mapX: width - edgePad,
        mapY: centerY + 4,
        anchor: "end",
      },
      { key: "S", mapX: centerX, mapY: height - edgePad, anchor: "middle" },
      { key: "W", mapX: edgePad, mapY: centerY + 4, anchor: "start" },
    ];

  return (
    <g aria-hidden pointerEvents="none">
      {markers.map(({ key, mapX, mapY, anchor }) => {
        const { x, y } = rotateMapPoint(
          mapX,
          mapY,
          centerX,
          centerY,
          bearingDeg,
        );
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor={anchor as "middle" | "end" | "start"}
            dominantBaseline="middle"
            fill="#64748b"
            fontSize={12}
            fontWeight={600}
            fontFamily={COMPASS_FONT}
          >
            {key}
          </text>
        );
      })}
    </g>
  );
}
