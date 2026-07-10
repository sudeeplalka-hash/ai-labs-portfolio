// Model Evaluation & Threshold Economics (LB-03 · Collection 5 Live Builds).
//
// Everything on the /builds/eval-bench page is computed by this file, live in
// the browser: a small logistic model is trained by gradient descent on a
// DISCLOSED synthetic fraud corpus (the generative process is this code), and
// every curve — ROC, precision/recall, calibration, cost-vs-threshold — is
// derived from that model's real scores. No canned numbers anywhere.
//
// The dataset is synthetic ON PURPOSE and labeled as such in the UI: the lab's
// claim is the EVALUATION MATH (the part enterprises get wrong), not the data.
// Deterministic: same seed, same numbers, every visit.

export interface EvalDataset {
  X: number[][];
  y: number[]; // 1 = fraud
  features: string[];
  seed: number;
  fraudRate: number;
}

export interface LogitModel {
  w: number[];
  b: number;
  losses: number[]; // per-epoch training loss (visible math)
}

export interface RocPoint { t: number; fpr: number; tpr: number }
export interface PrPoint { t: number; recall: number; precision: number }
export interface CalibrationBin { meanP: number; fracPos: number; n: number }
export interface Confusion { tp: number; fp: number; tn: number; fn: number }

export interface ThresholdCosts {
  /** Cost of a human review triggered by any flag (TP or FP). */
  reviewCost: number;
  /** Loss when a fraudulent transaction is missed (FN). */
  fraudLoss: number;
}

export interface CostPoint { t: number; total: number; reviews: number; missed: number }

// Deterministic PRNG (mulberry32, same family the corpus lab uses).
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller gaussian from a uniform source. */
function gauss(u: () => number): number {
  const a = Math.max(u(), 1e-12);
  const b = u();
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}

export const EVAL_FEATURES = [
  "amount (z)",
  "night hour",
  "velocity (z)",
  "geo mismatch",
  "account age (z)",
  "new device",
  "noise A",
  "noise B",
];

/** Class-conditional synthetic generator. Fraud shifts the first six features;
 * the two noise dims carry no signal (they keep the model honest). */
export function genFraudDataset(seed = 7, n = 1200, fraudRate = 0.12): EvalDataset {
  const u = rng(seed);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const fraud = u() < fraudRate ? 1 : 0;
    const row = fraud
      ? [
          1.1 + 1.2 * gauss(u),
          u() < 0.55 ? 1 : 0,
          0.9 + 1.1 * gauss(u),
          u() < 0.48 ? 1 : 0,
          -0.7 + 1.0 * gauss(u),
          u() < 0.5 ? 1 : 0,
          gauss(u),
          gauss(u),
        ]
      : [
          -0.15 + 0.9 * gauss(u),
          u() < 0.18 ? 1 : 0,
          -0.1 + 0.8 * gauss(u),
          u() < 0.07 ? 1 : 0,
          0.1 + 0.95 * gauss(u),
          u() < 0.12 ? 1 : 0,
          gauss(u),
          gauss(u),
        ];
    X.push(row);
    y.push(fraud);
  }
  return { X, y, features: EVAL_FEATURES, seed, fraudRate };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Full-batch gradient descent logistic regression with L2. Deterministic. */
export function trainLogit(
  X: number[][],
  y: number[],
  opts: { epochs?: number; lr?: number; l2?: number } = {},
): LogitModel {
  const { epochs = 300, lr = 0.3, l2 = 1e-3 } = opts;
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const w = new Array(d).fill(0);
  let b = 0;
  const losses: number[] = [];
  for (let e = 0; e < epochs; e++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    let loss = 0;
    for (let i = 0; i < n; i++) {
      const z = X[i].reduce((a, x, j) => a + x * w[j], b);
      const p = sigmoid(z);
      const err = p - y[i];
      for (let j = 0; j < d; j++) gw[j] += err * X[i][j];
      gb += err;
      loss += -(y[i] * Math.log(Math.max(p, 1e-12)) + (1 - y[i]) * Math.log(Math.max(1 - p, 1e-12)));
    }
    for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / n + l2 * w[j]);
    b -= lr * (gb / n);
    losses.push(loss / n);
  }
  return { w, b, losses };
}

export function predictProba(m: LogitModel, X: number[][]): number[] {
  return X.map((row) => sigmoid(row.reduce((a, x, j) => a + x * m.w[j], m.b)));
}

