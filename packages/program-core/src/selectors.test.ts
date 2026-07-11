import { describe, it, expect } from "vitest";
import { blankState, demoState, DEMO_ARCHETYPES } from "./store";
import { selectStageHeadlines, selectReleaseBlockers } from "./selectors";
import { deriveOpsEvidenceEnrichment } from "./operate";
import { isAgenticInitiative } from "./agents";
import { trainingRelevant } from "./training";

describe("selectStageHeadlines", () => {
  it("is all-null on blank state (no initiative framed)", () => {
    const h = selectStageHeadlines(blankState());
    expect(h).toHaveLength(7);
    expect(h.every((x) => x.value === null)).toBe(true);
  });

  it("derives a headline for every stage on the sample program", () => {
    const h = selectStageHeadlines(demoState());
    const byKey = Object.fromEntries(h.map((x) => [x.key, x]));
    expect(byKey.frame.value).not.toBeNull();
    expect(Number(byKey.data.value)).toBeGreaterThan(0);
    expect(Number(byKey.build.value)).toBeGreaterThan(0);
    expect(Number(byKey.deploy.value)).toBeGreaterThan(0);
    expect(byKey.govern.value).not.toBeNull();
    expect(byKey.realize.value).toBe("414%"); // demoState outcomes.roi, engine-synced (see lab-realize fixture-sync.test.ts)
  });

  it("keeps stage order frame→realize", () => {
    expect(selectStageHeadlines(demoState()).map((x) => x.key)).toEqual([
      "frame", "data", "build", "deploy", "govern", "realize", "operate",
    ]);
  });
});

describe("selectReleaseBlockers", () => {
  it("returns nothing without an initiative", () => {
    expect(selectReleaseBlockers(blankState())).toEqual([]);
  });

  it("dedupes and caps at 8, each with a source stage", () => {
    const s = demoState();
    const blockers = selectReleaseBlockers(s);
    expect(blockers.length).toBeLessThanOrEqual(8);
    const texts = blockers.map((b) => b.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
    for (const b of blockers) expect(["frame", "data", "build", "deploy", "govern", "realize"]).toContain(b.source);
  });
});

describe("demo archetypes", () => {
  it("every archetype yields a fully populated program (all six headlines)", () => {
    for (const a of DEMO_ARCHETYPES) {
      const h = selectStageHeadlines(demoState(a.id));
      expect(h.filter((x) => x.value !== null).length, a.id).toBe(7);
    }
  });

  it("archetypes flip the capability layers", () => {
    expect(isAgenticInitiative(demoState("agentic-workflow"))).toBe(true);
    expect(isAgenticInitiative(demoState("knowledge-assistant"))).toBe(false);
    expect(trainingRelevant(demoState("classification"))).toBe(true);
    expect(trainingRelevant(demoState("summarization"))).toBe(false);
  });

  it("the at-risk archetype produces release blockers", () => {
    expect(selectReleaseBlockers(demoState("at-risk")).length).toBeGreaterThan(0);
  });

  it("initiative names and patterns are distinct enough to feel different", () => {
    const names = DEMO_ARCHETYPES.map((a) => demoState(a.id).initiative.name);
    expect(new Set(names).size).toBe(names.length);
    const patterns = DEMO_ARCHETYPES.map((a) => demoState(a.id).initiative.meta?.primaryAiPattern);
    expect(new Set(patterns).size).toBeGreaterThanOrEqual(4);
  });
});

describe("operate enrichment invariant (loop-safety)", () => {
  it("never writes the fields ReleaseReadinessPanel keys its signature on", () => {
    // The panel's effect signature includes latencyP95 / costPerQuery / driftRisk.
    // If enrichment ever writes these, the effect could retrigger itself.
    const enrich = deriveOpsEvidenceEnrichment(demoState());
    expect(enrich).not.toHaveProperty("latencyP95");
    expect(enrich).not.toHaveProperty("costPerQuery");
    expect(enrich).not.toHaveProperty("driftRisk");
  });
});
