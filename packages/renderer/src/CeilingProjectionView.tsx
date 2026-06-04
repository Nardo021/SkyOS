import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Observer } from "@skyos/types";
import type { SceneProps } from "./types";
import {
  CeilingAircraftIcon,
  CeilingAircraftLabels,
} from "./CeilingAircraftSvg";
import {
  CeilingRectAirportDots,
  CeilingRectRunwaysGeometry,
  CeilingRectRunwaysLabels,
  useCeilingRectRunwayLayout,
} from "./CeilingRectRunways";
import { CeilingRectCompassLabels, CeilingRectGrid } from "./CeilingRectGrid";
import { rotateMapPoint } from "./ceiling";
import { ceilingRectTrailPolyline } from "./ceilingRectTrail";
import { filterAircraftForDisplay } from "./filter";
import { latLonToRectScreenPoint } from "./latLonToRectScreen";
import { useCeilingRectMotion } from "./useCeilingRectMotion";
import { buildAircraftMap } from "./utils";

const emptyMessages: Record<string, string> = {
  all: "视野内暂无飞机",
  air: "暂无空中飞机",
  ground: "暂无地面飞机",
};

export interface CeilingProjectionViewProps extends SceneProps {
  observer: Observer;
  radiusKm: number;
  dataTick?: number;
  bearingDeg?: number;
  bearingLocked?: boolean;
  onBearingChange?: (deg: number) => void;
}

