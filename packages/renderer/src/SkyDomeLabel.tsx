import { memo } from "react";
import { Billboard, Text } from "@react-three/drei";

export interface SkyDomeLabelProps {
  position: [number, number, number];
  children: string;
  color?: string;
  fontSize?: number;
  anchorY?: "bottom" | "middle" | "top";
}

/** World-space label (no DOM); scales with scene, not distanceFactor. */
export const SkyDomeLabel = memo(function SkyDomeLabel({
  position,
  children,
  color = "#e2e8f0",
  fontSize = 0.032,
  anchorY = "bottom",
}: SkyDomeLabelProps) {
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY={anchorY}
        outlineWidth={0.012}
        outlineColor="#000000"
        sdfGlyphSize={32}
        maxWidth={0.55}
      >
        {children}
      </Text>
    </Billboard>
  );
});
