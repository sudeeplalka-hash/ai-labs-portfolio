// ============================================================================
// R1.4 · One computed number. The demo fixture's seeded outcomes must equal
// what THIS engine computes from the same fixture, otherwise the Realize
// verdict (engine) and the handoff strip / stepper (outcomes) tell two
// different stories about the same program ($2.4M/yr vs $2,545k/yr was live).
//
// If an engine change breaks this test: run it, read the printed actual
// values, and paste them into demoState()'s outcomes in
// packages/program-core/src/store.ts. The numbers are meant to be the
// engine's, never hand-authored.
// ============================================================================
import { describe, it, expect } from "vitest";
import { demoState, DEMO_ARCHETYPES } from "@labs/program-core";
import { deriveInputs, computeRoi } from "./model";

describe.each(DEMO_ARCHETYPES.map((a) => [a.id] as const))("fixture outcomes sync · %s", (id) => {
  it("seeded outcomes equal the engine's computed outcomes", () => {
    const s = demoState(id);
    const inp = deriveInputs(s);
    const roi = computeRoi(inp);
    const actual = {
      roi: roi.roiPct,
      adoption: inp.adoption.value,
      riskAdjustedValue: Math.round(roi.riskAdjustedValue),
      paybackMonths: roi.paybackMonths,
    };
    const seeded = {
      roi: s.outcomes?.roi,
      adoption: s.outcomes?.adoption,
      riskAdjustedValue: s.outcomes?.riskAdjustedValue,
      paybackMonths: s.outcomes?.paybackMonths,
    };
    expect(seeded, `paste into store.ts if the engine moved: ${JSON.stringify(actual)}`).toEqual(actual);
  });
});
