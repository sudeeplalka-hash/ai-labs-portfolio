import { describe, it, expect } from "vitest";
import { chunkDocument } from "@rag/lib/live-lab/chunking";
import { getRetriever } from "@rag/lib/live-lab/retrieval";
import { buildBoilerplateSet, isBoilerplate } from "@rag/lib/live-lab/boilerplate";
import { SimulatedAnswerGenerator } from "@rag/lib/live-lab/answerGeneration";
import { evaluateLiveAnswer } from "@rag/lib/live-lab/evaluation";
import { cleanSentence } from "@rag/lib/live-lab/textUtils";
import { expandQuery } from "@rag/lib/live-lab/queryExpansion";
import { estimateCost } from "@rag/lib/live-lab/costing";
import { buildLiveTrace } from "@rag/lib/live-lab/trace";
import { analyzeTokens } from "@rag/lib/live-lab/tokenAnalysis";
import { buildProjector } from "@rag/lib/live-lab/embeddings";
import type { LiveLabDocument } from "@rag/types/liveLab";

const RAW = `# Travel Policy
The daily meal reimbursement limit for international travel is $75 per day. Receipts are required for expenses over $25.
For the exclusive use of test, 2024.

# Approval
Manager approval is required for trips over $2,500. The finance team reviews exceptions before payment.
For the exclusive use of test, 2024.`;

const DOC: LiveLabDocument = {
  id: "t", name: "Test Policy", sourceType: "paste", fileType: "txt",
  rawText: RAW, characterCount: RAW.length, estimatedTokens: Math.round(RAW.length / 4), createdAt: "",
};

describe("chunking", () => {
  it("splits a structured document into multiple chunks", () => {
    const chunks = chunkDocument(DOC);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => c.text.length > 0)).toBe(true);
  });
});

describe("boilerplate", () => {
  it("detects a repeated footer line", () => {
    const set = buildBoilerplateSet(chunkDocument(DOC).map((c) => c.text));
    expect(isBoilerplate("For the exclusive use of test, 2024.", set)).toBe(true);
    expect(isBoilerplate("The daily meal reimbursement limit is $75 per day.", set)).toBe(false);
  });
});

describe("BM25 retrieval", () => {
  it("ranks the relevant chunk first with a positive score", () => {
    const chunks = chunkDocument(DOC);
    const r = getRetriever("lexical").retrieve("What is the meal reimbursement limit?", chunks, 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].citationLabel).toBe("C1");
    expect(r[0].relevanceScore).toBeGreaterThan(0.3);
    expect(r[0].text.toLowerCase()).toContain("meal");
  });
});

describe("answer generation", () => {
  it("returns a cited answer for an answerable question", async () => {
    const chunks = chunkDocument(DOC);
    const r = getRetriever("lexical").retrieve("What is the daily meal reimbursement limit?", chunks, 5);
    const ans = await new SimulatedAnswerGenerator().generateAnswer({ question: "What is the daily meal reimbursement limit?", retrievedChunks: r });
    expect(ans.answer.length).toBeGreaterThan(10);
    expect(ans.citations.length).toBeGreaterThan(0);
    expect(ans.answer).toContain("75");
  });

  it("hedges honestly when nothing relevant is retrieved", async () => {
    const ans = await new SimulatedAnswerGenerator().generateAnswer({ question: "What is the capital of France?", retrievedChunks: [] });
    expect(ans.citations.length).toBe(0);
    expect(ans.answer.toLowerCase()).toContain("couldn't find");
  });
});

describe("evaluation", () => {
  it("produces deterministic scores within range and a valid gate", async () => {
    const chunks = chunkDocument(DOC);
    const q = "When is manager approval required?";
    const r = getRetriever("lexical").retrieve(q, chunks, 5);
    const ans = await new SimulatedAnswerGenerator().generateAnswer({ question: q, retrievedChunks: r });
    const used = r.map((c) => ({ ...c, usedInAnswer: ans.citations.includes(c.citationLabel) }));
    const ev = evaluateLiveAnswer(q, used, ans);
    for (const v of [ev.overallQuality, ev.faithfulness, ev.citationAccuracy, ev.hallucinationRisk]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(["Passed", "Warning", "Failed"]).toContain(ev.qualityGateStatus);
  });
});

describe("text + query helpers", () => {
  it("cleans PDF spacing artifacts", () => {
    expect(cleanSentence("renewable sources (RES ) were variable")).toBe("renewable sources (RES) were variable");
  });
  it("expands founder-type queries with synonyms", () => {
    expect(expandQuery("who founded the company")).toContain("origin");
  });
});

describe("token analysis", () => {
  it("computes token coverage and context composition from a trace", async () => {
    const chunks = chunkDocument(DOC);
    const q = "What is the meal reimbursement limit?";
    const r = getRetriever("lexical").retrieve(q, chunks, 5);
    const ans = await new SimulatedAnswerGenerator().generateAnswer({ question: q, retrievedChunks: r });
    const used = r.map((c) => ({ ...c, usedInAnswer: ans.citations.includes(c.citationLabel) }));
    const ev = evaluateLiveAnswer(q, used, ans);
    const cost = estimateCost(q, used, ans.answer);
    const trace = buildLiveTrace({
      documentId: DOC.id, documentName: DOC.name, question: q,
      retrievedChunks: used, generatedAnswer: ans, evaluation: ev,
      stepDurations: { retrieve: 50, generate: 200, evaluate: 80 }, estimatedCost: cost.estimatedCost,
    });
    const ta = analyzeTokens(trace, DOC.estimatedTokens);
    expect(ta.coverage).toBeGreaterThanOrEqual(0);
    expect(ta.coverage).toBeLessThanOrEqual(100);
    expect(ta.contextTokens).toBeGreaterThan(0);
    expect(ta.questionTokens.length).toBeGreaterThan(0);
  });
});

describe("embedding projector", () => {
  const BIG: LiveLabDocument = {
    id: "b", name: "Big", sourceType: "paste", fileType: "txt",
    rawText: `# Energy
Renewable energy production is variable and can destabilize the electrical grid.

# Forecasting
Accurate weather forecasting helps predict solar and wind energy output.

# Customers
Energy traders pay for reliable production forecasts to reduce imbalance penalties.

# Investment
The company raised funding from investors to scale the forecasting software.`,
    characterCount: 0, estimatedTokens: 0, createdAt: "",
  };
  BIG.characterCount = BIG.rawText.length;
  BIG.estimatedTokens = Math.round(BIG.rawText.length / 4);

  it("produces finite chunk positions and keyword points", () => {
    const m = buildProjector(chunkDocument(BIG));
    expect(m.points.length).toBeGreaterThanOrEqual(4);
    expect(m.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z))).toBe(true);
    expect(m.keywordPoints.length).toBeGreaterThan(0);
    expect(m.keywordPoints.every((k) => Number.isFinite(k.x) && k.text.length > 0)).toBe(true);
  });
});
