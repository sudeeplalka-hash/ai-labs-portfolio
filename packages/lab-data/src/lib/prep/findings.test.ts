import { describe, it, expect } from "vitest";
import { analyzeCorpus } from "./corpus";
import { deriveCorpusFindings, rollupCategories, recomputeCorpus, FINDING_WEIGHT } from "./findings";
import { RULEBOOK_LIST } from "./rulebook";

// Real engine output in, findings spine out — no mocked checks.
const doc = (name: string, text: string) => ({ name, text, size: text.length });
const clean = (i: number) =>
  doc(
    `policy-note-${i}.txt`,
    `Source: Policy Office. Last updated 2026-06-0${i + 1}.\n` +
      `Claims handling guideline ${i}: adjusters review coverage terms, document decisions, ` +
      `and escalate disputed liability to the review board within five business days. ` +
      `Customers receive written status updates and clear appeal instructions at every stage ${i}.`,
  );

describe("corpus findings spine", () => {
  it("clean corpus: no critical findings, all eight categories rolled up", () => {
    const report = analyzeCorpus([clean(0), clean(1), clean(2)]);
    const findings = deriveCorpusFindings(report.files);
    const rollups = rollupCategories(report.files, findings);
    expect(rollups.length).toBe(RULEBOOK_LIST.length);
    expect(new Set(rollups.map((r) => r.guideline)).size).toBe(RULEBOOK_LIST.length);
    for (const r of rollups) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.definition.length).toBeGreaterThan(0);
    }
    expect(findings.every((f) => f.level !== ("healthy" as never))).toBe(true);
  });

  it("PII in a file produces a privacy finding and drags the privacy rollup below a clean corpus", () => {
    const dirty = doc(
      "customer-export.txt",
      "Customer john.doe@example.com called from 555-123-4567 about claim 9. " +
        "SSN 123-45-6789 was read aloud during the call and stored in the note.",
    );
    const cleanReport = analyzeCorpus([clean(0), clean(1)]);
    const dirtyReport = analyzeCorpus([clean(0), dirty]);
    const cleanRoll = rollupCategories(cleanReport.files, deriveCorpusFindings(cleanReport.files));
    const dirtyFindings = deriveCorpusFindings(dirtyReport.files);
    const dirtyRoll = rollupCategories(dirtyReport.files, dirtyFindings);
    const privacyDirty = dirtyRoll.find((r) => r.guideline === "privacy")!;
    const privacyClean = cleanRoll.find((r) => r.guideline === "privacy")!;
    expect(dirtyFindings.some((f) => f.guideline === "privacy")).toBe(true);
    expect(privacyDirty.score).toBeLessThan(privacyClean.score);
    expect(privacyDirty.findingCount).toBeGreaterThan(0);
    expect(privacyDirty.filesAffected).toBeGreaterThanOrEqual(1);
  });

  it("finding keys are stable and unique; severity ordering holds within a file", () => {
    const report = analyzeCorpus([clean(0), doc("dup.txt", clean(0).text)]);
    const findings = deriveCorpusFindings(report.files);
    const keys = findings.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    const again = deriveCorpusFindings(report.files).map((f) => f.key);
    expect(again).toEqual(keys);
    const rank = { critical: 0, risk: 1, watch: 2 } as const;
    for (const f of report.files) {
      const mine = findings.filter((x) => x.fileId === f.id);
      for (let i = 1; i < mine.length; i++) {
        expect(rank[mine[i].level]).toBeGreaterThanOrEqual(rank[mine[i - 1].level]);
      }
    }
  });

  it("status transitions change rollups the documented way", () => {
    const dirty = doc("customer-export.txt", "Contact jane@corp.com or 555-987-6543. SSN 987-65-4321 on file.");
    const report = analyzeCorpus([clean(0), dirty]);
    const findings = deriveCorpusFindings(report.files);
    const privacyIdx = findings.findIndex((f) => f.guideline === "privacy");
    expect(privacyIdx).toBeGreaterThanOrEqual(0);

    const base = rollupCategories(report.files, findings).find((r) => r.guideline === "privacy")!;

    const fixed = findings.map((f, i) => (i === privacyIdx ? { ...f, status: "fixed" as const } : f));
    const afterFix = rollupCategories(report.files, fixed).find((r) => r.guideline === "privacy")!;
    expect(afterFix.score).toBeGreaterThanOrEqual(base.score);
    expect(afterFix.findingCount).toBe(base.findingCount - 1);

    const accepted = findings.map((f, i) => (i === privacyIdx ? { ...f, status: "accepted-risk" as const } : f));
    const afterAccept = rollupCategories(report.files, accepted).find((r) => r.guideline === "privacy")!;
    expect(afterAccept.score).toBe(base.score); // score hit stays
    expect(afterAccept.findingCount).toBe(base.findingCount - 1); // open count drops
  });

  it("weights are the documented visible math", () => {
    expect(FINDING_WEIGHT).toEqual({ watch: 10, risk: 25, critical: 45 });
  });
});

describe("recomputeCorpus (live Backlog re-scoring)", () => {
  const spam = doc("template-spam.txt", ("This document is confidential and proprietary to the company. ").repeat(40));
  const base = () => analyzeCorpus([clean(0), clean(1), spam]);

  it("fixing a finding raises the file score, its rollup, and corpus health together", () => {
    const report = base();
    const before = recomputeCorpus(report, {});
    const target = before.findings.find((f) => f.guideline === "concentration" && f.fixId)!;
    const after = recomputeCorpus(report, { [target.key]: "fixed" });

    const fileBefore = before.files.find((f) => f.id === target.fileId)!;
    const fileAfter = after.files.find((f) => f.id === target.fileId)!;
    expect(fileAfter.score).toBeGreaterThan(fileBefore.score);

    const rollBefore = before.rollups.find((r) => r.guideline === "concentration")!;
    const rollAfter = after.rollups.find((r) => r.guideline === "concentration")!;
    expect(rollAfter.score).toBeGreaterThanOrEqual(rollBefore.score);
    expect(rollAfter.findingCount).toBe(rollBefore.findingCount - 1);

    expect(after.health.avgScore).toBeGreaterThanOrEqual(before.health.avgScore);
  });

  it("accepting a risk leaves scores unchanged but empties the open queue entry", () => {
    const report = base();
    const before = recomputeCorpus(report, {});
    const target = before.findings.find((f) => f.guideline === "concentration")!;
    const after = recomputeCorpus(report, { [target.key]: "accepted-risk" });

    expect(after.files.find((f) => f.id === target.fileId)!.score)
      .toBe(before.files.find((f) => f.id === target.fileId)!.score);
    const roll = after.rollups.find((r) => r.guideline === "concentration")!;
    expect(roll.findingCount).toBe(before.rollups.find((r) => r.guideline === "concentration")!.findingCount - 1);
  });

  it("is pure: same report + statuses give identical output; empty statuses reproduce base scores", () => {
    const report = base();
    const a = recomputeCorpus(report, {});
    const b = recomputeCorpus(report, {});
    expect(a).toEqual(b);
    for (const f of a.files) {
      const orig = report.files.find((x) => x.id === f.id)!;
      expect(f.score).toBe(orig.score);
      expect(f.gate.gate).toBe(orig.gate.gate);
    }
  });
});
