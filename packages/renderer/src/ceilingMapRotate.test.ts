import { describe, expect, it } from "vitest";
import { rotateMapPoint } from "./ceiling";

describe("rotateMapPoint", () => {
  it("leaves point unchanged at 0°", () => {
    expect(rotateMapPoint(100, 50, 50, 50, 0)).toEqual({ x: 100, y: 50 });
  });

  it("rotates north marker to east when bearing is 90°", () => {
    const p = rotateMapPoint(50, 10, 50, 50, 90);
    expect(p.x).toBeCloseTo(90, 0);
    expect(p.y).toBeCloseTo(50, 0);
  });
});
