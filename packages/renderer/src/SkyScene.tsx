import { memo, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls, useGLTF } from "@react-three/drei";
import { MOUSE } from "three";
import { preloadCommonAircraftModels } from "./aircraftModelCatalog";
import type { SceneProps } from "./types";
import { filterSkyObjects, filterTrailsByIds } from "./filter";
import { HorizonGrid } from "./HorizonGrid";
import { AircraftLayer } from "./AircraftLayer";
import { RunwayLayer } from "./RunwayLayer";
import { TrailLayer } from "./TrailLayer";
import { CompassOverlay } from "./CompassOverlay";
import { RenderFrameLoop } from "./RenderFrameLoop";

function InvalidateOnDemand({ tick }: { tick: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [tick, invalidate]);
  return null;
}

/** Ensures first frame paints when frameloop is `demand`. */
function EnsureFirstFrame() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

function PreloadAircraftModels() {
  useEffect(() => {
    preloadCommonAircraftModels((url) => useGLTF.preload(url));
  }, []);
  return null;
}

const DomeWireframe = memo(function DomeWireframe() {
  const lines: [number, number, number][][] = [];
  const rings = 2;
  const segments = 16;
  for (let r = 1; r <= rings; r++) {
    const el = (r / rings) * (Math.PI / 2);
    const ringR = Math.cos(el);
    const y = Math.sin(el);
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const az = (i / segments) * Math.PI * 2;
      pts.push([ringR * Math.sin(az), y, -ringR * Math.cos(az)]);
    }
    lines.push(pts);
  }

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#1e293b" transparent opacity={0.35} />
      ))}
    </group>
  );
});

function DomeControls() {
  const invalidate = useThree((s) => s.invalidate);
  return (
    <OrbitControls
      enablePan
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.PAN,
        RIGHT: MOUSE.PAN,
      }}
      minDistance={0.5}
      maxDistance={4}
      target={[0, 0.3, 0]}
      enableDamping={false}
      onChange={() => invalidate()}
    />
  );
}

const SceneContent = memo(function SceneContent({
  observer,
  skyObjects,
  aircraft,
  trails,
  runways,
  airportLabels,
  options,
  tick,
}: SceneProps & { tick: number }) {
  const visible = useMemo(
    () =>
      filterSkyObjects(
        skyObjects,
        aircraft,
        options.aircraftFilter ?? "all",
      ),
    [skyObjects, aircraft, options.aircraftFilter],
  );
  const visibleIds = useMemo(
    () => new Set(visible.map((o) => o.id)),
    [visible],
  );
  const filteredTrails = useMemo(
    () => filterTrailsByIds(trails, visibleIds),
    [trails, visibleIds],
  );

  const animate =
    options.interpolateMotion !== false &&
    (options.interpolationDurationMs ?? 0) > 0;
  const fpsMode = options.renderFpsMode ?? "display";
  const renderFps = options.renderFps ?? 60;

  return (
    <>
      <RenderFrameLoop
        mode={fpsMode}
        fps={renderFps}
        animate={animate}
      />
      <EnsureFirstFrame />
      <PreloadAircraftModels />
      {!animate ? <InvalidateOnDemand tick={tick} /> : null}
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight
        args={["#7dd3fc", "#0f172a", 0.45]}
        position={[0, 1, 0]}
      />
      <directionalLight position={[3, 5, 2]} intensity={0.9} />
      <directionalLight position={[-2, 3, -3]} intensity={0.35} />
      <DomeWireframe />
      {options.showHorizon ? <HorizonGrid /> : null}
      {options.showRunways ? (
        <RunwayLayer
          runways={runways}
          airportLabels={airportLabels}
          observer={observer}
        />
      ) : null}
      {options.showTrails ? (
        <TrailLayer trails={filteredTrails} />
      ) : null}
      <AircraftLayer
        skyObjects={skyObjects}
        aircraft={aircraft}
        options={options}
        dataTick={tick}
      />
      <DomeControls />
    </>
  );
});

export function SkyScene({
  observer,
  skyObjects,
  aircraft,
  trails,
  runways,
  airportLabels,
  options,
  dataTick = 0,
}: SceneProps & { dataTick?: number }) {
  const tick = dataTick;
  const animate =
    options.interpolateMotion !== false &&
    (options.interpolationDurationMs ?? 0) > 0;
  const fpsMode = options.renderFpsMode ?? "display";
  const frameloop =
    animate && fpsMode === "display" ? "always" : "demand";

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0.2, 2.2], fov: 55, near: 0.1, far: 100 }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 2]}
        frameloop={frameloop}
        performance={{ min: 0.5, max: 1, debounce: 150 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
      >
        <SceneContent
          observer={observer}
          skyObjects={skyObjects}
          aircraft={aircraft}
          trails={trails}
          runways={runways}
          airportLabels={airportLabels}
          options={options}
          tick={tick}
        />
      </Canvas>
      <CompassOverlay visible={options.showHorizon} />
    </div>
  );
}
