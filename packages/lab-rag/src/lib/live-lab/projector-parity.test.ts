import { describe, it, expect } from "vitest";
import { buildProjector } from "./embeddings";
import type { DocumentChunk } from "@rag/types/liveLab";
import fixture from "./__fixtures__/projector-parity.json";

// Regression guard for the @labs/kit math lift (Corpus Intelligence Phase 0):
// buildProjector must reproduce the exact pre-lift projection recorded in the
// fixture. If this fails, the shared projection engine changed behavior, and the
// Build 3D projector (and anything else on kit math) changed with it.

const mk = (i: number, heading: string, text: string): DocumentChunk => ({
  id: `c${i}`, documentId: "doc1", chunkIndex: i, heading, text,
  characterCount: text.length, estimatedTokens: Math.ceil(text.length / 4),
  metadata: { source: "fixture", createdAt: "2026-01-01" },
});

const CHUNKS: DocumentChunk[] = [
  mk(0, "Governance", "governance policy controls audit evidence tiering approval workflow risk controls policy review board escalation ownership accountability framework"),
  mk(1, "Governance", "policy audit controls governance risk tier evidence approval conditions review findings compliance obligations regulatory mapping controls"),
  mk(2, "Retrieval", "retrieval ranking evidence chunks embedding index search relevance precision recall reranking citations grounding passages window"),
  mk(3, "Retrieval", "search index retrieval embedding vectors ranking relevance rerank citations faithfulness grounding evidence answer synthesis"),
  mk(4, "Economics", "cost tokens pricing inference budget forecast utilization crossover savings caching batching volume unit economics margin"),
  mk(5, "Economics", "budget cost pricing tokens caching batch inference spend forecast unit margin utilization capacity planning economics"),
  mk(6, "Adoption", "adoption training enablement champions workflow trust incentives rollout readiness sponsorship communication change management"),
  mk(7, "Adoption", "change rollout adoption enablement training incentives trust workflow sponsorship readiness culture behaviors champions"),
];

describe("projector parity with pre-lift recording", () => {
  const model = buildProjector(CHUNKS);

  it("reproduces every projected point exactly", () => {
    expect(model.points.length).toBe(fixture.points.length);
    model.points.forEach((p, i) => {
      const f = fixture.points[i];
      expect(p.chunkId).toBe(f.id);
      expect(p.section).toBe(f.section);
      expect(p.x).toBeCloseTo(f.x, 9);
      expect(p.y).toBeCloseTo(f.y, 9);
      expect(p.z).toBeCloseTo(f.z, 9);
    });
  });

  it("reproduces sections, color mode, and keyword map", () => {
    expect(model.sections.map((s) => s.label)).toEqual(fixture.sections);
    expect(model.colorBy).toBe(fixture.colorBy);
    expect(model.keywordPoints.length).toBe(fixture.keywords.length);
    model.keywordPoints.forEach((k, i) => {
      const f = fixture.keywords[i];
      expect(k.text).toBe(f.t);
      expect(k.x).toBeCloseTo(f.x, 9);
      expect(k.y).toBeCloseTo(f.y, 9);
      expect(k.z).toBeCloseTo(f.z, 9);
    });
  });

  it("reproduces the projectText probe", () => {
    const p = model.projectText("governance audit policy controls risk");
    expect(p.x).toBeCloseTo(fixture.probe.x, 9);
    expect(p.y).toBeCloseTo(fixture.probe.y, 9);
    expect(p.z).toBeCloseTo(fixture.probe.z, 9);
  });
});
