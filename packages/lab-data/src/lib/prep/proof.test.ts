import { describe, it, expect } from "vitest";
import { runProof, PROOF_QUESTIONS } from "./proof";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";

const files = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content }));
// The four drops the Resolution workflow itself recommends on this corpus.
const RECOMMENDED_EXCLUSIONS = new Set([
  "travel_policy_v1.0_archive.txt",
  "travel_policy_v2.7_legacy.txt",
  "customers_master.csv",
  "vendor_onboarding_faq.md",
]);
// Suggested labels confirmed as-is (see topics probe): the hint path the UI takes.
const TAGS = new Map<string, string[]>([
  ["travel_policy_v3.1_current.txt", ["travel · approval"]],
  ["vendor_onboarding_kb.md", ["vendor · onboarding"]],
  ["product_overview.md", ["vendor · onboarding"]],
  ["eng_update_q2.md", ["reranker · search"]],
  ["incident_postmortem_2026-04.md", ["reranker · search"]],
  ["release_notes_2026q2.md", ["reranker · search"]],
  ["product_catalog.json", ["support · team"]],
  ["soporte_macros_es.md", ["support · team"]],
]);

describe("cleaning-to-quality proof (Phase 5)", () => {
  it("raw corpus retrieves stale evidence; the cleaned corpus never does", () => {
    const r = runProof(files, RECOMMENDED_EXCLUSIONS, TAGS);
    expect(r.raw.staleHits).toBeGreaterThan(0);
    expect(r.cleaned.staleHits).toBe(0);
    expect(r.cleaned.staleSharePct).toBe(0);
  });

  it("cleaning never lowers accuracy on the golden set, and improves or holds it", () => {
    const r = runProof(files, RECOMMENDED_EXCLUSIONS, TAGS);
    expect(r.cleaned.accuracyPct).toBeGreaterThanOrEqual(r.raw.accuracyPct);
    expect(r.cleaned.correct).toBeGreaterThanOrEqual(r.raw.correct);
    // The cleaned corpus answers the policy questions from the CURRENT version.
    for (const row of r.rows.slice(0, 4)) {
      expect(row.cleanedTopFile).toBe("travel_policy_v3.1_current.txt");
      expect(row.cleanedStaleEvidence).toBe(false);
    }
  });

  it("with nothing cleaned, both runs are identical and flagged as such", () => {
    const r = runProof(files, new Set(), new Map());
    expect(r.cleanedDiffers).toBe(false);
    expect(r.cleaned).toEqual(r.raw);
    for (const row of r.rows) expect(row.cleanedTopFile).toBe(row.rawTopFile);
  });

  it("is deterministic run-to-run", () => {
    const a = runProof(files, RECOMMENDED_EXCLUSIONS, TAGS);
    const b = runProof(files, RECOMMENDED_EXCLUSIONS, TAGS);
    expect(a).toEqual(b);
  });

  it("every golden question's expected file exists in the sample corpus", () => {
    const names = new Set(files.map((f) => f.name));
    for (const q of PROOF_QUESTIONS) {
      expect(names.has(q.expectedFile)).toBe(true);
      if (q.trapFile) expect(names.has(q.trapFile)).toBe(true);
    }
  });
});
