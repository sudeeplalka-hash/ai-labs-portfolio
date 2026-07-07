import { describe, it, expect } from "vitest";
import { MODELS, SCENARIOS, rankModels, scoreModel, suggestScenario, topStrengths } from "./models";

const byId = (id: string) => SCENARIOS.find((s) => s.id === id)!.weights;

describe("model-selection scoring", () => {
  it("produces a 0..100 fit for every model", () => {
    const w = byId("balanced");
    for (const m of MODELS) {
      const s = scoreModel(m, w);
      expect(s.fit).toBeGreaterThanOrEqual(0);
      expect(s.fit).toBeLessThanOrEqual(100);
    }
  });

  it("ranks the flagship top for a max-quality scenario", () => {
    const ranked = rankModels(byId("quality"));
    expect(ranked[0].model.id).toBe("frontier-flagship");
  });

  it("favors a self-hosted/open option for a sovereign scenario", () => {
    const ranked = rankModels(byId("sovereign"));
    expect(ranked[0].model.openWeights).toBe(true);
    expect(ranked[0].model.deployment).toContain("Self hosted");
  });

  it("shifts the winner when the scenario changes", () => {
    const quality = rankModels(byId("quality"))[0].model.id;
    const volume = rankModels(byId("volume"))[0].model.id;
    expect(quality).not.toBe(volume);
  });

  it("surfaces the model's strongest weighted criteria", () => {
    const top = rankModels(byId("quality"))[0];
    expect(topStrengths(top).length).toBe(2);
  });

  it("maps posture/risk to a sensible scenario", () => {
    expect(suggestScenario("cost-efficient", "low")).toBe("volume");
    expect(suggestScenario("ambitious", "low")).toBe("quality");
    expect(suggestScenario(null, "regulated / PHI")).toBe("regulated");
    expect(suggestScenario(null, null)).toBe("balanced");
  });
});
