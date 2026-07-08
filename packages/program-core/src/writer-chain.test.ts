import { describe, it, expect } from "vitest";
import { demoState, DEMO_ARCHETYPES } from "./store";
import {
  buildDataReadinessHandoff,
  buildBuildOutputContract,
  deriveGovernanceDecision,
} from "./contracts";
import { deriveOpsEvidenceEnrichment } from "./operate";
import type { ProgramState } from "./types";

// Loop-safety guard for the stage-contract writers (StageContracts, OperateSpine,
// GovernLoop). The components key their write-effects on signatures of upstream
// inputs and derive contracts from the update() draft; that pattern is only safe
// while every derivation is deterministic and none feeds back into its own
// inputs. This test enforces the resulting property directly: applying the whole
// writer chain repeatedly must reach a fixed point within one pass. If a future
// edit makes a derivation read what it writes (or adds nondeterminism beyond
// timestamps), s2 !== s1 here and this fails before the UI can update-loop.

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}/;

/** Recursively drop timestamp-valued string fields (createdAt / nextReview / …),
 * which legitimately differ between two passes run milliseconds apart. */
function stripVolatile(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(stripVolatile);
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (typeof v === "string" && ISO_LIKE.test(v)) continue;
      out[k] = stripVolatile(v);
    }
    return out;
  }
  return x;
}

/** One pass of exactly what the mounted writers persist, in stage order. */
function applyWriterChain(s: ProgramState): ProgramState {
  const d: ProgramState = JSON.parse(JSON.stringify(s));
  d.data = { ...(d.data ?? {}), handoff: buildDataReadinessHandoff(d) };
  d.rag = { ...(d.rag ?? {}), contract: buildBuildOutputContract(d) };
  if (d.deploy?.evidence) d.deploy.evidence = { ...d.deploy.evidence, ...deriveOpsEvidenceEnrichment(d) };
  d.governance = { ...(d.governance ?? {}), status: "assessed", decision: deriveGovernanceDecision(d) };
  return d;
}

describe("stage-writer chain reaches a fixed point", () => {
  for (const a of DEMO_ARCHETYPES) {
    it(`converges after one pass and stays converged (${a.id})`, () => {
      const s0 = demoState(a.id);
      const s1 = applyWriterChain(s0);
      const s2 = applyWriterChain(s1);
      const s3 = applyWriterChain(s2);
      // Pass 2 must change nothing (fixed point), and it must stay fixed.
      expect(stripVolatile(s2)).toEqual(stripVolatile(s1));
      expect(stripVolatile(s3)).toEqual(stripVolatile(s2));
    });
  }

  it("handoff carries structured remediation entries (synthesized for demo archetypes)", () => {
    const s1 = applyWriterChain(demoState("decision-support"));
    const entries = s1.data?.handoff?.remediationEntries ?? [];
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.finding.length).toBeGreaterThan(0);
      expect(["watch", "risk", "critical"]).toContain(e.severity);
      expect(["open", "fixed", "accepted-risk"]).toContain(e.status);
    }
    // Sensitive archetype synthesizes a privacy-tagged item.
    expect(entries.some((e) => e.guideline === "privacy")).toBe(true);
  });

  it("a live corpus backlog takes precedence over synthesis and still converges", () => {
    const s0 = demoState("knowledge-assistant");
    s0.data = {
      ...(s0.data ?? {}),
      corpusBacklog: [
        { finding: "Topical outlier: recipe.txt", guideline: "cohesion", severity: "risk", file: "recipe.txt", status: "open" },
        { finding: "Repeated boilerplate", guideline: "concentration", severity: "watch", file: "template.txt", recommendation: "Deduplicate repeated passages", status: "accepted-risk" },
      ],
    };
    const s1 = applyWriterChain(s0);
    const s2 = applyWriterChain(s1);
    const entries = s1.data?.handoff?.remediationEntries ?? [];
    expect(entries.map((e) => e.finding)).toContain("Topical outlier: recipe.txt");
    expect(stripVolatile(s2)).toEqual(stripVolatile(s1));
    // The open risk-severity item must surface in Govern's open findings.
    const findings = s1.governance?.decision?.openFindings ?? [];
    expect(JSON.stringify(findings)).toContain("Topical outlier");
  });

  it("derivations are deterministic for identical input state", () => {
    const s = applyWriterChain(demoState("knowledge-assistant"));
    const a = stripVolatile(applyWriterChain(s));
    const b = stripVolatile(applyWriterChain(s));
    expect(a).toEqual(b);
  });
});
