import { describe, it, expect } from "vitest";
import { analyzeCorpus } from "./corpus";
import { deriveDuplicateSets, pickKeeper, setIdForPair } from "./resolution";
import { recomputeCorpus } from "./findings";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";

const inputs = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));

describe("deriveDuplicateSets", () => {
  const report = analyzeCorpus(inputs);
  const sets = deriveDuplicateSets(report.files, report.pairs);

  it("groups every pair endpoint into exactly one set", () => {
    expect(sets.length).toBeGreaterThanOrEqual(1);
    const seen = new Map<string, string>();
    for (const s of sets) {
      for (const id of s.memberIds) {
        expect(seen.has(id)).toBe(false); // no file in two sets
        seen.set(id, s.id);
      }
    }
    for (const p of report.pairs) {
      expect(seen.get(p.aId)).toBeDefined();
      expect(seen.get(p.aId)).toBe(seen.get(p.bId)); // pair endpoints share a set
    }
  });

  it("recommendations name a keeper from inside the set and drop the rest", () => {
    for (const s of sets) {
      expect(s.memberIds).toContain(s.recommendation.keepId);
      expect(s.recommendation.dropIds.length).toBe(s.memberIds.length - 1);
      for (const d of s.recommendation.dropIds) expect(s.memberIds).toContain(d);
      expect(s.recommendation.why.length).toBeGreaterThan(20);
    }
  });

  it("a version set keeps the current copy and quarantines the stale-marked one", () => {
    const v = sets.find((s) => s.kind === "version");
    expect(v).toBeDefined();
    // The keeper must never be a stale-marked name (a bare version number is
    // fine, "legacy/old/superseded" is not), and at least one dropped copy
    // should be the stale-marked file that caused the conflict.
    expect(/(?:^|[^a-z])(?:old|copy)(?:[^a-z]|$)|legacy|superseded|draft|backup|archive/i.test(v!.recommendation.keepName)).toBe(false);
    expect(v!.recommendation.dropNames.some((n) => /(?:^|[^a-z])(?:old|copy)(?:[^a-z]|$)|legacy|superseded|draft|backup|archive|v\d/i.test(n))).toBe(true);
  });

  it("transitive overlaps merge into one set (A~B, B~C ⇒ {A,B,C})", () => {
    const base = "shared policy text about claims handling coverage disputes escalation adjuster review board timelines appeals documentation ";
    const mk = (name: string, extra: string) => ({ name, text: (base + extra + " ").repeat(6), size: 100 });
    const r = analyzeCorpus([
      mk("doc-a.txt", "alpha section"),
      mk("doc-b.txt", "alpha section beta section"),
      mk("doc-c.txt", "beta section"),
    ]);
    const ss = deriveDuplicateSets(r.files, r.pairs);
    if (r.pairs.length >= 2) {
      expect(ss.length).toBe(1);
      expect(ss[0].memberIds.length).toBe(3);
    }
  });

  it("is deterministic and stable-ordered", () => {
    const again = deriveDuplicateSets(report.files, report.pairs);
    expect(again).toEqual(sets);
  });

  it("setIdForPair maps every pair back to its set", () => {
    for (const p of report.pairs) {
      const id = setIdForPair(sets, p);
      expect(id).not.toBeNull();
      expect(sets.find((s) => s.id === id)!.memberIds).toEqual(expect.arrayContaining([p.aId, p.bId]));
    }
  });
});

describe("pickKeeper signals", () => {
  const stub = (id: string, name: string, score: number, tokens: number) =>
    ({ id, name, score, tokens, report: { checks: [] }, gate: {}, x: 0, y: 0 }) as never;

  it("prefers the unstale name over a higher-scoring stale-marked one", () => {
    const keep = pickKeeper([stub("a", "policy_v1_old.txt", 95, 100), stub("b", "policy.txt", 80, 100)]);
    expect(keep.id).toBe("b");
  });

  it("treats a bare version number as current, not stale (v3.1 beats v2.7_legacy)", () => {
    const keep = pickKeeper([stub("a", "travel_policy_v2.7_legacy.txt", 90, 100), stub("b", "travel_policy_v3.1_current.txt", 70, 100)]);
    expect(keep.id).toBe("b");
  });

  it("falls back to score, then size, then name", () => {
    expect(pickKeeper([stub("a", "one.txt", 70, 100), stub("b", "two.txt", 90, 100)]).id).toBe("b");
    expect(pickKeeper([stub("a", "one.txt", 90, 50), stub("b", "two.txt", 90, 500)]).id).toBe("b");
    expect(pickKeeper([stub("b", "beta.txt", 90, 100), stub("a", "alpha.txt", 90, 100)]).id).toBe("a");
  });
});

describe("recomputeCorpus with exclusions (Phase 2)", () => {
  const report = analyzeCorpus(inputs);
  const sets = deriveDuplicateSets(report.files, report.pairs);

  it("accepting a recommendation removes the dropped file from the active corpus and its conflicts", () => {
    const target = sets[0];
    const exclusions = Object.fromEntries(target.recommendation.dropIds.map((id) => [id, `Superseded by ${target.recommendation.keepName}`]));
    const before = recomputeCorpus(report, {});
    const after = recomputeCorpus(report, {}, exclusions);

    expect(after.health.excluded).toBe(target.recommendation.dropIds.length);
    expect(after.activeFiles.length).toBe(before.activeFiles.length - target.recommendation.dropIds.length);
    expect(after.health.duplicates + after.health.conflicts).toBeLessThan(before.health.duplicates + before.health.conflicts);
    for (const id of target.recommendation.dropIds) {
      const f = after.files.find((x) => x.id === id)!;
      expect(f.excluded?.reason).toContain("Superseded");
      expect(after.findings.some((x) => x.fileId === id)).toBe(false);
      expect(after.activePairs.some((p) => p.aId === id || p.bId === id)).toBe(false);
    }
  });

  it("no exclusions keeps prior behavior byte-for-byte", () => {
    const a = recomputeCorpus(report, {});
    const b = recomputeCorpus(report, {}, {});
    expect(a).toEqual(b);
    expect(a.activeFiles.length).toBe(a.files.length);
    expect(a.health.excluded).toBe(0);
  });
});
