import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

let _geometry: THREE.BufferGeometry | null = null;

/** Low-poly 3D aircraft: fuselage + wings + tail (nose toward +Z). */
export function getAirplaneGeometry(): THREE.BufferGeometry {
  if (_geometry) return _geometry;

  const fuselage = new THREE.CylinderGeometry(0.07, 0.055, 0.42, 10, 1);
  fuselage.rotateX(Math.PI / 2);

  const wing = new THREE.BoxGeometry(0.58, 0.04, 0.16);

  const tailPlane = new THREE.BoxGeometry(0.2, 0.025, 0.09);
  tailPlane.translate(0, 0.02, -0.24);

  const fin = new THREE.BoxGeometry(0.025, 0.14, 0.07);
  fin.translate(0, 0.09, -0.23);

  const nose = new THREE.ConeGeometry(0.055, 0.1, 10);
  nose.rotateX(-Math.PI / 2);
  nose.translate(0, 0, 0.26);

  const merged = mergeGeometries(
    [fuselage, wing, tailPlane, fin, nose],
    false,
  );
  if (!merged) {
    _geometry = fuselage;
    return _geometry;
  }

  merged.computeVertexNormals();
  merged.center();
  const box = new THREE.Box3().setFromBufferAttribute(
    merged.getAttribute("position") as THREE.BufferAttribute,
  );
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  merged.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);

  _geometry = merged;
  return _geometry;
}

/** Y-axis rotation (rad) so nose points along track (° from north, clockwise). */
export function headingRotationY(trackDeg: number | undefined): number {
  const t = trackDeg ?? 0;
  return Math.PI - (t * Math.PI) / 180;
}
