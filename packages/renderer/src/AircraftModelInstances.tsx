import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "@skyos/types";
import type { SkyObject } from "@skyos/types";
import type { RendererOptions } from "./types";
import {
  type AnimChannel,
  sampleChannel,
  sampleChannelAtEnd,
} from "./interpolate";
import { headingRotationY } from "./planeMesh";
import {
  aircraftModelUrl,
  DEFAULT_AIRCRAFT_MODEL_KEY,
  effectiveAircraftModelKey,
  resolveAircraftModelKey,
} from "./aircraftModelCatalog";
import { GlbLoadBoundary } from "./GlbLoadBoundary";
import {
  createAircraftMaterialFromGltf,
  geometryFromGltf,
} from "./aircraftModelPrep";
import {
  altitudeColor,
  buildAircraftMap,
  iconSizeForDistance,
} from "./utils";

export interface AircraftInstanceItem {
  id: string;
  obj: SkyObject;
  ac?: Aircraft;
}

interface AircraftModelInstancesProps {
  modelKey: string;
  items: AircraftInstanceItem[];
  options: RendererOptions;
  scale: number;
  channelsRef: React.RefObject<Map<string, AnimChannel>>;
  interpolate: boolean;
  durationMs: number;
}

const _obj = new THREE.Object3D();
const _color = new THREE.Color();

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

function AircraftModelInstancesInner({
  modelKey,
  items,
  options,
  scale,
  channelsRef,
  interpolate,
}: AircraftModelInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const url = aircraftModelUrl(modelKey);
  const gltf = useGLTF(url);
  const geometry = useMemo(() => geometryFromGltf(gltf.scene), [gltf]);
  const material = useMemo(
    () => createAircraftMaterialFromGltf(gltf.scene),
    [gltf],
  );
  const count = items.length;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    mesh.count = count;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3,
    );
  }, [count, geometry]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    const now = performance.now();
    mesh.count = count;

    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3,
      );
    }

    for (let i = 0; i < count; i++) {
      const { id, obj, ac } = items[i];
      const isSelected = id === options.selectedId;
      const size = options.useDistanceScale
        ? iconSizeForDistance(obj.distanceMeters, options.iconScale) * 2.4
        : 0.05 * options.iconScale;

      const ch = channelsRef.current?.get(id);
      const sample = ch
        ? currentSample(ch, now, interpolate)
        : { x: obj.x, y: obj.y, z: obj.z, heading: ac?.track ?? 0 };

      _obj.position.set(
        sample.x * scale,
        sample.y * scale,
        sample.z * scale,
      );
      _obj.rotation.set(0, headingRotationY(sample.heading), 0);
      _obj.scale.setScalar(isSelected ? size * 1.35 : size);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);

      if (isSelected) {
        _color.set("#38bdf8");
      } else if (options.useAltitudeColor) {
        _color.set(altitudeColor(ac?.altitudeFeet));
      } else {
        _color.set("#fbbf24");
      }
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

export function AircraftModelInstances(props: AircraftModelInstancesProps) {
  const modelKey = effectiveAircraftModelKey(props.modelKey);
  const inner = <AircraftModelInstancesInner {...props} modelKey={modelKey} />;

  if (modelKey === DEFAULT_AIRCRAFT_MODEL_KEY) {
    return inner;
  }

  return (
    <GlbLoadBoundary
      modelKey={modelKey}
      fallback={
        <AircraftModelInstancesInner
          {...props}
          modelKey={DEFAULT_AIRCRAFT_MODEL_KEY}
        />
      }
    >
      {inner}
    </GlbLoadBoundary>
  );
}

export function modelKeyForAircraft(ac: Aircraft | undefined): string {
  return effectiveAircraftModelKey(
    resolveAircraftModelKey(ac?.icaoType, ac?.emitterCategory),
  );
}
