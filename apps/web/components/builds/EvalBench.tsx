"use client";

// LB-03 · Model Evaluation & Threshold Economics (Collection 5, Live Builds).
// Everything on screen is computed in this browser session by @labs/engines/evalbench:
// a logistic model trained live on a DISCLOSED synthetic corpus, then real ROC,
// precision/recall, calibration, and a cost-vs-threshold curve. The dataset is
// synthetic on purpose and labeled as such; the claim is the evaluation math.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, SlidersHorizontal } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTip,
  ReferenceLine, ReferenceDot, ResponsiveContainer,
} from "recharts";
import { Panel, SectionHeader, Badge, KpiCard, LiveBadge } from "@labs/design-system";
import { runEvalBench, confusionAt, thresholdEconomics } from "@labs/engines";

const INK = "#152433";
const BLUE = "#2563eb";
const EMERALD = "#059669";
const AMBER = "#d97706";
const ROSE = "#e11d48";

function sample<T>(arr: T[], max = 160): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}

export function EvalBench() {
  // One deterministic run per visit: generate → train → score → curves.
  const r = useMemo(() => runEvalBench(7), []);
  const [threshold, setThreshold] = useState(0.5);
  const [reviewCost, setReviewCost] = useState(8);
  const [fraudLoss, setFraudLoss] = useState(420);

  const econ = useMemo(
    () => thresholdEconomics(r.scores, r.dataset.y, { reviewCost, fraudLoss }),
    [r, reviewCost, fraudLoss],
  );
  const cm = useMemo(() => confusionAt(r.scores, r.dataset.y, threshold), [r, threshold]);
  const atT = useMemo(() => {
    const reviews = (cm.tp + cm.fp) * reviewCost;
    const missed = cm.fn * fraudLoss;
    return { reviews, missed, total: reviews + missed };
  }, [cm, reviewCost, fraudLoss]);

  const rocData = useMemo(() => sample(r.roc.points).map((p) => ({ x: +p.fpr.toFixed(4), y: +p.tpr.toFixed(4) })), [r]);
  const prData = useMemo(() => sample(r.pr.points).map((p) => ({ x: +p.recall.toFixed(4), y: +p.precision.toFixed(4) })), [r]);
  const calData = useMemo(() => r.cal.bins.filter((b) => b.n > 0).map((b) => ({ x: +b.meanP.toFixed(3), y: +b.fracPos.toFixed(3), n: b.n })), [r]);
  const costData = useMemo(() => econ.curve.map((p) => ({ t: +p.t.toFixed(3), total: Math.round(p.total), reviews: Math.round(p.reviews), missed: Math.round(p.missed) })), [econ]);

  const fraudCount = r.dataset.y.filter((v) => v === 1).length;
  const precision = cm.tp + cm.fp ? cm.tp / (cm.tp + cm.fp) : 0;
  const recall = cm.tp + cm.fn ? cm.tp / (cm.tp + cm.fn) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-1 flex items-center gap-2">
        <Link href="/#collections" className="inline-flex items-center gap-1 text-xs text-slatey-500 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Live Builds
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Model Evaluation &amp; Threshold Economics</h2>
        <LiveBadge mode="LIVE" />
        <Badge tone="amber">synthetic data · generator disclosed</Badge>
      </div>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slatey-500">
        A logistic model was just trained in your browser ({r.model.losses.length} gradient-descent epochs) on a seeded
        synthetic fraud corpus of {r.dataset.y.length.toLocaleString()} transactions ({fraudCount} fraudulent, base rate{" "}
        {(r.dataset.fraudRate * 100).toFixed(0)}%). The generative process is in <code>evalbench.ts</code> — nothing here is a
        canned figure. The question this lab answers: <span className="text-ink">where do you set the decision threshold, in dollars?</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="ROC AUC" value={r.roc.auc.toFixed(3)} interpretation="ranking quality across all thresholds" />
        <KpiCard label="PR AUC" value={r.pr.auprc.toFixed(3)} interpretation={`vs ${(r.dataset.fraudRate * 100).toFixed(0)}% base rate`} />
        <KpiCard label="Brier score" value={r.cal.brier.toFixed(3)} interpretation="probability quality (lower is better)" />
        <KpiCard label="Cost-optimal threshold" value={econ.optimal.t.toFixed(2)} interpretation={`$${Math.round(econ.optimal.total).toLocaleString()} total operating cost`} tone="healthy" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionHeader title="ROC curve" description={`Area ${r.roc.auc.toFixed(3)} — computed from ${r.roc.points.length.toLocaleString()} distinct score thresholds`} />
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={rocData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: "false positive rate", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} />
                <ChartTip formatter={(v: number) => v.toFixed(3)} labelFormatter={(l) => `FPR ${l}`} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Line dataKey="y" dot={false} stroke={BLUE} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHeader title="Precision / recall" description={`Average precision ${r.pr.auprc.toFixed(3)} — the honest curve at a ${(r.dataset.fraudRate * 100).toFixed(0)}% base rate`} />
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={prData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: "recall", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} />
                <ChartTip formatter={(v: number) => v.toFixed(3)} labelFormatter={(l) => `recall ${l}`} />
                <ReferenceLine y={r.dataset.fraudRate} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Line dataKey="y" dot={false} stroke={EMERALD} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2">
          <SectionHeader title="Calibration" description={`Reliability by decile · Brier ${r.cal.brier.toFixed(3)} — do 0.8 scores mean 80%?`} />
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={calData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: "predicted probability", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} />
                <ChartTip formatter={(v: number) => (typeof v === "number" ? v.toFixed(3) : v)} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Line dataKey="y" dot={{ r: 3 }} stroke={AMBER} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-3">
          <div className="flex items-start justify-between gap-2">
            <SectionHeader title="Threshold economics" description="Every flag buys a review; every miss eats a loss. The U-curve picks the operating point." icon={SlidersHorizontal} />
          </div>
          <div className="mb-3 flex flex-wrap items-end gap-4 text-xs">
            <label className="flex flex-col gap-1 text-slatey-500">
              review cost / flag
              <input type="number" min={1} value={reviewCost} onChange={(e) => setReviewCost(Math.max(1, Number(e.target.value) || 1))} className="w-24 rounded border border-line px-2 py-1 text-ink" />
            </label>
            <label className="flex flex-col gap-1 text-slatey-500">
              loss / missed fraud
              <input type="number" min={1} value={fraudLoss} onChange={(e) => setFraudLoss(Math.max(1, Number(e.target.value) || 1))} className="w-24 rounded border border-line px-2 py-1 text-ink" />
            </label>
            <div className="text-[11px] text-slatey-500">
              optimum <span className="font-semibold text-ink">t = {econ.optimal.t.toFixed(2)}</span> · ${Math.round(econ.optimal.total).toLocaleString()}
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={costData} margin={{ top: 4, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: "decision threshold", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTip formatter={(v: number) => `$${v.toLocaleString()}`} labelFormatter={(l) => `t = ${l}`} />
                <Line dataKey="total" dot={false} stroke={INK} strokeWidth={2} isAnimationActive={false} />
                <Line dataKey="reviews" dot={false} stroke={BLUE} strokeWidth={1.2} strokeDasharray="4 3" isAnimationActive={false} />
                <Line dataKey="missed" dot={false} stroke={ROSE} strokeWidth={1.2} strokeDasharray="4 3" isAnimationActive={false} />
                <ReferenceDot x={+econ.optimal.t.toFixed(3)} y={Math.round(econ.optimal.total)} r={4} fill={EMERALD} stroke="none" />
                <ReferenceLine x={+threshold.toFixed(2)} stroke={AMBER} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <SectionHeader title="Operate the threshold" description="Drag the bar; the confusion matrix and the bill move together." icon={FlaskConical} />
        <input type="range" min={0.02} max={0.98} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-primary" aria-label="decision threshold" />
        <div className="mt-1 mb-4 text-center font-mono text-xs text-slatey-500">threshold = {threshold.toFixed(2)}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 p-3"><div className="text-xl font-semibold text-emerald-700">{cm.tp}</div><div className="text-[11px] text-slatey-500">fraud caught (TP)</div></div>
            <div className="rounded-lg bg-amber-50 p-3"><div className="text-xl font-semibold text-amber-700">{cm.fp}</div><div className="text-[11px] text-slatey-500">false alarms (FP)</div></div>
            <div className="rounded-lg bg-rose-50 p-3"><div className="text-xl font-semibold text-rose-700">{cm.fn}</div><div className="text-[11px] text-slatey-500">fraud missed (FN)</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-semibold text-ink">{cm.tn}</div><div className="text-[11px] text-slatey-500">clean passed (TN)</div></div>
          </div>
          <div className="flex flex-col justify-center gap-1.5 text-sm">
            <div className="flex justify-between border-b border-line pb-1"><span className="text-slatey-500">precision / recall here</span><span className="font-mono text-ink">{precision.toFixed(2)} / {recall.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slatey-500">review bill ({cm.tp + cm.fp} flags × ${reviewCost})</span><span className="font-mono text-ink">${atT.reviews.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slatey-500">missed-fraud losses ({cm.fn} × ${fraudLoss})</span><span className="font-mono text-ink">${atT.missed.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-line pt-1 font-semibold"><span className="text-ink">total at t = {threshold.toFixed(2)}</span><span className="font-mono text-ink">${atT.total.toLocaleString()}</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-slatey-500">vs cost-optimal t = {econ.optimal.t.toFixed(2)}</span><span className="font-mono text-emerald-700">${Math.round(econ.optimal.total).toLocaleString()}</span></div>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11.5px] leading-relaxed text-slatey-500">
          Visible math: score = σ(w·x + b), trained by full-batch gradient descent (L2 = 1e-3). ROC sweeps every distinct
          score; AUC is the trapezoid sum. Total cost(t) = flags(t) × review cost + misses(t) × fraud loss. Data is
          synthetic and seeded (mulberry32, seed 7) with two pure-noise features — the generative process ships in the
          same tested module as these formulas (<code>@labs/engines/evalbench</code>).
        </p>
      </Panel>
    </div>
  );
}
