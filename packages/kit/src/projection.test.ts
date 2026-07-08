import { describe, it, expect } from "vitest";
import { dot, l2normalize, dist2, pca3, kmeans, sphereLayout } from "./projection";

const mulberry = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function randRows(n: number, d: number, seed = 7): number[][] {
  const r = mulberry(seed);
  return Array.from({ length: n }, () => l2normalize(Array.from({ length: d }, () => r() * 2 - 1)));
}

function meanOf(rows: number[][]): number[] {
  const d = rows[0].length;
  const m = new Array(d).fill(0);
  for (const v of rows) for (let j = 0; j < d; j++) m[j] += v[j];
  return m.map((x) => x / rows.length);
}

describe("projection math (shared engine)", () => {
  it("dot / l2normalize / dist2 basics", () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    const u = l2normalize([3, 4]);
    expect(Math.hypot(u[0], u[1])).toBeCloseTo(1, 12);
    expect(l2normalize([0, 0])).toEqual([0, 0]);
    expect(dist2([0, 0], [3, 4])).toBe(25);
  });

  it("pca3 is deterministic: identical input, identical components", () => {
    const rows = randRows(24, 40);
    const m = meanOf(rows);
    const a = pca3(rows, m);
    const b = pca3(rows.map((r) => r.slice()), m.slice());
    expect(a).toEqual(b);
  });

  it("pca3 components are unit-length and mutually orthogonal", () => {
    const rows = randRows(30, 25, 11);
    const comps = pca3(rows, meanOf(rows));
    for (const c of comps) expect(Math.sqrt(dot(c, c))).toBeCloseTo(1, 6);
    expect(Math.abs(dot(comps[0], comps[1]))).toBeLessThan(1e-6);
    expect(Math.abs(dot(comps[0], comps[2]))).toBeLessThan(1e-6);
    expect(Math.abs(dot(comps[1], comps[2]))).toBeLessThan(1e-6);
  });

  it("pca3 first component captures the dominant variance direction", () => {
    // Points spread widely along axis 0, tiny noise on axis 1.
    const r = mulberry(3);
    const rows = Array.from({ length: 40 }, (_, i) => [i - 20 + r() * 0.01, (r() - 0.5) * 0.01, 0]);
    const comps = pca3(rows, meanOf(rows));
    expect(Math.abs(comps[0][0])).toBeGreaterThan(0.99);
  });

  it("kmeans separates two obvious blobs deterministically", () => {
    const a = Array.from({ length: 10 }, (_, i) => [10 + (i % 3) * 0.01, 10]);
    const b = Array.from({ length: 10 }, (_, i) => [-10 - (i % 3) * 0.01, -10]);
    const assign = kmeans([...a, ...b], 2);
    const g1 = new Set(assign.slice(0, 10));
    const g2 = new Set(assign.slice(10));
    expect(g1.size).toBe(1);
    expect(g2.size).toBe(1);
    expect([...g1][0]).not.toBe([...g2][0]);
    expect(kmeans([...a, ...b], 2)).toEqual(assign);
  });

  it("kmeans handles empty input", () => {
    expect(kmeans([], 3)).toEqual([]);
  });

  it("sphereLayout points sit on the unit sphere", () => {
    for (const p of sphereLayout(17)) {
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 9);
    }
    expect(sphereLayout(17)).toEqual(sphereLayout(17));
  });
});
