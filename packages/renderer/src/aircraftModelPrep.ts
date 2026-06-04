import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

/** Merge meshes, normalize scale, align longest axis to +Z (nose). */
export function geometryFromGltf(root: THREE.Object3D): THREE.BufferGeometry {
  root.updateMatrixWorld(true);

  const parts: THREE.BufferGeometry[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const g = mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    parts.push(g);
  });

  const merged =
    parts.length > 1
      ? mergeGeometries(parts, false)
      : parts[0]?.clone() ?? new THREE.BoxGeometry(0.1, 0.1, 0.3);

  if (!merged) {
    return new THREE.BoxGeometry(0.1, 0.1, 0.3);
  }

  merged.computeVertexNormals();
  _box.setFromBufferAttribute(
    merged.getAttribute("position") as THREE.BufferAttribute,
  );
  _box.getCenter(_center);
  _box.getSize(_size);
  merged.translate(-_center.x, -_center.y, -_center.z);

  const axis =
    _size.x >= _size.y && _size.x >= _size.z
      ? "x"
      : _size.y >= _size.z
        ? "y"
        : "z";
  if (axis === "x") merged.rotateZ(Math.PI / 2);
  else if (axis === "y") merged.rotateX(-Math.PI / 2);

  _box.setFromBufferAttribute(
    merged.getAttribute("position") as THREE.BufferAttribute,
  );
  _box.getSize(_size);
  const maxDim = Math.max(_size.x, _size.y, _size.z, 1e-6);
  merged.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);

  return merged;
}

export function createTintedAircraftMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff),
    vertexColors: false,
    roughness: 0.42,
    metalness: 0.12,
  });
}

export function createAircraftMaterialFromGltf(
  root: THREE.Object3D,
): THREE.MeshStandardMaterial {
  const mat = createTintedAircraftMaterial();

  root.traverse((obj) => {
    if (mat.map) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const sources = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const source of sources) {
      if (!source) continue;
      if (
        source instanceof THREE.MeshStandardMaterial ||
        source instanceof THREE.MeshPhysicalMaterial
      ) {
        if (source.map) {
          mat.map = source.map;
          mat.map.colorSpace = THREE.SRGBColorSpace;
        }
        mat.metalness = source.metalness ?? mat.metalness;
        mat.roughness = source.roughness ?? mat.roughness;
        if (source.normalMap) mat.normalMap = source.normalMap;
        return;
      }
      if (source instanceof THREE.MeshBasicMaterial && source.map) {
        mat.map = source.map;
        mat.map.colorSpace = THREE.SRGBColorSpace;
        return;
      }
    }
  });

  return mat;
}
