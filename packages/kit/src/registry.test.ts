import { describe, it, expect } from "vitest";
import { LABS, DOMAINS, labById, progress, liveShippedCount } from "./registry";
import { MODEL_CATALOG, LIVE_MODEL, LIVE_MODEL_CHEAP, modelInfo } from "./models";
import { MODEL_PRICING, modelPrice } from "./pricing";

describe("labs-registry invariants", () => {
  it("every lab has a unique id", () => {
    const ids = LABS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every lab has a problem line and a mapped decision (no empty claims)", () => {
    for (const l of LABS) {
      expect(l.problem.trim().length, `${l.id} problem`).toBeGreaterThan(0);
      expect(l.decision.trim().length, `${l.id} decision`).toBeGreaterThan(0);
    }
  });

  it("catalog labs (C2/3/4) carry a LIVE or SIMULATED badge", () => {
    for (const l of LABS.filter((x) => x.collection >= 2)) {
      expect(l.live, `${l.id} badge`).not.toBeNull();
    }
  });

  it("every domain referencing a lab points at a real lab id (§C0: no claim without evidence)", () => {
    for (const d of DOMAINS) {
      for (const id of d.labIds) {
        expect(labById(id), `domain ${d.id} → ${id}`).toBeDefined();
      }
    }
    // Every domain must have at least one evidence source (lab, engagement, or credential).
    for (const d of DOMAINS) {
      const hasEvidence = d.labIds.length + d.engagementEvidence.length + (d.credentialIds?.length ?? 0) > 0;
      expect(hasEvidence, `domain ${d.id} has evidence`).toBe(true);
    }
  });

  it("progress counts reconcile to the catalog total", () => {
    const p = progress();
    expect(p.shipped + p.inBuild + p.planned).toBe(p.total);
  });
});

describe("model + pricing config", () => {
  it("LIVE_MODEL and cheap model exist in the catalog", () => {
    expect(modelInfo(LIVE_MODEL)).toBeDefined();
    expect(modelInfo(LIVE_MODEL_CHEAP)).toBeDefined();
  });

  it("every priced model exists in the catalog", () => {
    for (const p of MODEL_PRICING) {
      expect(modelInfo(p.id), `pricing ${p.id}`).toBeDefined();
    }
  });

  it("output price is never below input price (sanity)", () => {
    for (const m of MODEL_CATALOG) {
      const p = modelPrice(m.id);
      if (p) expect(p.outputPerMTok).toBeGreaterThanOrEqual(p.inputPerMTok);
    }
  });

  it("has at least one currently-live shipped lab (Collection 1 spine)", () => {
    expect(liveShippedCount()).toBeGreaterThan(0);
  });
});
