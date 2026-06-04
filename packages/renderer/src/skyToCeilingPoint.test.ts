import { describe, expect, it } from "vitest";
import { skyToCeilingPoint } from "./skyToCeilingPoint";

const W = 1000;
const H = 1000;
const approx = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

describe("skyToCeilingPoint", () => {
  it("zenith at center", () => {
    const p = skyToCeilingPoint(0, 90, W, H);
    expect(approx(p.x, 500)).toBe(true);
    expect(approx(p.y, 500)).toBe(true);
  });

  it("north on horizon at top", () => {
    const p = skyToCeilingPoint(0, 0, W, H);
    expect(approx(p.x, 500)).toBe(true);
    expect(approx(p.y, 20)).toBe(true);
  });

  it("east on horizon at right", () => {
    const p = skyToCeilingPoint(90, 0, W, H);
    expect(approx(p.x, 980)).toBe(true);
    expect(approx(p.y, 500)).toBe(true);
  });

  it("south on horizon at bottom", () => {
    const p = skyToCeilingPoint(180, 0, W, H);
    expect(approx(p.x, 500)).toBe(true);
    expect(approx(p.y, 980)).toBe(true);
  });

  it("west on horizon at left", () => {
    const p = skyToCeilingPoint(270, 0, W, H);
    expect(approx(p.x, 20)).toBe(true);
    expect(approx(p.y, 500)).toBe(true);
  });
});