export function CeilingProjectionView({
  skyObjects,
  aircraft,
  trails,
  runways,
  airportLabels,
  options,
  observer,
  radiusKm,
  dataTick = 0,
  bearingDeg = 0,
  bearingLocked = false,
  onBearingChange,
}: CeilingProjectionViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const dragRef = useRef<{
    startBearing: number;
    startPointerAngle: number;
  } | null>(null);

  const bearing = ((bearingDeg % 360) + 360) % 360;
  const cx = size.w / 2;
  const cy = size.h / 2;

  const pointerAngleFromCenter = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * size.w;
      const sy = ((clientY - rect.top) / rect.height) * size.h;
      const deg =
        (Math.atan2(sx - cx, cy - sy) * 180) / Math.PI;
      return ((deg % 360) + 360) % 360;
    },
    [size.w, size.h, cx, cy],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (bearingLocked || !onBearingChange || e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startBearing: bearing,
        startPointerAngle: pointerAngleFromCenter(e.clientX, e.clientY),
      };
    },
    [bearing, bearingLocked, onBearingChange, pointerAngleFromCenter],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !onBearingChange) return;
      const angle = pointerAngleFromCenter(e.clientX, e.clientY);
      let delta = angle - drag.startPointerAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      onBearingChange(((drag.startBearing + delta) % 360 + 360) % 360);
    },
    [onBearingChange, pointerAngleFromCenter],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const acMap = useMemo(() => buildAircraftMap(aircraft), [aircraft]);
  const filter = options.aircraftFilter ?? "all";
  const interpolate =
    options.interpolateMotion !== false &&
    (options.interpolationDurationMs ?? 0) > 0;
  const durationMs = options.interpolationDurationMs ?? 1000;

  const visibleAircraft = useMemo(() => {
    const filtered = filterAircraftForDisplay(aircraft, skyObjects, filter);
    return filtered.filter((ac) =>
      latLonToRectScreenPoint({
        userLat: observer.lat,
        userLon: observer.lon,
        aircraftLat: ac.lat,
        aircraftLon: ac.lon,
        width: size.w,
        height: size.h,
        radiusKm,
      }).visible,
    );
  }, [
    aircraft,
    skyObjects,
    filter,
    observer.lat,
    observer.lon,
    size.w,
    size.h,
    radiusKm,
  ]);

  const positions = useCeilingRectMotion(
    visibleAircraft,
    observer.lat,
    observer.lon,
    size.w,
    size.h,
    radiusKm,
    dataTick,
    durationMs,
    interpolate,
  );

  const visibleIds = useMemo(
    () => new Set(visibleAircraft.map((a) => a.id)),
    [visibleAircraft],
  );

  const trailSegments = useMemo(() => {
    if (!options.showTrails) return [];
    return Object.entries(trails)
      .filter(([id, pts]) => visibleIds.has(id) && pts.length >= 2)
      .map(([id, pts]) => ({
        id,
        d: ceilingRectTrailPolyline(
          pts,
          observer.lat,
          observer.lon,
          size.w,
          size.h,
          radiusKm,
        ),
      }))
      .filter((s): s is { id: string; d: string } => s.d != null);
  }, [
    trails,
    visibleIds,
    options.showTrails,
    observer.lat,
    observer.lon,
    size.w,
    size.h,
    radiusKm,
  ]);

  const skyById = useMemo(
    () => new Map(skyObjects.map((o) => [o.id, o])),
    [skyObjects],
  );

  const mapOptions = useMemo(
    () => ({ ...options, ceilingBearingDeg: bearing }),
    [options, bearing],
  );

  const runwayLayout = useCeilingRectRunwayLayout({
    runways,
    airportLabels,
    userLat: observer.lat,
    userLon: observer.lon,
    width: size.w,
    height: size.h,
    radiusKm,
  });

  const toScreen = useCallback(
    (x: number, y: number) => rotateMapPoint(x, y, cx, cy, bearing),
    [cx, cy, bearing],
  );

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-0 overflow-hidden bg-black ${
        bearingLocked || !onBearingChange
          ? ""
          : "cursor-grab active:cursor-grabbing"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title={
        bearingLocked
          ? undefined
          : "拖动地图旋转朝向；可在工具栏输入角度或锁定"
      }
    >
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Ceiling rectangular map"
      >
        <g transform={bearing === 0 ? undefined : `rotate(${bearing} ${cx} ${cy})`}>
          <CeilingRectGrid
            width={size.w}
            height={size.h}
            radiusKm={radiusKm}
            showGrid
            showRangeRings
            omitCompassLabels
          />

          {options.showRunways ? (
            <>
              <CeilingRectRunwaysGeometry layout={runwayLayout} />
              <CeilingRectAirportDots
                airportLabels={airportLabels}
                userLat={observer.lat}
                userLon={observer.lon}
                width={size.w}
                height={size.h}
                radiusKm={radiusKm}
              />
            </>
          ) : null}

          {trailSegments.map(({ id, d }) => (
            <polyline
              key={`trail-${id}`}
              points={d}
              fill="none"
              stroke="#fbbf24"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {visibleAircraft.map((ac) => {
            const pos =
              positions.get(ac.id) ??
              latLonToRectScreenPoint({
                userLat: observer.lat,
                userLon: observer.lon,
                aircraftLat: ac.lat,
                aircraftLon: ac.lon,
                width: size.w,
                height: size.h,
                radiusKm,
              });
            const obj = skyById.get(ac.id);
            if (!obj) return null;
            return (
              <CeilingAircraftIcon
                key={`icon-${ac.id}`}
                ac={ac}
                x={pos.x}
                y={pos.y}
                selected={options.selectedId === ac.id}
                options={mapOptions}
              />
            );
          })}
        </g>

        <g pointerEvents="none" aria-label="Map labels">
          <CeilingRectCompassLabels
            width={size.w}
            height={size.h}
            centerX={cx}
            centerY={cy}
            bearingDeg={bearing}
          />
          {options.showRunways ? (
            <CeilingRectRunwaysLabels
              layout={runwayLayout}
              airportLabels={airportLabels}
              userLat={observer.lat}
              userLon={observer.lon}
              width={size.w}
              height={size.h}
              radiusKm={radiusKm}
              centerX={cx}
              centerY={cy}
              bearingDeg={bearing}
            />
          ) : null}
          {visibleAircraft.map((ac) => {
            const pos =
              positions.get(ac.id) ??
              latLonToRectScreenPoint({
                userLat: observer.lat,
                userLon: observer.lon,
                aircraftLat: ac.lat,
                aircraftLon: ac.lon,
                width: size.w,
                height: size.h,
                radiusKm,
              });
            const obj = skyById.get(ac.id);
            if (!obj) return null;
            const screen = toScreen(pos.x, pos.y);
            return (
              <CeilingAircraftLabels
                key={`lbl-${ac.id}`}
                obj={obj}
                ac={ac}
                x={screen.x}
                y={screen.y}
                selected={options.selectedId === ac.id}
                options={mapOptions}
              />
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-slate-600">
        {radiusKm} km · {Math.round(bearing)}°
      </div>

      {visibleAircraft.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          {emptyMessages[filter] ?? emptyMessages.all}
        </div>
      ) : null}
    </div>
  );
}
