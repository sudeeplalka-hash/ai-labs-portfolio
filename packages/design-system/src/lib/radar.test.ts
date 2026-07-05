import { describe, it, expect } from "vitest";
import { radarVertices, radarAxes, pointsToStr } from "./radar";

const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe("radarVertices", () => {
  it("places four max-value points at top, right, bottom, left", () => {
    const v = radarVertices([100, 100, 100, 100], 10, 100, 0, 0);
    near(v[0].x, 0); near(v[0].y, -10);  // top
    near(v[1].x, 10); near(v[1].y, 0);   // right
    near(v[2].x, 0); near(v[2].y, 10);   // bottom
    near(v[3].x, -10); near(v[3].y, 0);  // left
  });

  it("puts a zero value at the center", () => {
    const v = radarVertices([0], 10, 100, 5, 5);
    near(v[0].x, 5); near(v[0].y, 5);
  });

  it("scales radius linearly with value", () => {
    const v = radarVertices([50], 10, 100); // half of max → half radius, at top
    near(v[0].x, 0); near(v[0].y, -5);
  });

  it("clamps values above max and below 0", () => {
    const hi = radarVertices([250], 10, 100);
    near(hi[0].y, -10); // clamped to max → full radius
    const lo = radarVertices([-40], 10, 100);
    near(lo[0].y, 0); // clamped to 0 → center
  });
});

describe("radarAxes", () => {
  it("returns n endpoints at the full radius", () => {
    const ax = radarAxes(4, 10);
    near(ax[0].y, -10);
    near(ax[1].x, 10);
    expect(ax).toHaveLength(4);
  });
});

describe("pointsToStr", () => {
  it("joins points into an SVG points string", () => {
    expect(pointsToStr([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("1,2 3,4");
  });
});
