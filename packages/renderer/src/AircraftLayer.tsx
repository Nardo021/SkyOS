import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";

import * as THREE from "three";

import type { SkyObject } from "@skyos/types";

import type { Aircraft } from "@skyos/types";

import type { RendererOptions } from "./types";

import { filterSkyObjects } from "./filter";

import {

  type AnimChannel,

  sampleChannel,

  sampleChannelAtEnd,

} from "./interpolate";

import { getAirplaneGeometry, headingRotationY } from "./planeMesh";

import { SkyDomeLabel } from "./SkyDomeLabel";

import {

  altitudeColor,

  buildAircraftMap,

  formatLabel,

  iconSizeForDistance,

} from "./utils";

import {

  AircraftModelInstances,

  modelKeyForAircraft,

  type AircraftInstanceItem,

} from "./AircraftModelInstances";

import {
  resolveAircraftModelKey,
  subscribeAircraftModelLoadFailures,
} from "./aircraftModelCatalog";
import { GlbLoadBoundary } from "./GlbLoadBoundary";



interface AircraftLayerProps {

  skyObjects: SkyObject[];

  aircraft: Aircraft[];

  options: RendererOptions;

  scale?: number;

  dataTick?: number;

}



const MAX_INSTANCES = 400;

const MAX_LABELS = 12;

const _obj = new THREE.Object3D();

const _color = new THREE.Color();

const _pos = new THREE.Vector3();



const planeGeo = getAirplaneGeometry();



function createAircraftMaterial() {

  return new THREE.MeshStandardMaterial({

    color: new THREE.Color(0xffffff),

    vertexColors: true,

    roughness: 0.38,

    metalness: 0.18,

    flatShading: true,

  });

}



function pickLabelTargets(

  skyObjects: SkyObject[],

  selectedId: string | null | undefined,

): SkyObject[] {

  const sorted = [...skyObjects].sort(

    (a, b) => b.elevationDeg - a.elevationDeg,

  );

  const picked = sorted.slice(0, MAX_LABELS);

  if (selectedId) {

    const sel = skyObjects.find((o) => o.id === selectedId);

    if (sel && !picked.some((o) => o.id === sel.id)) {

      picked[MAX_LABELS - 1] = sel;

    }

  }

  return picked;

}



function currentSample(

  ch: AnimChannel,

  nowMs: number,

  interpolate: boolean,

): { x: number; y: number; z: number; heading: number } {

  if (!interpolate) {

    const end = sampleChannelAtEnd(ch);

    return { ...end.pos, heading: end.heading };

  }

  const s = sampleChannel(ch, nowMs);

  return { ...s.pos, heading: s.heading };

}



function groupByModelKey(

  visible: SkyObject[],

  acMap: Map<string, Aircraft>,

): Map<string, AircraftInstanceItem[]> {

  const groups = new Map<string, AircraftInstanceItem[]>();

  const limit = Math.min(visible.length, MAX_INSTANCES);

  for (let i = 0; i < limit; i++) {

    const obj = visible[i];

    const ac = acMap.get(obj.id);

    const key = modelKeyForAircraft(ac);

    const list = groups.get(key) ?? [];

    list.push({ id: obj.id, obj, ac });

    groups.set(key, list);

  }

  return groups;

}



function syncChannels(

  channels: Map<string, AnimChannel>,

  visible: SkyObject[],

  acMap: Map<string, Aircraft>,

  interpolate: boolean,

  durationMs: number,

) {

  const now = performance.now();

  const active = new Set<string>();

  for (const obj of visible) {

    active.add(obj.id);

    const ac = acMap.get(obj.id);

    const heading = ac?.track ?? 0;

    const to = { x: obj.x, y: obj.y, z: obj.z };

    const prev = channels.get(obj.id);

    if (prev) {

      const sampled = currentSample(prev, now, interpolate);

      channels.set(obj.id, {

        from: { x: sampled.x, y: sampled.y, z: sampled.z },

        to,

        fromHeading: sampled.heading,

        toHeading: heading,

        startMs: now,

        durationMs,

      });

    } else {

      channels.set(obj.id, {

        from: to,

        to,

        fromHeading: heading,

        toHeading: heading,

        startMs: now,

        durationMs: 0,

      });

    }

  }

  for (const id of [...channels.keys()]) {

    if (!active.has(id)) channels.delete(id);

  }

}



