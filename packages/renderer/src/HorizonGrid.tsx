import { Line } from "@react-three/drei";
import { useMemo } from "react";

const R = 1;

function meridian(azDeg: number): [number, number, number][] {
  const az = (azDeg * Math.PI) / 180;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 4; i++) {
    const el = (i / 4) * (Math.PI / 2);
    const cosEl = Math.cos(el);
    pts.push([
      cosEl * Math.sin(az),
      Math.sin(el),
      -cosEl * Math.cos(az),
    ]);
  }
  return pts;
}

export function HorizonGrid() {
  const horizon = useMemo(() => {
    const segments = 32;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push([R * Math.sin(t), 0.01, -R * Math.cos(t)]);
    }
    return pts;
  }, []);

  return (
    <group>
      <Line points={horizon} color="#64748b" lineWidth={1.5} />
      {[0, 90].map((az) => (
        <Line
          key={az}
          points={meridian(az)}
          color="#1e293b"
          transparent
          opacity={0.35}
        />
      ))}
      <mesh position={[0, R * 1.03, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
    </group>
  );
}
