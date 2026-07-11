// ============================================================================
// R1.1 · "The shipped demo fixture produces zero contradictions."
//
// The 2026-07-11 QA sweep found Deploy claiming "Data lab not run" beside a
// stepper showing Data 74, and Govern claiming no initiative beneath a sidebar
// naming one. These tests make that class of bug structural: every archetype's
// sealed fixture must carry every artifact, and no blocker may claim an
// artifact is missing when the fixture has that stage's evidence.
// ============================================================================
import { describe, it, expect } from "vitest";
import { demoState, DEMO_ARCHETYPES } from "./store";
import { computeReleaseReadiness } from "./operate";
import { selectStageHeadlines, selectReleaseBlockers } from "./selectors";
import { selectGovernInputs } from "./contracts";

// Blocker texts that assert an artifact does not exist. None of these may
// appear for a sealed fixture, whose artifacts exist by construction.
const MISSING_ARTIFACT = /not run|no eval run|no framed|not assigned|undecided|not evaluated/i;

describe.each(DEMO_ARCHETYPES.map((a) => [a.id] as const))("demo fixture · %s", (id) => {
  const s = demoState(id);

  it("is sealed: every stage artifact exists", () => {
    expect(s.initiative?.name).toBeTruthy();
    expect(s.data?.handoff).toBeTruthy();
    expect(s.rag?.contract).toBeTruthy();
    expect(s.deploy?.evidence).toBeTruthy();
    expect(s.governance?.decision).toBeTruthy();
    expect(s.outcomes?.roi).not.toBeUndefined();
  });

  it("banner state matches initiative presence (Govern cannot say 'no initiative')", () => {
    expect(selectGovernInputs(s).hasLive).toBe(true);
  });

  it("the stepper has a headline for every stage", () => {
    for (const h of selectStageHeadlines(s)) {
      expect(h.value, `stage ${h.key} headline`).not.toBeNull();
    }
  });

  it("no release blocker claims an artifact is missing", () => {
    const rr = computeReleaseReadiness(s);
    for (const b of rr.blockers) expect(b, `readiness blocker "${b}"`).not.toMatch(MISSING_ARTIFACT);
    for (const b of selectReleaseBlockers(s)) expect(b.text, `release blocker "${b.text}"`).not.toMatch(MISSING_ARTIFACT);
  });

  it("blockers route to a real source stage, never all to deploy by default", () => {
    const rr = computeReleaseReadiness(s);
    for (const b of rr.blockerItems) {
      expect(["frame", "data", "build", "deploy", "govern", "realize", "operate"]).toContain(b.stage);
    }
    // Anything phrased as a Build gate/quality blocker must route to build.
    for (const b of selectReleaseBlockers(s)) {
      if (/^Build gate failing|citation accuracy|faithfulness|hallucination/i.test(b.text)) {
        expect(b.source, `"${b.text}" routes to`).toBe("build");
      }
      if (/blocked source|data remediation/i.test(b.text)) {
        expect(b.source, `"${b.text}" routes to`).toBe("data");
      }
    }
  });

  it("blocker facts agree with the stepper's facts (one story)", () => {
    const heads = Object.fromEntries(selectStageHeadlines(s).map((h) => [h.key, h]));
    // The stepper shows a Data readiness number, so no blocker may say the
    // Data lab has not run; same for Build's quality number vs eval-run claims.
    expect(heads.data.value).toBeTruthy();
    expect(heads.build.value).toBeTruthy();
    const all = [...computeReleaseReadiness(s).blockers, ...selectReleaseBlockers(s).map((b) => b.text)].join(" · ");
    expect(all).not.toMatch(/data lab not run/i);
    expect(all).not.toMatch(/no eval run/i);
  });
});
