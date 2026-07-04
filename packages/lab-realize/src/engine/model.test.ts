import { describe, it, expect } from "vitest";
import { deriveInputs, applyOverrides, computeRoi, valueRiver, sensitivity } from "./model";
import type { ProgramState } from "@labs/program-core";

const state = (over: Partial<ProgramState["initiative"]> = {}, extra: Partial<ProgramState> = {}): ProgramState => ({
  initiative: {
    name: "Support assistant", rawAmbition: "", sharpenedProblem: "Help customers fast",
    params: { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" },
    selectedUseCase: { id: 0, title: "x", bucket: "Wins", value: 70, effort: 40 }, scope: 0.5, successMetric: null,
    scores: { value: 72, feasibility: 64, dataReadiness: 58 }, valueHypothesis: null, createdAt: null, ...over,
  },
  progress: { frame: "done", data: "active", build: "active", deploy: "active", govern: "active" },
  ...extra,
});

describe("realize model", () => {
  it("derives traceable inputs from Framing", () => {
    const inp = deriveInputs(state());
    expect(inp.annualTasks.value).toBeGreaterThan(0);
    expect(inp.annualTasks.source).toBe("frame");
    expect(inp.adoption.value).toBeGreaterThan(0);
    expect(inp.riskDiscount.source).toBe("govern");
  });

  it("uses the Deploy slice for run cost when present", () => {
    const withDeploy = deriveInputs(state({}, { deploy: { monthlyCostAtTarget: 50000 } }));
    expect(withDeploy.annualRunCost.value).toBe(600000);
    expect(withDeploy.annualRunCost.source).toBe("deploy");
  });

  it("leaks reduce value: addressable > realized > risk-adjusted", () => {
    const r = computeRoi(deriveInputs(state()));
    expect(r.addressable).toBeGreaterThan(r.realized);
    expect(r.realized).toBeGreaterThan(r.riskAdjustedValue);
  });

  it("value river conserves: leaks + out = addressable", () => {
    const inp = deriveInputs(state());
    const r = computeRoi(inp);
    const flows = valueRiver(inp, r);
    const inAmt = flows.find((f) => f.kind === "in")!.amount;
    const rest = flows.filter((f) => f.kind !== "in").reduce((s, f) => s + f.amount, 0);
    expect(Math.abs(inAmt - rest)).toBeLessThan(5); // rounding
  });

  it("higher adoption raises risk-adjusted value", () => {
    const inp = deriveInputs(state());
    const lo = computeRoi(applyOverrides(inp, { adoption: 0.3 }));
    const hi = computeRoi(applyOverrides(inp, { adoption: 0.9 }));
    expect(hi.riskAdjustedValue).toBeGreaterThan(lo.riskAdjustedValue);
  });

  it("sensitivity is sorted by impact", () => {
    const bars = sensitivity(deriveInputs(state()));
    for (let i = 1; i < bars.length; i++) expect(bars[i - 1].swing).toBeGreaterThanOrEqual(bars[i].swing);
  });
});