function ProceduralAircraftMesh({

  visible,

  acMap,

  options,

  scale,

  channelsRef,

  interpolate,

}: {

  visible: SkyObject[];

  acMap: Map<string, Aircraft>;

  options: RendererOptions;

  scale: number;

  channelsRef: React.RefObject<Map<string, AnimChannel>>;

  interpolate: boolean;

}) {

  const meshRef = useRef<THREE.InstancedMesh>(null);

  const instanceMat = useMemo(() => createAircraftMaterial(), []);



  useEffect(() => {

    const mesh = meshRef.current;

    if (!mesh) return;

    mesh.instanceColor = new THREE.InstancedBufferAttribute(

      new Float32Array(MAX_INSTANCES * 3),

      3,

    );

  }, []);



  useFrame(() => {

    const mesh = meshRef.current;

    if (!mesh) return;

    const now = performance.now();

    const count = Math.min(visible.length, MAX_INSTANCES);

    mesh.count = count;

    if (!mesh.instanceColor) {

      mesh.instanceColor = new THREE.InstancedBufferAttribute(

        new Float32Array(MAX_INSTANCES * 3),

        3,

      );

    }

    for (let i = 0; i < count; i++) {

      const obj = visible[i];

      const ac = acMap.get(obj.id);

      const isSelected = obj.id === options.selectedId;

      const size = options.useDistanceScale

        ? iconSizeForDistance(obj.distanceMeters, options.iconScale) * 2.2

        : 0.048 * options.iconScale;

      const ch = channelsRef.current.get(obj.id);

      const sample = ch

        ? currentSample(ch, now, interpolate)

        : { x: obj.x, y: obj.y, z: obj.z, heading: ac?.track ?? 0 };

      _pos.set(sample.x * scale, sample.y * scale, sample.z * scale);

      _obj.position.copy(_pos);

      _obj.rotation.set(0, headingRotationY(sample.heading), 0);

      _obj.scale.setScalar(isSelected ? size * 1.35 : size);

      _obj.updateMatrix();

      mesh.setMatrixAt(i, _obj.matrix);

      if (isSelected) _color.set("#38bdf8");

      else if (options.useAltitudeColor) {

        _color.set(altitudeColor(ac?.altitudeFeet));

      } else _color.set("#fbbf24");

      mesh.setColorAt(i, _color);

    }

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  });



  return (

    <instancedMesh

      ref={meshRef}

      args={[planeGeo, instanceMat, MAX_INSTANCES]}

      frustumCulled={false}

    />

  );

}



function GlbAircraftMeshes({

  groups,

  options,

  scale,

  channelsRef,

  interpolate,

  durationMs,

}: {

  groups: Map<string, AircraftInstanceItem[]>;

  options: RendererOptions;

  scale: number;

  channelsRef: React.RefObject<Map<string, AnimChannel>>;

  interpolate: boolean;

  durationMs: number;

}) {

  return (

    <>

      {[...groups.entries()].map(([modelKey, items]) => (

        <AircraftModelInstances

          key={modelKey}

          modelKey={modelKey}

          items={items}

          options={options}

          scale={scale}

          channelsRef={channelsRef}

          interpolate={interpolate}

          durationMs={durationMs}

        />

      ))}

    </>

  );

}



