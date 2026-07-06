import { describe, it, expect } from "vitest";
import { deliveryHealth, sinkingGreen, type WorkstreamHealth } from "./delivery";

const ws: WorkstreamHealth[] = [
  { id: "a", reported: "green", actual: "green", trend: "flat" },
  { id: "b", reported: "green", actual: "amber", trend: "down" }, // reads green, actually worse
  { id: "c", reported: "amber", actual: "amber", trend: "up" },
  { id: "d", reported: "green", actual: "green", trend: "down" }, // green but sinking
  { id: "e", reported: "red", actual: "red", trend: "flat" },
];

describe("deliveryHealth", () => {
  it("indexes actual health (green100/amber60/red25) and counts at-risk + reporting gaps", () => {
    const h = deliveryHealth(ws);
    // actuals: 100,60,60,100,25 -> avg 69
    expect(h.index).toBe(69);
    expect(h.atRisk).toBe(3);  // b,c,e not green
    expect(h.gaps).toBe(1);    // only b reported != actual
  });
  it("is 100 for an empty board (no divide-by-zero)", () => {
    expect(deliveryHealth([]).index).toBe(100);
  });
});

describe("sinkingGreen", () => {
  it("flags reported-green workstreams whose actual is worse or trend is down", () => {
    const flags = sinkingGreen(ws);
    expect(flags.map((f) => f.id).sort()).toEqual(["b", "d"]);
  });
  it("labels the reason: actual-worse takes precedence over trend", () => {
    const flags = sinkingGreen(ws);
    expect(flags.find((f) => f.id === "b")!.reason).toBe("reads-green-actually-worse");
    expect(flags.find((f) => f.id === "d")!.reason).toBe("green-trending-down");
  });
  it("does not flag a healthy green or an honestly-amber workstream", () => {
    const flags = sinkingGreen(ws);
    expect(flags.some((f) => f.id === "a" || f.id === "c" || f.id === "e")).toBe(false);
  });
});
