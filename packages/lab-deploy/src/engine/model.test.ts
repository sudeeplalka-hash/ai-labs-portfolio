import { describe, it, expect } from "vitest";
import {
  deriveBaseline, computeOps, envelopeGrid, driftSeries, runIncident, deployVerdict,
} from "./model";
import type { ProgramState } from "@labs/program-core";

const state = (over: Partial<ProgramState["initiative"]> = {}, extra: Partial<ProgramState> = {}): ProgramState => ({
  initiative: {
    name: "Test", rawAmbition: "", sharpenedProblem: null,
    params: { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" },
    selectedUseCase: null, scope: 0.5, successMetric: null,
    scores: { value: 70, feasibility: 65, dataReadiness: 60 }, valueHypothesis: null, createdAt: null,
    ...over,
  },
  progress: { frame: "done", data: "active", build: "active", deploy: "active", govern: "active" },
  ...extra,
});

const lev = { volumePerDay: 5000, tier: "small" as const, cachePct: 0, reranker: false };

describe("deploy model", () => {
  it("derives a sane baseline from Framing", () => {
    const b = deriveBaseline(state());
    expect(b.baseCostPerQuery).toBeGreaterThan(0);
    expect(b.sloReliability).toBeGreaterThan(0.9);
    expect(b.suggestedVolume).toBeGreaterThan(0);
  });

  it("scales: more volume → higher monthly cost, higher p95, eventually red", () => {
    const b = deriveBaseline(state());
    const low = computeOps(b, { ...lev, volumePerDay: 500 });
    const high = computeOps(b, { ...lev, volumePerDay: 200000 });
    expect(high.monthlyCost).toBeGreaterThan(low.monthlyCost);
    expect(high.p95).toBeGreaterThan(low.p95);
    expect(high.utilization).toBeGreaterThan(low.utilization);
    expect(high.zone).toBe("red");
  });

  it("caching lowers cost per query", () => {
    const b = deriveBaseline(state());
    const no = computeOps(b, { ...lev, cachePct: 0 });
    const cached = computeOps(b, { ...lev, cachePct: 60 });
    expect(cached.costPerQuery).toBeLessThan(no.costPerQuery);
  });

  it("large tier cuts escalation (better quality) but costs more compute", () => {
    const b = deriveBaseline(state());
    const small = computeOps(b, { ...lev, tier: "small" });
    const large = computeOps(b, { ...lev, tier: "large" });
    expect(large.escalationRate).toBeLessThan(small.escalationRate);
    expect(large.computeCost).toBeGreaterThan(small.computeCost);
  });

  it("weaker data → more hallucination → more drift risk", () => {
    const strong = driftSeries(deriveBaseline(state({ scores: { value: 70, feasibility: 65, dataReadiness: 90 } })));
    const weak = driftSeries(deriveBaseline(state({ scores: { value: 70, feasibility: 65, dataReadiness: 30 } })));
    expect(weak.driftRisk).toBeGreaterThan(strong.driftRisk);
    expect(weak.points.some((p) => p.refreshed)).toBe(true);
  });

  it("envelope grid covers all load × cache combinations", () => {
    const cells = envelopeGrid(deriveBaseline(state()), lev);
    expect(cells.length).toBe(8 * 5);
    expect(new Set(cells.map((c) => c.zone)).size).toBeGreaterThan(1);
  });

  it("incident spikes then recovers with a positive MTTR", () => {
    const b = deriveBaseline(state());
    const run = runIncident(b, lev, "outage");
    const base = computeOps(b, lev);
    expect(Math.max(...run.ticks.map((t) => t.p95))).toBeGreaterThan(base.p95);
    expect(run.ticks[run.ticks.length - 1].phase).toBe("recovered");
    expect(run.mttrMin).toBeGreaterThan(0);
  });

  it("verdict flags overload at extreme scale", () => {
    const b = deriveBaseline(state());
    expect(deployVerdict(b, computeOps(b, { ...lev, volumePerDay: 200000 })).tone).not.toBe("healthy");
  });
});
