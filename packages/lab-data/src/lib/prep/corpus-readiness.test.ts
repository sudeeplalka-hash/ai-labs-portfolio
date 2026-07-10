import { describe, it, expect } from "vitest";
import { analyzeCorpus } from "./corpus";
import { deriveCorpusFindings, recomputeCorpus } from "./findings";
import { CORPUS_SAMPLES } from "../../data/sampleCorpus";

// End-to-end guarantee for the number the Corpus health card headlines:
// "Corpus ready" (approved / active files) must be REACHABLE through the UI's
// own actions — backlog fixes and duplicate resolution — not a decorative zero.

const inputs = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));

describe("corpus ready % responds to the workflow", () => {
  const report = analyzeCorpus(inputs, "general");

  it("starts honest: nothing is approved out of the box", () => {
    expect(report.health.readyPct).toBe(0);
  });

  it("fixing every fixable finding approves the whole sample corpus", () => {
    const statuses: Record<string, "fixed"> = {};
    for (const f of deriveCorpusFindings(report.files)) if (f.fixId) statuses[f.key] = "fixed";
    const adj = recomputeCorpus(report, statuses);
    expect(adj.health.readyPct).toBe(100);
    expect(adj.health.approved).toBe(14);
    // Unfixable findings (cohesion, parsability) cost points but not the gate.
    for (const f of adj.files) expect(f.gate.gate).toBe("Approved");
  });

  it("two batch fixes (provenance + taxonomy) already move a file through the gate", () => {
    const statuses: Record<string, "fixed"> = {};
    for (const f of deriveCorpusFindings(report.files))
      if (f.fixId && (f.checkId === "provenance" || f.checkId === "taxonomy")) statuses[f.key] = "fixed";
    const adj = recomputeCorpus(report, statuses);
    expect(adj.health.readyPct).toBeGreaterThan(0);
  });

  it("choosing a keeper auto-completes its freshness confirmation and lifts its score", () => {
    const v31 = report.files.find((f) => f.name.includes("v3.1"))!;
    const v27 = report.files.find((f) => f.name.includes("v2.7"))!;
    const before = recomputeCorpus(report, {}).files.find((f) => f.id === v31.id)!.score;
    const adj = recomputeCorpus(report, {}, { [v27.id]: "Superseded" }, new Set([v31.id]));
    const fresh = adj.findings.find((f) => f.fileId === v31.id && f.checkId === "freshness");
    expect(fresh?.status).toBe("fixed");
    expect(adj.files.find((f) => f.id === v31.id)!.score).toBeGreaterThan(before);
    expect(adj.health.excluded).toBe(1);
  });
});
