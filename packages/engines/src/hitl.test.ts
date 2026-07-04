import { describe, it, expect } from "vitest";
import { reviewed, DEFAULT_ITEMS, SAMPLE_INDICES, type Item } from "./hitl";

describe("DEFAULT_ITEMS", () => {
  it("has 20 items with exactly 4 engineered edge cases", () => {
    expect(DEFAULT_ITEMS).toHaveLength(20);
    expect(DEFAULT_ITEMS.filter((x) => x.edge)).toHaveLength(4);
  });
  it("places every edge on a high or med item (auto-approvable, would error)", () => {
    for (const item of DEFAULT_ITEMS) if (item.edge) expect(item.risk === "high" || item.risk === "med").toBe(true);
  });
  it("encodes severity from the risk tier (high 50 · med 20 · low 5)", () => {
    for (const item of DEFAULT_ITEMS) {
      expect(item.sev).toBe(item.risk === "high" ? 50 : item.risk === "med" ? 20 : 5);
    }
  });
});

describe("reviewed policy by autonomy level", () => {
  it("L1 reviews everything", () => {
    expect(DEFAULT_ITEMS.every((x, i) => reviewed(1, x, i))).toBe(true);
  });
  it("L2 reviews all non-low items", () => {
    DEFAULT_ITEMS.forEach((x, i) => expect(reviewed(2, x, i)).toBe(x.risk !== "low"));
  });
  it("L3 reviews high-risk only", () => {
    DEFAULT_ITEMS.forEach((x, i) => expect(reviewed(3, x, i)).toBe(x.risk === "high"));
  });
  it("L4 reviews exactly the sampled indices", () => {
    DEFAULT_ITEMS.forEach((x, i) => expect(reviewed(4, x, i)).toBe(SAMPLE_INDICES.has(i)));
  });
  it("L5 (full autonomy) reviews nothing", () => {
    expect(DEFAULT_ITEMS.some((x, i) => reviewed(5, x, i))).toBe(false);
  });
});

describe("the engineered edges", () => {
  it("the two medium edges (7, 15) slip at high-only (L3) but are caught at L2", () => {
    for (const idx of [7, 15]) {
      const item = DEFAULT_ITEMS[idx];
      expect(item.edge).toBe(true);
      expect(item.risk).toBe("med");
      expect(reviewed(3, item, idx)).toBe(false);
      expect(reviewed(2, item, idx)).toBe(true);
    }
  });
  it("the two high edges (6, 14) are still caught at L3", () => {
    for (const idx of [6, 14]) {
      const item = DEFAULT_ITEMS[idx];
      expect(item.edge).toBe(true);
      expect(item.risk).toBe("high");
      expect(reviewed(3, item, idx)).toBe(true);
    }
  });
});
