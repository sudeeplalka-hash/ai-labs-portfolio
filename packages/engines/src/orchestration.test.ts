import { describe, it, expect } from "vitest";
import { agentTimeline } from "./orchestration";

describe("agentTimeline", () => {
  it("lays the steps out in order between Decompose and Assemble", () => {
    const t = agentTimeline(["A", "B", "C"], 10);
    expect(t.map((s) => s.label)).toEqual(["Decompose", "A", "B", "C", "Assemble"]);
  });

  it("produces contiguous spans starting at 0", () => {
    const t = agentTimeline(["A", "B"], 10);
    expect(t[0].startS).toBe(0);
    for (let i = 1; i < t.length; i++) expect(t[i].startS).toBeCloseTo(t[i - 1].endS, 6);
  });

  it("sums to the authored total latency", () => {
    const t = agentTimeline(["A", "B", "C", "D"], 9.6);
    expect(t[t.length - 1].endS).toBeCloseTo(9.6, 6);
    expect(t.reduce((a, s) => a + s.durationS, 0)).toBeCloseTo(9.6, 6);
  });

  it("splits the supervisor fraction evenly across decompose and assemble", () => {
    const t = agentTimeline(["A", "B"], 10, { supervisorFraction: 0.2 });
    const decompose = t[0].durationS;
    const assemble = t[t.length - 1].durationS;
    expect(decompose + assemble).toBeCloseTo(2, 6); // 20% of 10
    expect(decompose).toBeCloseTo(assemble, 6);
  });

  it("splits the remaining work evenly across the steps", () => {
    const t = agentTimeline(["A", "B"], 10, { supervisorFraction: 0.2 }); // work 8 → 4 each
    expect(t[1].durationS).toBeCloseTo(4, 6);
    expect(t[2].durationS).toBeCloseTo(4, 6);
  });

  it("handles zero steps (decompose + assemble only)", () => {
    const t = agentTimeline([], 10);
    expect(t.map((s) => s.label)).toEqual(["Decompose", "Assemble"]);
    expect(t[t.length - 1].endS).toBeCloseTo(10, 6);
  });
});
