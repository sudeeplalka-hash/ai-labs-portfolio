import { describe, it, expect } from "vitest";
import { evaluateLiveAnswer } from "@rag/lib/live-lab/evaluation";
import type { GeneratedLiveAnswer, RetrievedLiveChunk } from "@rag/types/liveLab";

// Invariant suite for the live evaluator. engine.test.ts smoke-tests the whole
// pipeline; this file locks the scoring CONTRACT of evaluateLiveAnswer itself:
// clamping, penalty direction, gate consistency, and human-review triggers.
// Every case is a pure fixture, no retrieval involved.

function chunk(text: string, i: number, over: Partial<RetrievedLiveChunk> = {}): RetrievedLiveChunk {
  return {
    id: `c${i}`, documentId: "d1", chunkIndex: i, text,
    characterCount: text.length, estimatedTokens: Math.round(text.length / 4),
    metadata: { source: "test", createdAt: "" },
    rank: i + 1, relevanceScore: 0.8, matchReasons: [], citationLabel: `C${i + 1}`,
    usedInAnswer: false, ...over,
  };
}

function ans(answer: string, citations: string[], caveats: string[] = []): GeneratedLiveAnswer {
  return { answer, citations, mode: "simulated", caveats };
}

const CTX = "Daily meal reimbursement capped $75 international travel. Receipts needed above $25 during trips.";
const Q = "Daily meal spending cap international travel?";

const grounded = () =>
  evaluateLiveAnswer(Q, [
    chunk(CTX, 0, { usedInAnswer: true, relevanceScore: 0.82 }),
    chunk("Manager sign-off needed trips above $2,500 finance team checks exceptions.", 1, { relevanceScore: 0.6 }),
  ], ans("Daily meal reimbursement capped $75 international travel. Receipts needed above $25. [C1]", ["C1"], ["Applies during international trips only."]));

describe("evaluateLiveAnswer invariants", () => {
  it("is deterministic for identical inputs", () => {
    expect(JSON.stringify(grounded())).toBe(JSON.stringify(grounded()));
  });

  it("clamps every metric to 0..100 across varied fixtures", () => {
    const results = [
      grounded(),
      evaluateLiveAnswer("anything", [], ans("free-floating claim with 42 numbers", [])),
      evaluateLiveAnswer("", [chunk("some text", 0)], ans("", [])),
    ];
    for (const r of results) {
      for (const k of ["retrievalRelevance", "citationCoverage", "citationAccuracy", "faithfulness", "answerCompleteness", "contextUtilization", "hallucinationRisk", "overallQuality"] as const) {
        expect(r[k], k).toBeGreaterThanOrEqual(0);
        expect(r[k], k).toBeLessThanOrEqual(100);
        expect(Number.isInteger(r[k]), `${k} rounded`).toBe(true);
      }
    }
  });

  it("a grounded, cited answer passes: high faithfulness, low risk, no review", () => {
    const r = grounded();
    expect(r.faithfulness).toBeGreaterThanOrEqual(95);
    expect(r.hallucinationRisk).toBeLessThanOrEqual(5);
    expect(r.qualityGateStatus).toBe("Passed");
    expect(r.humanReviewRequired).toBe(false);
  });

  it("gate 'Passed' implies its published thresholds (overall>=80, risk<=20, citations>=80)", () => {
    const r = grounded();
    expect(r.overallQuality).toBeGreaterThanOrEqual(80);
    expect(r.hallucinationRisk).toBeLessThanOrEqual(20);
    expect(r.citationAccuracy).toBeGreaterThanOrEqual(80);
  });

  it("an uncited answer zeroes citation accuracy, raises risk, and forces review", () => {
    const cited = grounded();
    const uncited = evaluateLiveAnswer(Q,
      [chunk(CTX, 0, { usedInAnswer: true, relevanceScore: 0.82 })],
      ans("Daily meal reimbursement capped $75 international travel.", []));
    expect(uncited.citationAccuracy).toBe(0);
    expect(uncited.citationCoverage).toBe(0);
    expect(uncited.hallucinationRisk).toBeGreaterThan(cited.hallucinationRisk);
    expect(uncited.humanReviewRequired).toBe(true);
    expect(uncited.failureReasons.join(" ")).toMatch(/no citations/i);
  });

  it("figures absent from the evidence are penalized and named", () => {
    const clean = grounded();
    const embellished = evaluateLiveAnswer(Q, [
      chunk(CTX, 0, { usedInAnswer: true, relevanceScore: 0.82 }),
      chunk("Manager sign-off needed trips above $2,500 finance team checks exceptions.", 1, { relevanceScore: 0.6 }),
    ], ans("Daily meal reimbursement capped $75 international travel. Receipts needed above $25. Annual allowance 9999 dollars. [C1]", ["C1"], ["Applies during international trips only."]));
    expect(embellished.faithfulness).toBeLessThan(clean.faithfulness);
    expect(embellished.hallucinationRisk).toBeGreaterThan(clean.hallucinationRisk);
    expect(embellished.failureReasons.join(" ")).toMatch(/9999/);
  });

  it("high-risk topics force human review even when quality is high", () => {
    const r = evaluateLiveAnswer(
      "What does the confidential breach process say?",
      [chunk("Confidential breach process: notify security team, contain access, log evidence.", 0, { usedInAnswer: true })],
      ans("Confidential breach process: notify security team, contain access, log evidence. [C1]", ["C1"], ["Process summary only."]),
    );
    expect(r.humanReviewRequired).toBe(true);
    expect(r.failureReasons.join(" ")).toMatch(/high risk/i);
  });

  it("citation coverage is the cited share of used chunks", () => {
    const r = evaluateLiveAnswer(Q, [
      chunk(CTX, 0, { usedInAnswer: true }),
      chunk("Second used chunk about travel receipts and meals.", 1, { usedInAnswer: true }),
    ], ans("Meals capped $75. [C1]", ["C1"]));
    expect(r.citationCoverage).toBe(50);
  });

  it("retrieval relevance is the mean of chunk relevance scores", () => {
    const r = evaluateLiveAnswer(Q,
      [chunk(CTX, 0, { relevanceScore: 0.5 }), chunk("other words entirely", 1, { relevanceScore: 0.7 })],
      ans("Meals capped $75. [C1]", ["C1"]));
    expect(r.retrievalRelevance).toBe(60);
  });

  it("empty retrieval yields a Failed gate, not a crash", () => {
    const r = evaluateLiveAnswer(Q, [], ans("Confident answer with zero evidence.", []));
    expect(r.qualityGateStatus).toBe("Failed");
    expect(r.retrievalRelevance).toBe(0);
    expect(r.humanReviewRequired).toBe(true);
  });
});
