"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTip, ReferenceLine, ReferenceDot, ResponsiveContainer } from "recharts";
import { InstrumentShell, DecisionSummary, Provenance, Panel, SectionHeader, KpiCard, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction } from "@labs/design-system";
import { runEvalBench, confusionAt, thresholdEconomics } from "@labs/engines";
import { ChangeReceipt, EvidenceTable, signed } from "../agents/AgentExperience";

const INK = "#152433";
const BLUE = "#2563eb";
const GREEN = "#087f61";
const AMBER = "#a76509";
const ROSE = "#be234a";
const label = { fontSize: 12, fill: "#52647a" };
const button = "min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-primary";
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
function sample<T>(values: T[], max = 160): T[] {
  if (values.length <= max) return values;
  const sampled = Array.from({ length: max }, (_, index) => values[Math.floor(index * values.length / max)]);
  return [...sampled, values[values.length - 1]];
}

export function EvalBench() {
  const result = useMemo(() => runEvalBench(7), []);
  const [threshold, setThreshold] = useState(0.5);
  const [reviewCost, setReviewCost] = useState(8);
  const [fraudLoss, setFraudLoss] = useState(420);
  const [baseline, setBaseline] = useState({ threshold: 0.5, reviewCost: 8, fraudLoss: 420 });
  const [technical, setTechnical] = useState(false);
  const economics = useMemo(() => thresholdEconomics(result.scores, result.dataset.y, { reviewCost, fraudLoss }), [result, reviewCost, fraudLoss]);
  const matrix = useMemo(() => confusionAt(result.scores, result.dataset.y, threshold), [result, threshold]);
  const baselineMatrix = useMemo(() => confusionAt(result.scores, result.dataset.y, baseline.threshold), [result, baseline.threshold]);
  const reviews = (matrix.tp + matrix.fp) * reviewCost;
  const missed = matrix.fn * fraudLoss;
  const total = reviews + missed;
  const baselineTotal = (baselineMatrix.tp + baselineMatrix.fp) * baseline.reviewCost + baselineMatrix.fn * baseline.fraudLoss;
  const precision = matrix.tp + matrix.fp ? matrix.tp / (matrix.tp + matrix.fp) : null;
  const recall = matrix.tp + matrix.fn ? matrix.tp / (matrix.tp + matrix.fn) : null;
  const falsePositiveRate = matrix.fp + matrix.tn ? matrix.fp / (matrix.fp + matrix.tn) : 0;
  const fraudCount = result.dataset.y.filter((value) => value === 1).length;
  const difference = total - economics.optimal.total;
  const roc = useMemo(() => sample(result.roc.points).map((point) => ({ x: point.fpr, y: point.tpr })), [result]);
  const pr = useMemo(() => sample(result.pr.points).map((point) => ({ x: point.recall, y: point.precision })), [result]);
  const calibration = useMemo(() => result.cal.bins.filter((bin) => bin.n > 0).map((bin) => ({ x: bin.meanP, y: bin.fracPos, n: bin.n })), [result]);
  const costData = economics.curve.map((point) => ({ threshold: point.t, total: point.total, reviews: point.reviews, missed: point.missed }));
  const reset = () => { setThreshold(0.5); setReviewCost(8); setFraudLoss(420); };
  const exportActions: ExportAction[] = [
    { id: "result", label: "Current decision and method (JSON)", onSelect: () => {
      downloadJson("evaluation-threshold-decision", { version: 1, mode: "LIVE_BROWSER_COMPUTATION", data: "seeded synthetic corpus; training and evaluation use the same rows (in-sample)", seed: 7, threshold, reviewCost, fraudLoss, matrix, reviews, missed, total, optimal: economics.optimal, baseline, baselineTotal, auc: result.roc.auc, prAuc: result.pr.auprc, brier: result.cal.brier, formula: "flags * reviewCost + missed fraud * fraudLoss" });
      toast("Current decision and method exported");
    } },
    { id: "curve", label: "Complete threshold economics (CSV)", onSelect: () => {
      downloadCsv("evaluation-threshold-curve", ["Threshold", "Review cost USD", "Missed fraud cost USD", "Total USD"], economics.curve.map((point) => [point.t, point.reviews, point.missed, point.total]));
      toast("Complete threshold economics exported");
    } },
    { id: "scores", label: "Synthetic scores and truth (CSV)", onSelect: () => {
      downloadCsv("evaluation-synthetic-scores", ["Row", "Model score", "Synthetic truth"], result.scores.map((score, index) => [index + 1, score, result.dataset.y[index]]));
      toast("Synthetic model scores exported");
    } },
  ];

  return <InstrumentShell title="Model Evaluation and Threshold Economics" eyebrow="LB-03 · Live build"
    description="Choose a decision threshold and see which mistakes it trades for review cost. The model is trained in this browser on disclosed synthetic data."
    breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Live Builds", href: "/#collections" }, { label: "Threshold Economics" }]}
    provenance={<Provenance mode="LIVE" input={`Seeded synthetic corpus · ${result.dataset.y.length.toLocaleString()} transactions · seed 7`} method={`Logistic model · ${result.model.losses.length} training epochs · deterministic evaluation math`} note="Live means computation in your browser. This is synthetic evaluation, not observed production fraud performance." />}
    decision={<DecisionSummary title={Math.abs(difference) < 0.005 ? "The selected threshold matches the lowest-cost evaluated point" : difference < 0 ? `${money(-difference)} below the lowest-cost sampled point` : `${money(difference)} above the lowest-cost evaluated point`}
      explanation={`At threshold ${threshold.toFixed(3)}, ${matrix.tp + matrix.fp} flags require review and ${matrix.fn} synthetic fraud cases are missed. Lower cost is only one part of an operating policy.`}
      metrics={[{ label: "Selected operating cost", value: money(total) }, { label: "Lowest evaluated cost", value: money(economics.optimal.total), detail: `Threshold ${economics.optimal.t.toFixed(3)}` }, { label: "Review / missed-loss split", value: `${money(reviews)} / ${money(missed)}` }]}
      nextAction={<button type="button" className={button} onClick={() => setThreshold(economics.optimal.t)}>Inspect lowest-cost threshold</button>} />}
    actions={<><ExportMenu actions={exportActions} /><button type="button" className={button} onClick={reset}>Reset assumptions</button></>}>
    <Panel>
      <SectionHeader title="Operate the decision" description="Counts and costs update together. The markers on the curves use this same threshold." />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-slatey-400">Decision threshold
          <input className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 text-ink" type="number" min={0} max={1} step={0.001} value={threshold} onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) setThreshold(Math.max(0, Math.min(1, value))); }} />
        </label>
        <label className="text-sm text-slatey-400">Review cost per flag (USD)
          <input className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 text-ink" type="number" min={0} step={1} value={reviewCost} onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) setReviewCost(Math.max(0, value)); }} />
        </label>
        <label className="text-sm text-slatey-400">Loss per missed fraud (USD)
          <input className="mt-1 min-h-11 w-full rounded-lg border border-line px-3 text-ink" type="number" min={0} step={1} value={fraudLoss} onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) setFraudLoss(Math.max(0, value)); }} />
        </label>
      </div>
      <input className="my-5 w-full accent-primary" type="range" min={0} max={1} step={0.001} value={threshold} aria-label="Decision threshold" aria-valuetext={threshold.toFixed(3)} onChange={(event) => setThreshold(Number(event.target.value))} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Fraud caught (TP)", matrix.tp], ["False alarms (FP)", matrix.fp], ["Fraud missed (FN)", matrix.fn], ["Clean passed (TN)", matrix.tn]].map(([name, value]) => <div key={name} className="rounded-xl border border-line bg-slate-50 p-4"><p className="text-sm text-slatey-400">{name}</p><p className="mt-2 text-2xl font-semibold text-ink">{value}</p></div>)}
      </div>
      <EvidenceTable caption="Selected threshold: exact decision values" headers={["Measure", "Value", "Meaning"]} rows={[
        ["Precision", precision === null ? "Not defined" : `${(precision * 100).toFixed(2)}%`, precision === null ? "No transactions are flagged" : "Fraud caught / all flags"],
        ["Recall", recall === null ? "Not defined" : `${(recall * 100).toFixed(2)}%`, "Fraud caught / all synthetic fraud"],
        ["Review cost", money(reviews), `${matrix.tp + matrix.fp} flags × ${money(reviewCost)}`],
        ["Missed-fraud loss", money(missed), `${matrix.fn} misses × ${money(fraudLoss)}`],
        ["Total operating cost", money(total), "Review cost + missed-fraud loss"],
      ]} />
    </Panel>

    <ChangeReceipt title="Baseline to current decision" onPin={() => setBaseline({ threshold, reviewCost, fraudLoss })}>
      <p>Pinned threshold {baseline.threshold.toFixed(3)} with {money(baseline.reviewCost)} per review and {money(baseline.fraudLoss)} per miss: {money(baselineTotal)}.</p>
      <p>Current cost change: {signed(total - baselineTotal, 2)} USD; flags {signed(matrix.tp + matrix.fp - baselineMatrix.tp - baselineMatrix.fp)}; missed cases {signed(matrix.fn - baselineMatrix.fn)}.</p>
      <p className="mt-1">The comparison includes any changed cost assumptions. It is not a claim that the threshold alone caused the cost difference.</p>
    </ChangeReceipt>

    <Panel>
      <SectionHeader title="What the threshold costs" description="Solid ink: total. Dashed blue: review cost. Dotted red: missed losses. The gold line is selected; green marks the lowest evaluated cost." />
      <div className="h-72 min-w-0" role="img" aria-label={`Selected cost ${money(total)} at threshold ${threshold.toFixed(3)}; lowest evaluated cost ${money(economics.optimal.total)} at ${economics.optimal.t.toFixed(3)}. Exact curve values can be exported.`}>
        <ResponsiveContainer>
          <LineChart data={costData} margin={{ top: 12, right: 16, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="threshold" type="number" domain={[0, 1]} tick={label} />
            <YAxis tick={label} width={68} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
            <ChartTip formatter={(value: number) => money(value)} labelFormatter={(value) => `Threshold ${Number(value).toFixed(3)}`} />
            <Line dataKey="total" name="Total" dot={false} stroke={INK} strokeWidth={2} isAnimationActive={false} />
            <Line dataKey="reviews" name="Reviews" dot={false} stroke={BLUE} strokeDasharray="6 3" isAnimationActive={false} />
            <Line dataKey="missed" name="Missed losses" dot={false} stroke={ROSE} strokeDasharray="2 3" isAnimationActive={false} />
            <ReferenceDot x={economics.optimal.t} y={economics.optimal.total} r={5} fill={GREEN} stroke="white" />
            <ReferenceDot x={threshold} y={total} r={5} fill={AMBER} stroke="white" />
            <ReferenceLine x={threshold} stroke={AMBER} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details><summary className="cursor-pointer py-2 text-sm font-semibold">Read threshold curve values</summary><EvidenceTable caption="Evaluated thresholds and operating cost" headers={["Threshold", "Review cost", "Missed loss", "Total"]} rows={economics.curve.map((point) => [point.t.toFixed(3), money(point.reviews), money(point.missed), money(point.total)])} /></details>
    </Panel>

    <section className="mt-5 rounded-xl border border-line bg-white p-4">
      <button type="button" className={button} aria-expanded={technical} aria-controls="eval-technical" onClick={() => setTechnical((value) => !value)}>{technical ? "Hide" : "Inspect"} model validation and method</button>
      <p className="mt-2 text-sm text-slatey-400">Ranking quality, precision/recall and calibration explain the model. The threshold decision remains above.</p>
      {technical && <div id="eval-technical" className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="ROC AUC" value={result.roc.auc.toFixed(3)} interpretation="Ranking across thresholds" />
          <KpiCard label="PR AUC" value={result.pr.auprc.toFixed(3)} interpretation={`Synthetic base rate ${(result.dataset.fraudRate * 100).toFixed(0)}%`} />
          <KpiCard label="Brier score" value={result.cal.brier.toFixed(3)} interpretation="Probability error; lower is better" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Curve title="ROC" description={`At the selected threshold: false positive rate ${(falsePositiveRate * 100).toFixed(2)}%; recall ${recall === null ? "undefined" : `${(recall * 100).toFixed(2)}%`}.`} data={roc} color={BLUE} selected={recall === null ? undefined : { x: falsePositiveRate, y: recall }} xLabel="False positive rate" yLabel="Recall" />
          <Curve title="Precision and recall" description={`At the selected threshold: precision ${precision === null ? "undefined (no flags)" : `${(precision * 100).toFixed(2)}%`}.`} data={pr} color={GREEN} selected={precision === null || recall === null ? undefined : { x: recall, y: precision }} xLabel="Recall" yLabel="Precision" />
          <Curve title="Calibration" description="Observed synthetic fraud frequency versus mean predicted probability in each occupied bin." data={calibration} color={AMBER} xLabel="Mean probability" yLabel="Observed frequency" />
        </div>
        <EvidenceTable caption="Calibration bins" headers={["Mean predicted probability", "Observed fraud frequency", "Transactions"]} rows={calibration.map((bin) => [bin.x.toFixed(4), bin.y.toFixed(4), bin.n])} />
        <div className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slatey-400">
          <p>{result.dataset.y.length} seeded synthetic transactions, including {fraudCount} fraud cases. Logistic score = σ(w·x + b); full-batch gradient descent with L2 = 0.001. The corpus includes two pure-noise features.</p>
          <p className="mt-2">Training and evaluation use the same synthetic corpus; these are in-sample metrics, not a held-out validation result. ROC sweeps distinct scores; AUC uses a trapezoid sum. Total cost(t) = flags(t) × review cost + misses(t) × fraud loss. The displayed minimum uses 99 thresholds from 0.01 to 0.99; a manually selected threshold can fall between these samples.</p>
          <p className="mt-2">Export synthetic scores, truth and the full economics curve to inspect the calculation independently. No customer records or hosted model endpoint are used.</p>
        </div>
      </div>}
    </section>
    <ToastHost />
  </InstrumentShell>;
}

function Curve({ title, description, data, color, selected, xLabel, yLabel }: { title: string; description: string; data: { x: number; y: number }[]; color: string; selected?: { x: number; y: number }; xLabel: string; yLabel: string }) {
  return <Panel><SectionHeader title={title} description={description} />
    <p className="mb-2 text-xs text-slatey-400">Horizontal: {xLabel}. Vertical: {yLabel}.{title !== "Calibration" && " Gold marker: selected threshold where defined."}</p>
    <div className="h-60 min-w-0" role="img" aria-label={description}>
      <ResponsiveContainer><LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="x" type="number" domain={[0, 1]} tick={label} /><YAxis type="number" domain={[0, 1]} tick={label} />
        <ChartTip formatter={(value: number) => value.toFixed(4)} /><Line dataKey="y" dot={false} stroke={color} strokeWidth={2} isAnimationActive={false} />
        {selected && <ReferenceDot x={selected.x} y={selected.y} r={5} fill={AMBER} stroke="white" />}
      </LineChart></ResponsiveContainer>
    </div>
    <details><summary className="cursor-pointer py-2 text-sm font-semibold">Read plotted values</summary><EvidenceTable caption={`${title} plotted values (display sample)`} headers={[xLabel, yLabel]} rows={data.map((point) => [point.x.toFixed(4), point.y.toFixed(4)])} /></details>
  </Panel>;
}
