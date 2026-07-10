import { describe, it, expect } from "vitest";
import {
  genFraudDataset, trainLogit, predictProba, rocCurve, prCurve,
  calibration, confusionAt, thresholdEconomics, runEvalBench,
} from "./evalbench";

describe("eval bench engine (LB-03)", () => {
  const r = runEvalBench(7);
  const { scores } = r;
  const y = r.dataset.y;

  it("is deterministic: same seed, same numbers", () => {
    const again = runEvalBench(7);
    expect(again.roc.auc).toBe(r.roc.auc);
    expect(again.scores).toEqual(scores);
    expect(again.model.w).toEqual(r.model.w);
  });

  it("training actually learns: loss decreases, AUC beats random by a wide margin", () => {
    const l = r.model.losses;
    expect(l[l.length - 1]).toBeLessThan(l[0]);
    expect(r.roc.auc).toBeGreaterThan(0.85);
    expect(r.roc.auc).toBeLessThanOrEqual(1);
  });

  it("shuffled labels give a near-0.5 AUC (the metric is honest)", () => {
    const d = genFraudDataset(7, 800);
    // deterministic shuffle of labels breaks the feature-label link
    const shuffled = [...d.y];
    let s = 42;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) % 2147483648;
      const j = s % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const m = trainLogit(d.X, shuffled, { epochs: 120 });
    const p = predictProba(m, d.X);
    const { auc } = rocCurve(p, shuffled);
    expect(auc).toBeGreaterThan(0.4);
    expect(auc).toBeLessThan(0.62);
  });

  it("ROC starts at (0,0) and ends at (1,1); curve is monotone", () => {
    const pts = r.roc.points;
    expect(pts[0].fpr).toBe(0);
    expect(pts[0].tpr).toBe(0);
    expect(pts[pts.length - 1].fpr).toBeCloseTo(1, 9);
    expect(pts[pts.length - 1].tpr).toBeCloseTo(1, 9);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].fpr).toBeGreaterThanOrEqual(pts[i - 1].fpr);
      expect(pts[i].tpr).toBeGreaterThanOrEqual(pts[i - 1].tpr);
    }
  });

  it("PR curve is bounded and AUPRC beats the base rate", () => {
    expect(r.pr.auprc).toBeGreaterThan(r.dataset.fraudRate);
    expect(r.pr.auprc).toBeLessThanOrEqual(1);
    for (const pt of r.pr.points) {
      expect(pt.precision).toBeGreaterThanOrEqual(0);
      expect(pt.precision).toBeLessThanOrEqual(1);
    }
  });

  it("calibration bins account for every sample; Brier is small for a learned model", () => {
    const total = r.cal.bins.reduce((a, b) => a + b.n, 0);
    expect(total).toBe(y.length);
    expect(r.cal.brier).toBeLessThan(0.12);
  });

  it("confusion reconciles and moves the right way with the threshold", () => {
    const lo = confusionAt(scores, y, 0.1);
    const hi = confusionAt(scores, y, 0.9);
    for (const c of [lo, hi]) expect(c.tp + c.fp + c.tn + c.fn).toBe(y.length);
    expect(lo.tp).toBeGreaterThanOrEqual(hi.tp); // lower bar catches more fraud
    expect(lo.fp).toBeGreaterThanOrEqual(hi.fp); // and flags more innocents
  });

  it("threshold economics: the optimum beats both extremes (the U-curve exists)", () => {
    const { curve, optimal } = thresholdEconomics(scores, y, { reviewCost: 8, fraudLoss: 420 });
    expect(optimal.total).toBeLessThanOrEqual(curve[0].total);
    expect(optimal.total).toBeLessThanOrEqual(curve[curve.length - 1].total);
    expect(optimal.t).toBeGreaterThan(0);
    expect(optimal.t).toBeLessThan(1);
    // cost components are the visible math: total = reviews + missed
    for (const pt of curve.slice(0, 5)) expect(pt.total).toBeCloseTo(pt.reviews + pt.missed, 6);
  });
});
