"use client";

// Phase 6 — Training / fine-tuning / generalization readiness UI. Decision memo,
// dataset readiness, train/val/test split, overfitting & generalization, and the
// contract handoff to Operate + Govern. No real training is performed. Persists
// rag.trainingContract in live mode.

import { useEffect, useMemo, useState } from "react";
import {
  useProgramSource, buildBuildOutputContract,
  deriveFineTuneMemo, deriveDatasetReadiness, deriveGeneralizationAssessment,
  buildTrainingReadinessContract, GENERALIZATION_SCENARIOS, deriveLearningCurve,
} from "@labs/program-core";
import { Panel, SectionHeader, Badge, InsightCard, cn } from "@labs/design-system";
import { GitBranch, Database, Split, LineChart, ClipboardCheck, Info, Scale } from "lucide-react";
import {
  LineChart as RLineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

// Dataset-size steps for the learning-curve slider (log-ish scale).
const CURVE_SIZES = [300, 800, 2400, 8000, 24000, 80000];

const stTone = (s: string): "emerald" | "amber" | "rose" | "slate" =>
  s === "ready" ? "emerald" : s === "ready-with-cautions" || s === "partial" ? "amber" : s === "not-required" || s === "not-ready" || s === "missing" ? (s === "not-required" ? "slate" : "rose") : "slate";
const riskTone = (r: string): "emerald" | "amber" | "rose" => (r === "low" ? "emerald" : r === "medium" ? "amber" : "rose");

const APPROACHES = [
  { id: "prompting", label: "Prompting", best: "Simple, instruction-following, low risk", risk: "Brittle prompts, weak grounding" },
  { id: "rag", label: "RAG", best: "Current documents, citations, changing knowledge", risk: "Stale sources, weak retrieval" },
  { id: "fine-tuning", label: "Fine-tuning", best: "Consistent behavior/format, stable task, labeled data", risk: "Overfitting, leakage, harder rollback" },
  { id: "traditional-ml", label: "Traditional ML", best: "Structured prediction/classification with labels", risk: "Bias, imbalance, poor generalization" },
  { id: "hybrid", label: "Hybrid", best: "Workflow needs evidence + responses + actions", risk: "Complex debugging, integration risk" },
];

export function TrainingReadiness() {
  const { state, isDemo, hydrated, update, src } = useProgramSource();

  const memo = useMemo(() => deriveFineTuneMemo(src), [src]);
  const ds = useMemo(() => deriveDatasetReadiness(src), [src]);
  const gen = useMemo(() => deriveGeneralizationAssessment(src), [src]);
  const contract = useMemo(() => buildTrainingReadinessContract(src), [src]);

  // Phase D — interactive learning curve. Slider picks a dataset size; the
  // deterministic engine recomputes train/validation divergence live.
  const [sizeIdx, setSizeIdx] = useState(2); // default 2,400 examples
  const curve = useMemo(() => deriveLearningCurve(src, CURVE_SIZES[sizeIdx]), [src, sizeIdx]);

  const sig = JSON.stringify({ tags: state.initiative?.meta?.capabilityTags, pat: state.initiative?.meta?.primaryAiPattern, name: state.initiative?.name });
  useEffect(() => {
    if (!hydrated || isDemo) return;
    update((d) => { d.rag = { ...(d.rag ?? {}), trainingContract: buildTrainingReadinessContract(d) }; d.rag.contract = buildBuildOutputContract(d); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isDemo]);

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className={cn("rounded-xl border p-4", ds.required ? "border-amber-300 bg-amber-50/40" : "border-line bg-slate-50/60")}>
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-ink">Recommended approach: {memo.headline}</span>
          <Badge tone={ds.required ? "amber" : "emerald"}>{memo.recommendedApproach}</Badge>
        </div>
        <p className="mt-1 text-sm text-slatey-400">{ds.required
          ? "This initiative is a fit for a trained / fine-tuned model, so training-data readiness and generalization risk matter."
          : "Training dataset not required — this use case is better served by RAG, evaluation datasets, and monitoring, because answers must stay grounded in current source documents."}</p>
      </div>

      {/* Decision memo */}
      <Panel>
        <SectionHeader eyebrow="Decision memo" title="Fine-tune vs RAG vs prompt" icon={GitBranch}
          description="Enterprise teams should not fine-tune by default. The right approach depends on the workflow, data, freshness, governance burden, and evaluation evidence." />
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="stat-label mb-1">Why this approach</p>
            <ul className="space-y-1 text-[13px] text-slatey-300">{memo.rationale.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-emerald-600">●</span>{r}</li>)}</ul>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><p className="stat-label">Cost risk</p><Badge tone={riskTone(memo.costRisk)}>{memo.costRisk}</Badge></div>
              <div><p className="stat-label">Delivery complexity</p><Badge tone={riskTone(memo.deliveryComplexity)}>{memo.deliveryComplexity}</Badge></div>
            </div>
          </div>
          <div className="space-y-2 text-[12px]">
            {memo.whyNotPromptOnly.length > 0 && <WhyNot label="Why not prompt-only" items={memo.whyNotPromptOnly} />}
            {memo.whyNotRagOnly.length > 0 && <WhyNot label="Why not RAG-only" items={memo.whyNotRagOnly} />}
            {memo.whyNotFineTune.length > 0 && <WhyNot label="Why not fine-tune" items={memo.whyNotFineTune} />}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500"><th className="py-2 pr-3 font-semibold">Approach</th><th className="py-2 pr-3 font-semibold">Best when</th><th className="py-2 font-semibold">Key risks</th></tr></thead>
            <tbody>{APPROACHES.map((a) => (
              <tr key={a.id} className={cn("border-b border-line/60", a.id === memo.recommendedApproach && "bg-primary/[0.05]")}>
                <td className="py-2 pr-3 font-medium text-ink">{a.label}{a.id === memo.recommendedApproach && <Badge tone="blue" className="ml-1.5">recommended</Badge>}</td>
                <td className="py-2 pr-3 text-slatey-400">{a.best}</td>
                <td className="py-2 text-slatey-400">{a.risk}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      {/* Dataset readiness */}
      <Panel>
        <SectionHeader eyebrow="Training dataset readiness" title={ds.required ? "Is the labeled data ready to train?" : "Training dataset not required"} icon={Database}
          action={<Badge tone={stTone(ds.status)}>{ds.status}</Badge>} />
        {ds.required ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Labeled examples" value={ds.labeledExampleCount.toLocaleString()} />
              <Stat label="Label quality" value={`${ds.labelQualityScore}/100`} />
              <Stat label="Label consistency" value={`${ds.labelConsistencyScore}/100`} />
              <Stat label="Class balance" value={`${ds.classBalanceScore}/100`} />
              <Stat label="Edge-case coverage" value={`${ds.edgeCaseCoverageScore}/100`} />
              <Stat label="Representative coverage" value={`${ds.representativeCoverage}/100`} />
              <Stat label="Leakage risk" value={<Badge tone={riskTone(ds.leakageRisk)}>{ds.leakageRisk}</Badge>} />
              <Stat label="Overfitting risk" value={<Badge tone={riskTone(ds.overfittingRisk)}>{ds.overfittingRisk}</Badge>} />
            </div>
            {ds.cautions.length > 0 && <div className="mt-3"><p className="stat-label mb-1 text-amber-700">Cautions</p><ul className="space-y-0.5 text-[12px] text-slatey-400">{ds.cautions.map((c, i) => <li key={i}>· {c}</li>)}</ul></div>}
          </>
        ) : (
          <p className="text-sm text-slatey-400">{ds.recommendedAction}</p>
        )}
        <p className="mt-3 text-xs text-slatey-400"><b className="text-slatey-300">Recommended:</b> {ds.recommendedAction}</p>
      </Panel>

      {/* Split */}
      <Panel>
        <SectionHeader eyebrow="Data hygiene" title="Train / validation / test split" icon={Split}
          description="Train teaches the model, validation tunes decisions, test estimates unseen performance. If examples leak across sets, the model looks strong in testing but fails in the real world." />
        {ds.required ? (
          <>
            <div className="flex h-8 w-full overflow-hidden rounded-lg border border-line text-[11px] font-semibold text-white">
              <div className="flex items-center justify-center bg-primary" style={{ width: `${ds.trainPercent}%` }}>Train {ds.trainPercent}%</div>
              <div className="flex items-center justify-center bg-amber-500" style={{ width: `${ds.validationPercent}%` }}>Val {ds.validationPercent}%</div>
              <div className="flex items-center justify-center bg-emerald-600" style={{ width: `${ds.testPercent}%` }}>Test {ds.testPercent}%</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={ds.trainValidationTestSplit === "complete" ? "emerald" : "amber"}>Split: {ds.trainValidationTestSplit}</Badge>
              {!ds.holdoutSetAvailable && <Badge tone="rose">Missing holdout set</Badge>}
              {ds.leakageRisk !== "low" && <Badge tone="amber">Possible leakage</Badge>}
              {ds.classBalanceScore < 70 && <Badge tone="amber">Weak minority-class coverage</Badge>}
              {ds.edgeCaseCoverageScore < 65 && <Badge tone="amber">Too few edge cases</Badge>}
            </div>
          </>
        ) : <p className="text-sm text-slatey-400">No split required — RAG/eval datasets are used instead of a supervised training split.</p>}
      </Panel>

      {/* Overfitting & generalization */}
      <Panel className="overflow-x-auto">
        <SectionHeader eyebrow="Model quality" title="Overfitting & generalization" icon={LineChart}
          description="Overfitting = strong on seen examples, weak on new cases. Generalization = performing well on unseen examples. Detect overfitting before release." />

        {/* Phase D — the divergence curve, made interactive */}
        <div className="mb-5 rounded-lg border border-line bg-slate-50/50 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Train vs validation accuracy — where memorizing begins</p>
            <Badge tone={curve.overfittingRisk === "low" ? "emerald" : curve.overfittingRisk === "medium" ? "amber" : "rose"}>
              {curve.overfittingRisk} overfitting risk · {curve.finalGap}pt gap
            </Badge>
          </div>
          <label className="mb-3 block max-w-sm">
            <span className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slatey-300">Labeled dataset size</span>
              <span className="font-mono font-semibold text-ink">{CURVE_SIZES[sizeIdx].toLocaleString()} examples</span>
            </span>
            <input type="range" min={0} max={CURVE_SIZES.length - 1} step={1} value={sizeIdx}
              onChange={(e) => setSizeIdx(Number(e.target.value))} className="w-full accent-primary"
              aria-label="Labeled dataset size" />
          </label>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RLineChart data={curve.points} margin={{ top: 6, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" tick={{ fontSize: 11 }} label={{ value: "epoch", position: "insideBottomRight", offset: -2, fontSize: 10 }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} unit="%" />
                <RTooltip formatter={(v: number | string) => [`${v}%`]} labelFormatter={(l) => `Epoch ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {curve.divergenceEpoch && (
                  <ReferenceLine x={curve.divergenceEpoch} stroke="#f59e0b" strokeDasharray="4 3"
                    label={{ value: "divergence", fontSize: 10, fill: "#b45309", position: "top" }} />
                )}
                <Line type="monotone" dataKey="train" name="Training" stroke="#1f6fc4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="validation" name="Validation" stroke="#e11d48" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slatey-400">{curve.note}</p>
          <p className="mt-1 text-[11px] italic text-slatey-500">Simulated curves — no model is trained. The shape is deterministic and driven by dataset size.</p>
        </div>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500"><th className="py-2 pr-3 font-semibold">Scenario</th><th className="py-2 pr-3 font-semibold text-right">Train</th><th className="py-2 pr-3 font-semibold text-right">Validation</th><th className="py-2 pr-3 font-semibold text-right">Test</th><th className="py-2 font-semibold">Risk</th></tr></thead>
          <tbody>{GENERALIZATION_SCENARIOS.map((s) => (
            <tr key={s.name} className="border-b border-line/60">
              <td className="py-2 pr-3 font-medium text-ink">{s.name}</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{s.train}%</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{s.validation}%</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{s.test}%</td>
              <td className="py-2"><Badge tone={riskTone(s.risk)}>{s.risk}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
        {ds.required && (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="stat-label mb-1">Risk triggers (this initiative)</p><ul className="space-y-0.5 text-[12px] text-slatey-400">{gen.riskTriggers.map((t, i) => <li key={i}>· {t}</li>)}</ul></div>
            <div><p className="stat-label mb-1">Recommended controls</p><ul className="space-y-0.5 text-[12px] text-slatey-400">{gen.recommendedControls.map((t, i) => <li key={i}>· {t}</li>)}</ul></div>
          </div>
        )}
      </Panel>

      {/* Contract summary + handoff */}
      <Panel>
        <SectionHeader eyebrow="Training readiness contract" title="What flows to Operate & Govern" icon={ClipboardCheck} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Enabled" value={contract.enabled ? "Yes" : "No (RAG preferred)"} />
          <Stat label="Approach" value={contract.decisionMemo.recommendedApproach} />
          <Stat label="Generalization" value={contract.enabled ? `${contract.generalizationAssessment.generalizationScore}/100` : "n/a"} />
          <Stat label="Overfitting risk" value={<Badge tone={riskTone(contract.generalizationAssessment.overfittingRisk)}>{contract.generalizationAssessment.overfittingRisk}</Badge>} />
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div><p className="stat-label mb-1">→ Operate (monitoring)</p><ul className="space-y-0.5 text-[12px] text-slatey-400">{contract.opsMonitoringRequirements.map((r, i) => <li key={i}>· {r}</li>)}</ul></div>
          <div><p className="stat-label mb-1">→ Govern (controls)</p><ul className="space-y-0.5 text-[12px] text-slatey-400">{contract.governanceControls.map((r, i) => <li key={i}>· {r}</li>)}</ul></div>
        </div>
      </Panel>

      {/* Demonstrates + simulation boundary */}
      <Panel>
        <SectionHeader eyebrow="For reviewers" title="What this training layer demonstrates" icon={Info} />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-300">
          This layer demonstrates that enterprise AI teams should not fine-tune by default. The right approach depends on the workflow,
          data, freshness, governance burden, and evaluation evidence. Fine-tuning requires high-quality labeled data, clean splits,
          holdout evaluation, overfitting checks, and operational monitoring.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard tone="info" title="Fine-tune vs RAG decisioning">A memo picks the right approach from the initiative, not a default.</InsightCard>
          <InsightCard tone="info" title="Labeled-data readiness">Quality, consistency, balance, and coverage are checked before training.</InsightCard>
          <InsightCard tone="success" title="Train/validation/test split">Leakage and holdout gaps are surfaced explicitly.</InsightCard>
          <InsightCard tone="success" title="Overfitting & generalization">Train-vs-test gaps and risk triggers are made visible.</InsightCard>
          <InsightCard tone="warn" title="Evaluation & monitoring">Holdout eval + drift + class-level monitoring requirements.</InsightCard>
          <InsightCard tone="warn" title="Governance handoff">Training risk becomes controls and findings in Govern.</InsightCard>
        </div>
        <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Training simulation boundary</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slatey-400">
            This portfolio demo does not train or fine-tune a model. It uses deterministic readiness checks and simulated learning-curve
            examples to show the decisions enterprise teams make before training. In production these contracts could connect to labeling
            platforms, model registries, eval stores, MLflow, W&amp;B, SageMaker, Vertex AI, or Azure ML. No real training is performed here.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function WhyNot({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{label}</p>
      <ul className="mt-0.5 space-y-0.5 text-slatey-400">{items.map((x, i) => <li key={i}>· {x}</li>)}</ul>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-white p-3"><p className="stat-label">{label}</p><p className="text-lg font-semibold text-ink">{value}</p></div>;
}
