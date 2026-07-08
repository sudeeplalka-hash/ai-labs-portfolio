import { describe, it, expect } from "vitest";
import { analyzeCorpus } from "./corpus";
import { deriveTopicGroups } from "./topics";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";

const inputs = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));

describe("topic groups (Phase 4)", () => {
  it("partitions the prose corpus: every prose file in exactly one group, tabular files sit out", () => {
    const r = analyzeCorpus(inputs);
    expect(r.topics.length).toBeGreaterThanOrEqual(2);
    const seen = new Set<string>();
    for (const t of r.topics) {
      for (const id of t.memberIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
      for (const n of t.memberNames) expect(/\.csv$/i.test(n)).toBe(false);
    }
    const proseCount = inputs.filter((f) => !/\.(csv|tsv)$/i.test(f.name)).length;
    expect(seen.size).toBe(proseCount);
  });

  it("confident groups carry term-derived suggested labels; thin groups say Unsure", () => {
    const r = analyzeCorpus(inputs);
    for (const t of r.topics) {
      if (t.unsure) {
        expect(t.suggestedLabel).toBe("Unsure");
      } else {
        expect(t.suggestedLabel.length).toBeGreaterThan(2);
        expect(t.topTerms.length).toBeGreaterThanOrEqual(2);
        // label terms come from the group's own top terms
        for (const part of t.suggestedLabel.split(" \u00b7 ")) expect(t.topTerms).toContain(part);
      }
    }
  });

  it("is deterministic", () => {
    const a = analyzeCorpus(inputs).topics;
    const b = analyzeCorpus(inputs).topics;
    expect(a).toEqual(b);
  });

  it("tiny corpora produce no topic groups", () => {
    expect(deriveTopicGroups(["a", "b"], ["a.txt", "b.txt"], [[1, 0], [0, 1]], ["x", "y"])).toEqual([]);
  });
});

describe("language + parsability integration (Phase 4)", () => {
  it("a non-English file in an English corpus gets an admissibility language flag", () => {
    const spanish = {
      name: "poliza-es.txt",
      text: "Los ajustadores revisan los términos de la cobertura y documentan las decisiones que se toman para los reclamos en el sistema con una política clara para el cliente y los plazos de apelación.",
      size: 300,
    };
    const r = analyzeCorpus([...inputs.slice(0, 4), spanish]);
    const f = r.files.find((x) => x.name === "poliza-es.txt")!;
    const check = f.report.checks.find((c) => c.id === "language");
    expect(check).toBeDefined();
    expect(check!.guideline).toBe("admissibility");
    expect(check!.detail).toMatch(/heuristic/);
    expect(r.languages.map((l) => l.label)).toContain("Spanish");
  });

  it("an image-heavy 'PDF' (big bytes, no text) gets a critical parsability flag", () => {
    const scanned = { name: "scanned-contract.pdf", text: "Page 1", size: 800_000 };
    const r = analyzeCorpus([...inputs.slice(0, 3), scanned]);
    const f = r.files.find((x) => x.name === "scanned-contract.pdf")!;
    const check = f.report.checks.find((c) => c.id === "parsability");
    expect(check).toBeDefined();
    expect(check!.level).toBe("critical");
    expect(f.gate.gate).toBe("Rejected"); // critical blocks the gate
  });

  it("the sample corpus reports an all-English mix over its prose files (tabular files sit out)", () => {
    const r = analyzeCorpus(inputs);
    const proseCount = inputs.filter((f) => !/\.(csv|tsv)$/i.test(f.name)).length;
    expect(r.languages).toEqual([{ label: "English", files: proseCount }]);
    // and no tabular file carries a language check
    for (const f of r.files) {
      if (/\.csv$/i.test(f.name)) {
        expect(f.report.checks.some((c) => c.id === "language")).toBe(false);
      }
    }
  });
});
