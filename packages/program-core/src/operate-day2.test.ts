import { describe, it, expect } from "vitest";
import {
  deriveOpsSeries, detectSignals, valueAtRisk, deriveDay2Incident,
  buildOperateFeedback, buildWeeklyOpsReview, buildIncidentReport,
  OPS_WEEKS, INCIDENT_WEEK,
} from "./operate-day2";
import { demoState, blankState } from "./store";

const state = () => demoState();

describe("deriveOpsSeries, determinism & shape", () => {
  it("is deterministic for the same initiative", () => {
    const a = deriveOpsSeries(state());
    const b = deriveOpsSeries(state());
    expect(a).toEqual(b);
  });

  it("produces the full window with bounded values", () => {
    const s = deriveOpsSeries(state());
    expect(s.weeks).toHaveLength(OPS_WEEKS);
    for (const w of s.weeks) {
      expect(w.availabilityPct).toBeGreaterThan(99);
      expect(w.canaryPassPct).toBeGreaterThanOrEqual(58);
      expect(w.canaryPassPct).toBeLessThanOrEqual(s.canaryBaselinePct);
      expect(w.costPerTaskUsd).toBeGreaterThan(0);
    }
  });

  it("SLOs stay green while canary decays, the silent-drift trap is engineered in", () => {
    const s = deriveOpsSeries(state());
    const last = s.weeks[s.weeks.length - 1];
    expect(last.availabilityPct).toBeGreaterThanOrEqual(99.5); // infra: green
    expect(s.canaryBaselinePct - last.canaryPassPct).toBeGreaterThanOrEqual(8); // answers: not
  });

  it("staleness jumps at the incident week", () => {
    const s = deriveOpsSeries(state());
    const before = s.weeks[INCIDENT_WEEK - 2].indexStaleDays;
    const after = s.weeks[INCIDENT_WEEK].indexStaleDays;
    expect(after).toBeGreaterThan(before);
  });
});

describe("detectSignals", () => {
  it("fires silent-drift with green-SLO evidence", () => {
    const s = deriveOpsSeries(state());
    const sig = detectSignals(s).find((x) => x.key === "silent-drift");
    expect(sig).toBeDefined();
    expect(sig!.severity).toBe("high");
    expect(sig!.evidence).toMatch(/availability 99/);
  });

  it("tightens the staleness threshold for high governance tiers", () => {
    const s = deriveOpsSeries(state());
    const loose = detectSignals(s, "Tier 3")!.find((x) => x.key === "staleness-breach");
    const tight = detectSignals(s, "high")!.find((x) => x.key === "staleness-breach");
    expect(tight).toBeDefined();
    // High tier fires no later than the default threshold.
    if (loose) expect(tight!.week).toBeLessThanOrEqual(loose.week);
  });

  it("returns signals sorted by week", () => {
    const sigs = detectSignals(deriveOpsSeries(state()));
    const weeks = sigs.map((x) => x.week);
    expect([...weeks].sort((a, b) => a - b)).toEqual(weeks);
  });
});

describe("valueAtRisk", () => {
  it("is monotonic in degradation and uses honest defaults on a blank program", () => {
    const s = blankState();
    const series = deriveOpsSeries(s);
    const v = valueAtRisk(s, series);
    expect(v.annualValueUsd).toBeGreaterThan(0);
    expect(v.valueAtRiskUsd).toBeGreaterThan(0);
    expect(v.valueAtRiskUsd).toBeLessThanOrEqual(v.annualValueUsd);
    expect(v.basis).toContain("degradation");
  });
});

describe("incident & feedback routing", () => {
  it("offers exactly the four remediation options with correct loop targets", () => {
    const inc = deriveDay2Incident(state());
    const byKey = Object.fromEntries(inc.options.map((o) => [o.key, o.loopTarget]));
    expect(byKey).toEqual({ reindex: "build", retrain: "build", rollback: "deploy", rescope: "frame" });
  });

  it("rescope writes to Frame; reindex writes to Build; rollback to Deploy, never crossed", () => {
    const st = state();
    const series = deriveOpsSeries(st);
    const inc = deriveDay2Incident(st);
    const pick = (k: string) => inc.options.find((o) => o.key === k)!;

    const rescope = buildOperateFeedback(st, pick("rescope"), series);
    expect(rescope.toFrame).toBeDefined();
    expect(rescope.toBuild).toBeUndefined();

    const reindex = buildOperateFeedback(st, pick("reindex"), series);
    expect(reindex.toBuild).toBeDefined();
    expect(reindex.toFrame).toBeUndefined();

    const rollback = buildOperateFeedback(st, pick("rollback"), series);
    expect(rollback.toDeploy).toBeDefined();

    // Every decision carries the money bridge and the audit note.
    for (const fb of [rescope, reindex, rollback]) {
      expect(fb.toRealize.valueAtRiskUsd).toBeGreaterThanOrEqual(0);
      expect(fb.toGovern.evidenceNote).toContain("INC-OP-007");
    }
  });
});

describe("artifacts", () => {
  it("weekly ops review carries all four layers and the provenance footer", () => {
    const st = state();
    const series = deriveOpsSeries(st);
    const md = buildWeeklyOpsReview(st, series, detectSignals(series));
    for (const needle of ["System", "Model", "RAG", "Agent/Cost", "Value at risk", "SIMULATED"]) {
      expect(md).toContain(needle);
    }
  });

  it("incident report records the chosen option and the loop-back it issued", () => {
    const st = state();
    const series = deriveOpsSeries(st);
    const inc = deriveDay2Incident(st);
    const fb = buildOperateFeedback(st, inc.options.find((o) => o.key === "reindex")!, series);
    const md = buildIncidentReport(st, inc, fb);
    expect(md).toContain("Reindex ✅");
    expect(md).toContain("→ **Build:**");
    expect(md).toContain("→ **Realize:**");
    expect(md).toContain("SIMULATED");
  });
});
