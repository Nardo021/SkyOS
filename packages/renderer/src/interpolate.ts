export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface AnimChannel {
  from: Vec3;
  to: Vec3;
  fromHeading: number;
  toHeading: number;
  startMs: number;
  durationMs: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3 {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    z: lerp(from.z, to.z, t),
  };
}

/** Shortest-path interpolation for degrees (0–360). */
export function lerpHeadingDeg(from: number, to: number, t: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return from + delta * t;
}

export function sampleChannel(
  ch: AnimChannel,
  nowMs: number,
): { pos: Vec3; heading: number; alpha: number } {
  const alpha =
    ch.durationMs <= 0
      ? 1
      : Math.min(1, Math.max(0, (nowMs - ch.startMs) / ch.durationMs));
  return {
    pos: lerpVec3(ch.from, ch.to, alpha),
    heading: lerpHeadingDeg(ch.fromHeading, ch.toHeading, alpha),
    alpha,
  };
}

export function sampleChannelAtEnd(ch: AnimChannel): { pos: Vec3; heading: number } {
  return { pos: ch.to, heading: ch.toHeading };
}