/** ROC over every distinct score threshold (plus the (0,0)/(1,1) endpoints). */
export function rocCurve(p: number[], y: number[]): { points: RocPoint[]; auc: number } {
  const pos = y.filter((v) => v === 1).length;
  const neg = y.length - pos;
  const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const points: RocPoint[] = [{ t: 1 + 1e-9, fpr: 0, tpr: 0 }];
  let tp = 0;
  let fp = 0;
  for (let k = 0; k < order.length; k++) {
    const i = order[k];
    if (y[i] === 1) tp++;
    else fp++;
    // emit a point when the NEXT score differs (ties share one point)
    if (k === order.length - 1 || p[order[k + 1]] !== p[i]) {
      points.push({ t: p[i], fpr: neg ? fp / neg : 0, tpr: pos ? tp / pos : 0 });
    }
  }
  let auc = 0;
  for (let k = 1; k < points.length; k++) {
    auc += ((points[k].fpr - points[k - 1].fpr) * (points[k].tpr + points[k - 1].tpr)) / 2;
  }
  return { points, auc };
}

export function prCurve(p: number[], y: number[]): { points: PrPoint[]; auprc: number } {
  const pos = y.filter((v) => v === 1).length;
  const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const points: PrPoint[] = [];
  let tp = 0;
  let fp = 0;
  for (let k = 0; k < order.length; k++) {
    const i = order[k];
    if (y[i] === 1) tp++;
    else fp++;
    if (k === order.length - 1 || p[order[k + 1]] !== p[i]) {
      points.push({ t: p[i], recall: pos ? tp / pos : 0, precision: tp + fp ? tp / (tp + fp) : 1 });
    }
  }
  // step-wise area (average precision form)
  let auprc = 0;
  let prevRecall = 0;
  for (const pt of points) {
    auprc += (pt.recall - prevRecall) * pt.precision;
    prevRecall = pt.recall;
  }
  return { points, auprc };
}

export function calibration(p: number[], y: number[], bins = 10): { bins: CalibrationBin[]; brier: number } {
  const out: CalibrationBin[] = Array.from({ length: bins }, () => ({ meanP: 0, fracPos: 0, n: 0 }));
  let brier = 0;
  for (let i = 0; i < p.length; i++) {
    const b = Math.min(bins - 1, Math.floor(p[i] * bins));
    out[b].meanP += p[i];
    out[b].fracPos += y[i];
    out[b].n++;
    brier += (p[i] - y[i]) ** 2;
  }
  for (const b of out) {
    if (b.n > 0) {
      b.meanP /= b.n;
      b.fracPos /= b.n;
    }
  }
  return { bins: out, brier: brier / Math.max(1, p.length) };
}

export function confusionAt(p: number[], y: number[], t: number): Confusion {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] >= t) {
      if (y[i] === 1) tp++;
      else fp++;
    } else {
      if (y[i] === 1) fn++;
      else tn++;
    }
  }
  return { tp, fp, tn, fn };
}

/** Total operating cost at a threshold: every flag buys a human review, every
 * miss eats a fraud loss. The U-shaped curve is the whole point of the lab. */
export function thresholdEconomics(
  p: number[],
  y: number[],
  costs: ThresholdCosts,
  steps = 99,
): { curve: CostPoint[]; optimal: CostPoint } {
  const curve: CostPoint[] = [];
  for (let s = 1; s <= steps; s++) {
    const t = s / (steps + 1);
    const c = confusionAt(p, y, t);
    const reviews = (c.tp + c.fp) * costs.reviewCost;
    const missed = c.fn * costs.fraudLoss;
    curve.push({ t, total: reviews + missed, reviews, missed });
  }
  const optimal = curve.reduce((best, pt) => (pt.total < best.total ? pt : best), curve[0]);
  return { curve, optimal };
}

export interface EvalBenchResult {
  dataset: EvalDataset;
  model: LogitModel;
  scores: number[];
  roc: { points: RocPoint[]; auc: number };
  pr: { points: PrPoint[]; auprc: number };
  cal: { bins: CalibrationBin[]; brier: number };
}

/** One-shot orchestrator for the page: generate → train → score → curves. */
export function runEvalBench(seed = 7): EvalBenchResult {
  const dataset = genFraudDataset(seed);
  const model = trainLogit(dataset.X, dataset.y);
  const scores = predictProba(model, dataset.X);
  return {
    dataset,
    model,
    scores,
    roc: rocCurve(scores, dataset.y),
    pr: prCurve(scores, dataset.y),
    cal: calibration(scores, dataset.y),
  };
}
