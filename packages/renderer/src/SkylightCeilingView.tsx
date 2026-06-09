import { useCallback, useEffect, useMemo, useRef } from "react";
import { Renderer, type Tle } from "@skyos/skylight";
import type { AirportLabel, Observer, RunwaySegment } from "@skyos/types";
import type { SceneProps } from "./types";
import {
  skyosToDisplayConfig,
  skyosToSkylightAircraft,
  type SkyosCeilingSettings,
} from "./adapters/skyosToSkylight";
import { cn } from "./cn";
import { filterAircraftForDisplay } from "./filter";

export interface SkylightCeilingViewProps extends SceneProps {
  observer: Observer;
  ceilingSettings: SkyosCeilingSettings;
  bearingLocked?: boolean;
  onBearingChange?: (deg: number) => void;
  fetchTle?: () => Promise<Tle[]>;
}

export function SkylightCeilingView({
  aircraft,
  skyObjects,
  runways,
  airportLabels,
  options,
  observer,
  ceilingSettings,
  bearingLocked = false,
  onBearingChange,
  fetchTle,
}: SkylightCeilingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const configRef = useRef(skyosToDisplayConfig(observer, ceilingSettings));
  const dragRef = useRef<{
    startBearing: number;
    startPointerAngle: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  configRef.current = skyosToDisplayConfig(observer, ceilingSettings);

  const filteredAircraft = useMemo(
    () =>
      filterAircraftForDisplay(
        aircraft,
        skyObjects,
        options.aircraftFilter ?? "all",
      ),
    [aircraft, skyObjects, options.aircraftFilter],
  );

  const skylightAircraft = useMemo(
    () => filteredAircraft.map(skyosToSkylightAircraft),
    [filteredAircraft],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new Renderer(canvas, () => configRef.current, { fetchTle });
    rendererRef.current = r;
    r.start();
    const onResize = () => r.resize();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      r.stop();
      rendererRef.current = null;
    };
  }, [fetchTle]);

  useEffect(() => {
    rendererRef.current?.setAirports(runways, airportLabels);
  }, [runways, airportLabels]);

  useEffect(() => {
    rendererRef.current?.update(skylightAircraft);
  }, [skylightAircraft]);

  const pointerAngleFromCenter = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const deg = (Math.atan2(clientX - cx, cy - clientY) * 180) / Math.PI;
      return ((deg % 360) + 360) % 360;
    },
    [],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (bearingLocked || !onBearingChange || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startBearing: ceilingSettings.ceilingBearingDeg,
        startPointerAngle: pointerAngleFromCenter(e.clientX, e.clientY),
      };
    },
    [
      bearingLocked,
      onBearingChange,
      pointerAngleFromCenter,
      ceilingSettings.ceilingBearingDeg,
    ],
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

  const bearing = Math.round(ceilingSettings.ceilingBearingDeg);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full min-h-0 overflow-hidden bg-black",
        !bearingLocked &&
          onBearingChange &&
          "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title={
        bearingLocked
          ? undefined
          : "拖动旋转朝向；可在工具栏输入角度或锁定"
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-label="Ceiling projection"
      />
      <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-muted-foreground">
        {ceilingSettings.radiusKm} km · {bearing}° ·{" "}
        {ceilingSettings.projectionMode}
      </div>
    </div>
  );
}
