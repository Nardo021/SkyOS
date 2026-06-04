import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { RenderFpsMode } from "./types";

interface RenderFrameLoopProps {
  mode: RenderFpsMode;
  fps: number;
  /** When false, only repaint on explicit invalidate (e.g. camera move). */
  animate: boolean;
}

/** Drives Canvas refresh: native display rate or capped custom FPS. */
export function RenderFrameLoop({ mode, fps, animate }: RenderFrameLoopProps) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!animate || mode !== "custom") return;
    const clamped = Math.min(240, Math.max(24, Math.round(fps)));
    const intervalMs = 1000 / clamped;
    const id = window.setInterval(() => invalidate(), intervalMs);
    return () => window.clearInterval(id);
  }, [animate, mode, fps, invalidate]);

  return null;
}
