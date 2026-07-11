import { describe, it, expect } from "vitest";
import { PAINS, painMode } from "./params";
import { scoreTriangle } from "./scoring";
import { deriveVerdict } from "./verdict";
import { generateBacklog } from "./backlog";
import { suggestedShape, metricDefaults } from "./metric";
import { curatedReframe } from "./reframe";
import type { FramingParams, PainKey, RiskKey } from "./types";

// Invariant suite for the pain-mode dimension (severity + mode two-axis table)
// and the risk-modulated hypothesis targets. Locks the tuning craft in params.ts
// against drift: every pain must move the output, and correctness pains must
// visibly reshape ideas toward review, evidence, and audit.

const PAIN_KEYS = Object.keys(PAINS) as PainKey[];
const base: FramingParams = { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" };

describe("pain table invariants", () => {
  it("every pain carries a mode, a severity in (0,1], and a distinct phrase", () => {
    const phrases = new Set<string>();
    for (const k of PAIN_KEYS) {
      const e = PAINS[k];
      expect(["throughput", "correctness", "coverage", "experience"]).toContain(e.mode);
      expect(e.sev).toBeGreaterThan(0);
      expect(e.sev).toBeLessThanOrEqual(1);
      expect(e.phr.length).toBeGreaterThan(3);
      phrases.add(e.phr);
    }
    expect(phrases.size).toBe(PAIN_KEYS.length);
  });

  it("higher severity never lowers the value score (same knobs otherwise)", () => {
    const sorted = [...PAIN_KEYS].sort((a, b) => PAINS[a].sev - PAINS[b].sev);
    let prevSev = -1;
    let prevValue = -1;
    for (const k of sorted) {
      const v = scoreTriangle({ ...base, pain: k }, 0.5).value;
      if (PAINS[k].sev > prevSev) {
        expect(v).toBeGreaterThanOrEqual(prevValue);
        prevValue = v;
        prevSev = PAINS[k].sev;
      }
    }
  });

  it("every pain has a reframe outcome and a metric shape", () => {
    for (const k of PAIN_KEYS) {
      const p = { ...base, pain: k };
      expect(suggestedShape(p)).toBeTruthy();
      const r = curatedReframe({ rawAmbition: "improve customer support", params: p });
      expect(r.sharpenedProblem).not.toContain("the pain goes away");
    }
  });
});

describe("correctness mode reshapes the output", () => {
  const CORRECTNESS = PAIN_KEYS.filter((k) => painMode(k) === "correctness");

  it("covers the enterprise severity painpoints", () => {
    expect(CORRECTNESS).toEqual(expect.arrayContaining(["Costly mistakes", "Compliance exposure", "Error prone"]));
  });

  it("forces the human-review flag in the verdict", () => {
    for (const k of CORRECTNESS) {
      const p = { ...base, pain: k };
      expect(deriveVerdict(p, scoreTriangle(p, 0.5)).humanReview).toBe(true);
    }
  });

  it("surfaces review/evidence-shaped ideas in the backlog", () => {
    for (const k of CORRECTNESS) {
      const ideas = generateBacklog({ ...base, pain: k }, "improve customer support");
      const text = ideas.map((u) => `${u.title} ${u.desc}`).join(" ").toLowerCase();
      expect(text).toMatch(/sign-off|human in the loop|approve|unreviewed|evaluation harness|audit/);
    }
  });

  it("compliance exposure surfaces the audit trail idea", () => {
    const ideas = generateBacklog({ ...base, pain: "Compliance exposure" }, "improve customer support");
    const text = ideas.map((u) => u.title).join(" ").toLowerCase();
    expect(text).toContain("audit");
  });

  it("adds a guardrail clause to the metric; throughput pains carry none", () => {
    expect(metricDefaults("% within threshold", { ...base, pain: "Costly mistakes" }).guardrail).toMatch(/unreviewed/);
    expect(metricDefaults("% within threshold", { ...base, pain: "Compliance exposure" }).guardrail).toMatch(/audit/);
    expect(metricDefaults("Reduce time", { ...base, pain: "Too slow" }).guardrail).toBeUndefined();
  });
});

describe("risk-modulated hypothesis targets", () => {
  const pct = (s: string) => Number((s.match(/(\d+(?:\.\d+)?)\s*%/) ?? [])[1]);
  const dollars = (s: string) => Number((s.match(/\$(\d+(?:\.\d+)?)/) ?? [])[1]);

  it("aggressive proposes bolder targets than conservative for every shape", () => {
    const at = (risk: RiskKey) => ({ ...base, risk });
    expect(pct(metricDefaults("% within threshold", at("Aggressive")).target)).toBeGreaterThan(
      pct(metricDefaults("% within threshold", at("Conservative")).target));
    expect(pct(metricDefaults("Increase rate", at("Aggressive")).target)).toBeGreaterThan(
      pct(metricDefaults("Increase rate", at("Conservative")).target));
    expect(dollars(metricDefaults("Cut cost", at("Aggressive")).target)).toBeLessThan(
      dollars(metricDefaults("Cut cost", at("Conservative")).target));
  });

  it("backlog remains deterministic and four-bucketed for every new pain", () => {
    for (const k of ["Costly mistakes", "Compliance exposure", "Trust erosion"] as PainKey[]) {
      const p = { ...base, pain: k };
      expect(generateBacklog(p)).toEqual(generateBacklog(p));
      expect(new Set(generateBacklog(p).map((u) => u.bucket)).size).toBe(4);
    }
  });
});