function AircraftLayerGlb({

  skyObjects,

  aircraft,

  options,

  scale = 0.92,

  dataTick = 0,

}: AircraftLayerProps) {

  const labelRefs = useRef(new Map<string, THREE.Group>());

  const channelsRef = useRef(new Map<string, AnimChannel>());

  const acMap = useMemo(() => buildAircraftMap(aircraft), [aircraft]);

  const visible = useMemo(

    () =>

      filterSkyObjects(

        skyObjects,

        aircraft,

        options.aircraftFilter ?? "all",

      ),

    [skyObjects, aircraft, options.aircraftFilter],

  );

  const interpolate =

    options.interpolateMotion !== false &&

    (options.interpolationDurationMs ?? 0) > 0;

  const durationMs = options.interpolationDurationMs ?? 1000;

  const showAnyLabel =

    options.showCallsign ||

    options.showAltitude ||

    options.showSpeed ||

    options.showHeading ||

    options.showRoute;

  const labelTargets = useMemo(

    () =>

      showAnyLabel

        ? pickLabelTargets(visible, options.selectedId)

        : [],

    [visible, options.selectedId, showAnyLabel],

  );

  const [modelLoadEpoch, setModelLoadEpoch] = useState(0);

  useEffect(
    () => subscribeAircraftModelLoadFailures(() => setModelLoadEpoch((n) => n + 1)),
    [],
  );

  const modelGroups = useMemo(

    () => groupByModelKey(visible, acMap),

    [visible, acMap, modelLoadEpoch],

  );



  useEffect(() => {

    syncChannels(

      channelsRef.current,

      visible,

      acMap,

      interpolate,

      durationMs,

    );

  }, [visible, acMap, dataTick, durationMs, interpolate]);



  useFrame(() => {

    if (!showAnyLabel) return;

    const now = performance.now();

    for (const obj of labelTargets) {

      const ac = acMap.get(obj.id);

      const size = options.useDistanceScale

        ? iconSizeForDistance(obj.distanceMeters, options.iconScale)

        : 0.022 * options.iconScale;

      const ch = channelsRef.current.get(obj.id);

      const sample = ch

        ? currentSample(ch, now, interpolate)

        : { x: obj.x, y: obj.y, z: obj.z };

      const labelGroup = labelRefs.current.get(obj.id);

      if (labelGroup) {

        labelGroup.position.set(

          sample.x * scale,

          sample.y * scale + size + 0.03,

          sample.z * scale,

        );

      }

    }

  });



  return (

    <group>

      <GlbAircraftMeshes

        groups={modelGroups}

        options={options}

        scale={scale}

        channelsRef={channelsRef}

        interpolate={interpolate}

        durationMs={durationMs}

      />

      {showAnyLabel

        ? labelTargets.map((obj) => {

            const ac = acMap.get(obj.id);

            const selected = options.selectedId === obj.id;

            const size = options.useDistanceScale

              ? iconSizeForDistance(obj.distanceMeters, options.iconScale)

              : 0.022 * options.iconScale;

            const ch = channelsRef.current.get(obj.id);

            const sample = ch

              ? currentSample(ch, performance.now(), interpolate)

              : { x: obj.x, y: obj.y, z: obj.z };

            const pos: [number, number, number] = [

              sample.x * scale,

              sample.y * scale + size + 0.03,

              sample.z * scale,

            ];

            return (

              <group

                key={`lbl-${obj.id}`}

                ref={(el) => {

                  if (el) labelRefs.current.set(obj.id, el);

                  else labelRefs.current.delete(obj.id);

                }}

                position={pos}

              >

                <SkyDomeLabel

                  position={[0, 0, 0]}

                  color={selected ? "#7dd3fc" : "#e2e8f0"}

                  fontSize={0.03 * options.iconScale}

                >

                  {formatLabel(obj, ac, options)}

                </SkyDomeLabel>

              </group>

            );

          })

        : null}

    </group>

  );

}



export function AircraftLayer(props: AircraftLayerProps) {

  const {

    skyObjects,

    aircraft,

    options,

    scale = 0.92,

    dataTick = 0,

  } = props;

  const channelsRef = useRef(new Map<string, AnimChannel>());

  const acMap = useMemo(() => buildAircraftMap(aircraft), [aircraft]);

  const visible = useMemo(

    () =>

      filterSkyObjects(

        skyObjects,

        aircraft,

        options.aircraftFilter ?? "all",

      ),

    [skyObjects, aircraft, options.aircraftFilter],

  );

  const interpolate =

    options.interpolateMotion !== false &&

    (options.interpolationDurationMs ?? 0) > 0;

  const durationMs = options.interpolationDurationMs ?? 1000;



  useEffect(() => {

    syncChannels(

      channelsRef.current,

      visible,

      acMap,

      interpolate,

      durationMs,

    );

  }, [visible, acMap, dataTick, durationMs, interpolate]);



  return (

    <Suspense

      fallback={

        <ProceduralAircraftMesh

          visible={visible}

          acMap={acMap}

          options={options}

          scale={scale}

          channelsRef={channelsRef}

          interpolate={interpolate}

        />

      }

    >

      <GlbLoadBoundary
        fallback={
          <ProceduralAircraftMesh
            visible={visible}
            acMap={acMap}
            options={options}
            scale={scale}
            channelsRef={channelsRef}
            interpolate={interpolate}
          />
        }
      >
        <AircraftLayerGlb {...props} />
      </GlbLoadBoundary>

    </Suspense>

  );

}



export { resolveAircraftModelKey };


