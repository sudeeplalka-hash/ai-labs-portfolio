import { describe, it, expect } from "vitest";
import { runProof, PROOF_QUESTIONS } from "./proof";
import { analyzeCorpus } from "./corpus";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";

// Hint-alignment regression (2026-07-09): the disclosed topic bonus must be
// REACHABLE through the real labeling flow. If a user confirms the
// suggester's own labels (typing a group's top term where the suggester is
// unsure), every authored topicHint must match at least one confirmed label.
// A hint that can never fire is dead UI; the doctrine allows no dead switches.

const files = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content }));

function confirmedAsSuggested(): Map<string, string[]> {
  const r = analyzeCorpus(CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length })));
  const byFile = new Map<string, string[]>();
  for (const t of r.topics) {
    // Confident groups: confirmed exactly as suggested. Unsure groups: the
    // human types a label; the group's own top term is the plausible choice.
    const label = t.unsure ? t.topTerms[0] ?? "" : t.suggestedLabel;
    if (!label) continue;
    for (const n of t.memberNames) byFile.set(n, [...(byFile.get(n) ?? []), label]);
  }
  return byFile;
}

describe("proof topic hints align with the suggester's vocabulary", () => {
  const topics = confirmedAsSuggested();
  const labels = [...topics.values()].flat().map((l) => l.toLowerCase());

  it("every authored hint matches a label reachable by confirming suggestions", () => {
    expect(labels.length).toBeGreaterThan(0);
    for (const q of PROOF_QUESTIONS) {
      if (!q.topicHint) continue;
      expect(
        labels.some((l) => l.includes(q.topicHint!.toLowerCase())),
        `hint "${q.topicHint}" (${q.id}) matches no confirmable label`,
      ).toBe(true);
    }
  });

  it("with suggested labels confirmed, the cleaned run stays perfect", () => {
    const r = runProof(files, new Set(["travel_policy_v2.7_legacy.txt", "customers_master.csv"]), topics);
    expect(r.cleaned.accuracyPct).toBe(100);
    expect(r.cleaned.staleHits).toBe(0);
  });
});
