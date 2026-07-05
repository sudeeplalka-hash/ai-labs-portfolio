// Radar / spider chart geometry — pure math so a lab can draw a factor radar without
// re-deriving trig. Values are placed evenly around a circle starting at 12 o'clock
// (top) and going clockwise; each vertex sits at (value / max) × radius from center.

export interface Pt {
  x: number;
  y: number;
}

const angleAt = (i: number, n: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / n;

/** Value-scaled vertices for a radar polygon. Values are clamped to [0, max]. */
export function radarVertices(values: number[], radius: number, max = 100, cx = 0, cy = 0): Pt[] {
  const n = values.length;
  return values.map((v, i) => {
    const a = angleAt(i, n);
    const r = (Math.max(0, Math.min(max, v)) / max) * radius;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/** The outer axis endpoints (at full radius) for `n` spokes. */
export function radarAxes(n: number, radius: number, cx = 0, cy = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = angleAt(i, n);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  });
}

/** Join points into an SVG polygon/points string. */
export const pointsToStr = (pts: Pt[]): string => pts.map((p) => `${p.x},${p.y}`).join(" ");
