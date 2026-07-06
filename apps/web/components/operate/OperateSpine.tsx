"use client";

// Phase 2, Operate / AI Ops / MLOps / RAGOps spine. Deterministic
// production readiness panels over the Phase 1 lifecycle contracts. Split into a
// top Release Readiness summary and a bottom evidence block so the exec headline
// sits above the existing operating-envelope machinery. Live mode reads the
// threaded initiative; Demo mode reads the curated demoState.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useProgramSource,
  computeReleaseReadiness, deriveVersionLineage, deriveMonitoringCoverage,
  deriveEvalRegression, deriveIncidents, deriveOpsEvidenceEnrichment, deriveGateFixes,
  STAGE_MAP,
  type CheckStatus,
} from "@labs/program-core";
import { Panel, SectionHeader, Badge, KpiCard, InsightCard, cn } from "@labs/design-system";
import {
  Gauge, GitBranch, Activity, LineChart, AlertTriangle, ShieldCheck, ClipboardCheck, RotateCcw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from "recharts";

const tone = (s: CheckStatus): "emerald" | "amber" | "rose" => (s === "pass" ? "emerald" : s === "warn" ? "amber" : "rose");
const dot = (s: CheckStatus) => (s === "pass" ? "text-emerald-600" : s === "warn" ? "text-amber-600" : "text-rose-600");
// Glyph carries the status even without color (accessibility: not color-only).
const glyph = (s: CheckStatus) => (s === "pass" ? "✓" : s === "warn" ? "!" : "✕");
const recTone = (r?: string) => (r?.startsWith("Ready for") ? "emerald" : r?.startsWith("Ready with") ? "amber" : "rose");

function useSrc() {
  return useProgramSource().src;
}

// ---- TOP: Release readiness (+ writes enrichment back to state) -------------
export function ReleaseReadinessPanel() {
  const { state, isDemo, hydrated, update, src } = useProgramSource();
  const rr = useMemo(() => computeReleaseReadiness(src), [src]);

  // Phase E, what would make each failing check pass. Click to expand.
  const fixes = useMemo(() => deriveGateFixes(src), [src]);
  const fixByCheck = useMemo(() => Object.fromEntries(fixes.map((f) => [f.check, f])), [fixes]);
  const [openFix, setOpenFix] = useState<string | null>(null);

  const sig = JSON.stringify({
    ev: !!state.deploy?.evidence, p95: state.deploy?.evidence?.latencyP95, cost: state.deploy?.evidence?.costPerQuery,
    drift: state.deploy?.evidence?.driftRisk, q: state.rag?.contract?.qualityScore, cite: state.rag?.contract?.citationAccuracy,
    gates: state.rag?.contract?.failedGates?.length, tier: state.initiative?.meta?.governanceTier, blocked: state.data?.handoff?.blockedSources?.length,
  });
  useEffect(() => {
    if (!hydrated || isDemo) return;
    update((d) => { if (d.deploy?.evidence) d.deploy.evidence = { ...d.deploy.evidence, ...deriveOpsEvidenceEnrichment(d) }; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isDemo]);

  return (
    <Panel>
      <SectionHeader eyebrow="Release readiness" title="Is this system ready for pilot or production?" icon={ClipboardCheck}
        description="A deterministic gate over the lifecycle contracts, Strategy, Data, Build, and Ops, rolled into one recommendation." />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-slate-50/60 p-4 text-center">
          <p className="stat-label">Release readiness</p>
          <p className="text-4xl font-semibold text-ink">{rr.score}<span className="text-lg text-slatey-400">/100</span></p>
          <Badge tone={recTone(rr.recommendation) as "emerald" | "amber" | "rose"}>{rr.recommendation}</Badge>
          {rr.blockers.length > 0 && (
            <div className="mt-3 w-full text-left">
              <p className="stat-label">Primary blockers</p>
              <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-slatey-400">
                {rr.blockers.map((b, i) => <li key={i} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />{b}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {rr.checks.map((k) => {
            const fix = k.status !== "pass" ? fixByCheck[k.label] : undefined;
            const open = openFix === k.label;
            return (
              <div key={k.label} className={cn("rounded-lg border bg-white", open ? "border-primary/40" : "border-line")}>
                <button
                  type="button"
                  onClick={fix ? () => setOpenFix(open ? null : k.label) : undefined}
                  disabled={!fix}
                  className={cn("flex w-full items-start gap-2 p-2.5 text-left", fix && "cursor-pointer hover:bg-slate-50/70")}
                  aria-expanded={fix ? open : undefined}
                >
                  <span className={cn("mt-0.5 w-3 text-center text-xs font-bold", dot(k.status))} aria-label={k.status}>{glyph(k.status)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{k.label}</p>
                    <p className="truncate text-[11px] text-slatey-400">{k.detail}</p>
                  </div>
                  {fix && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary">{open ? "close" : "how to fix"}</span>}
                </button>
                {fix && open && (
                  <div className="border-t border-line/70 px-2.5 py-2 text-[11px] leading-relaxed">
                    <p><span className="font-semibold text-slatey-500">Now: </span><span className="text-slatey-400">{fix.current}</span>
                      <span className="ml-2 font-semibold text-slatey-500">Passing: </span><span className="text-emerald-700">{fix.target}</span></p>
                    <p className="mt-1 text-slatey-400">{fix.action}</p>
                    <Link href={STAGE_MAP[fix.stage].href} className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-dark">
                      Fix in {STAGE_MAP[fix.stage].label} →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ---- BOTTOM: lineage, monitoring, regression, incidents, evidence, proof -----
export function OperateEvidencePanels() {
  const { state, isDemo, src } = useProgramSource();
  const lineage = useMemo(() => deriveVersionLineage(src), [src]);
  const mon = useMemo(() => deriveMonitoringCoverage(src), [src]);
  const reg = useMemo(() => deriveEvalRegression(src), [src]);
  const inc = useMemo(() => deriveIncidents(src), [src]);
  // Live: the real persisted evidence. Demo: derive a display-only evidence view
  // from the curated demoState so the summary isn't empty in the sandbox.
  const ev = isDemo
    ? { ...deriveOpsEvidenceEnrichment(src), driftRisk: src.deploy?.driftRisk, sloStatus: src.deploy?.status, monitoringCoverage: deriveMonitoringCoverage(src).coverageScore }
    : state.deploy?.evidence;

  return (
    <div className="space-y-6">
      {/* Version & lineage */}
      <Panel>
        <SectionHeader eyebrow="MLOps / LLMOps" title="Version & lineage" icon={GitBranch}
          description="Which model, prompt, index, corpus, eval set, policy, and config produced a result, the trail incidents and audits depend on." />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
              <th className="py-2 pr-4 font-semibold">Asset</th><th className="py-2 pr-4 font-semibold">Version</th><th className="py-2 pr-4 font-semibold">Source</th><th className="py-2 font-semibold">Why it matters</th>
            </tr></thead>
            <tbody>
              {lineage.map((r) => (
                <tr key={r.asset} className="border-b border-line/60">
                  <td className="py-2 pr-4 font-semibold text-ink">{r.asset}</td>
                  <td className="py-2 pr-4 font-mono text-[12px] text-slatey-300">{r.version}</td>
                  <td className="py-2 pr-4"><Badge tone="slate">{r.source}</Badge></td>
                  <td className="py-2 text-[12px] text-slatey-400">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Monitoring coverage */}
      <Panel>
        <SectionHeader eyebrow="RAGOps" title="Monitoring coverage" icon={Activity}
          description="What is watched, what is a blind spot, and who acts when a signal breaches." action={<Badge tone={mon.coverageScore >= 80 ? "emerald" : mon.coverageScore >= 60 ? "amber" : "rose"}>{mon.coverageScore}% covered</Badge>} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
              <th className="py-2 pr-3 font-semibold">Signal</th><th className="py-2 pr-3 font-semibold">Status</th><th className="py-2 pr-3 font-semibold">Current</th><th className="py-2 pr-3 font-semibold">Threshold</th><th className="py-2 pr-3 font-semibold">Owner</th><th className="py-2 font-semibold">Action</th>
            </tr></thead>
            <tbody>
              {mon.signals.map((s) => (
                <tr key={s.signal} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-medium text-ink">{s.signal}</td>
                  <td className="py-2 pr-3"><Badge tone={s.status === "monitored" ? "emerald" : "rose"}>{s.status === "monitored" ? "Monitored" : "Gap"}</Badge></td>
                  <td className="py-2 pr-3 text-slatey-300">{s.current}</td>
                  <td className="py-2 pr-3 text-slatey-400">{s.threshold}</td>
                  <td className="py-2 pr-3 text-slatey-400">{s.owner}</td>
                  <td className="py-2 text-[12px] text-slatey-400">{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mon.gaps.length > 0 && <p className="mt-3 text-xs text-slatey-400"><b className="text-slatey-300">Recommendation:</b> instrument {mon.gaps.join(", ")} before production release.</p>}
      </Panel>

      {/* Evaluation regression */}
      <Panel>
        <SectionHeader eyebrow="LLMOps" title="Evaluation regression" icon={LineChart}
          description="Whether a new prompt, model, index, or data source quietly worsened quality since the last eval." action={<Badge tone={reg.status === "No regression" ? "emerald" : reg.status === "Watch" ? "amber" : "rose"}>{reg.status}</Badge>} />

        {/* Phase D, prior vs current, as a judgment you can see */}
        <div className="mb-4 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reg.rows} margin={{ top: 6, right: 12, bottom: 0, left: -18 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 10 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <RTooltip formatter={(v: number | string, name: string) => [`${v}%`, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="previous" name="Prior run (modeled)" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="current" name="Current run" radius={[3, 3, 0, 0]}>
                {reg.rows.map((r) => (
                  <Cell key={r.metric} fill={r.status === "pass" ? "#1f6fc4" : r.status === "warn" ? "#f59e0b" : "#e11d48"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
              <th className="py-2 pr-4 font-semibold">Metric</th><th className="py-2 pr-4 font-semibold text-right">Previous</th><th className="py-2 pr-4 font-semibold text-right">Current</th><th className="py-2 pr-4 font-semibold text-right">Delta</th><th className="py-2 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {reg.rows.map((r) => (
                <tr key={r.metric} className="border-b border-line/60">
                  <td className="py-2 pr-4 font-medium text-ink">{r.metric}</td>
                  <td className="py-2 pr-4 text-right text-slatey-400">{r.previous}{r.suffix}</td>
                  <td className="py-2 pr-4 text-right font-semibold text-ink">{r.current}{r.suffix}</td>
                  <td className={cn("py-2 pr-4 text-right font-medium", r.status === "pass" ? "text-emerald-600" : r.status === "warn" ? "text-amber-600" : "text-rose-600")}>{r.delta > 0 ? "+" : ""}{r.delta}{r.suffix}</td>
                  <td className="py-2"><Badge tone={tone(r.status)}>{r.status === "pass" ? "OK" : r.status === "warn" ? "Watch" : "Blocker"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] italic text-slatey-500">Modeled comparison vs a synthetic prior run ({reg.prevRunId ?? "baseline"}) until real run history is captured.</p>
      </Panel>

      {/* Incident & rollback */}
      <Panel>
        <SectionHeader eyebrow="Incident readiness" title="Incident & rollback" icon={AlertTriangle}
          description="The failure scenarios this system should expect, each with a linked version and a rollback path." />
        <div className="grid gap-3 lg:grid-cols-3">
          {inc.incidents.map((x) => (
            <div key={x.id} className="flex flex-col rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slatey-400">{x.id}</span>
                <Badge tone={x.severity === "Critical" || x.severity === "High" ? "rose" : x.severity === "Medium" ? "amber" : "slate"}>{x.severity}</Badge>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-ink">{x.trigger}</p>
              <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
                <div><dt className="inline font-semibold text-slatey-500">Affected: </dt><dd className="inline text-slatey-400">{x.affectedUsers}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Likely cause: </dt><dd className="inline text-slatey-400">{x.rootCause}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Linked: </dt><dd className="inline font-mono text-slatey-400">{x.linkedVersion}</dd></div>
                <div><dt className="inline font-semibold text-emerald-700">Rollback: </dt><dd className="inline text-slatey-400">{x.rollback}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Owner: </dt><dd className="inline text-slatey-400">{x.owner} · postmortem {x.postmortem}</dd></div>
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <p className="stat-label mb-1.5 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Rollback options available</p>
          <div className="flex flex-wrap gap-1.5">{inc.rollbackOptions.map((o) => <Badge key={o} tone="slate">{o}</Badge>)}</div>
        </div>
      </Panel>

      {/* Ops evidence summary */}
      <Panel>
        <SectionHeader eyebrow="Handoff" title="Ops evidence → Govern & Realize" icon={Gauge}
          description="The operational evidence object other stages consume. Written to shared state as deploy.evidence." />
        {ev ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Release readiness" value={`${ev.releaseReadinessScore ?? "N/A"}`} suffix="/100" tone={(ev.releaseReadinessScore ?? 0) >= 80 ? "healthy" : (ev.releaseReadinessScore ?? 0) >= 65 ? "watch" : "risk"} interpretation={ev.releaseRecommendation} />
              <KpiCard label="Monitoring" value={`${ev.monitoringCoverageScore ?? ev.monitoringCoverage ?? "N/A"}`} suffix="%" tone={(ev.monitoringCoverageScore ?? 0) >= 80 ? "healthy" : "watch"} interpretation={`${ev.monitoredSignals ?? "N/A"} signals`} />
              <KpiCard label="Regression" value={ev.regressionStatus ?? "N/A"} tone={ev.regressionStatus === "No regression" ? "healthy" : ev.regressionStatus === "Watch" ? "watch" : "risk"} interpretation={`${ev.regressionFindings?.length ?? 0} finding(s)`} />
              <KpiCard label="Drift risk" value={`${ev.driftRisk ?? "N/A"}`} suffix="/100" tone={(ev.driftRisk ?? 0) < 40 ? "healthy" : (ev.driftRisk ?? 0) < 60 ? "watch" : "risk"} interpretation={`SLO ${ev.sloStatus ?? "N/A"}`} />
            </div>
            {(ev.openOperationalRisks?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="stat-label mb-1">Open operational risks (for Govern)</p>
                <ul className="space-y-1 text-[12px] text-slatey-400">{ev.openOperationalRisks!.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-amber-500">•</span>{r}</li>)}</ul>
              </div>
            )}
            {ev.toolCallLatencyMs !== undefined && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="stat-label mb-1">Agent / tool telemetry</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slatey-400">
                  <span>tool latency <b className="text-ink">{ev.toolCallLatencyMs} ms</b></span>
                  <span>failure rate <b className="text-ink">{ev.toolFailureRate}%</b></span>
                  <span>approvals pending <b className="text-ink">{ev.approvalQueueCount}</b></span>
                  <span>blocked actions <b className="text-ink">{ev.blockedActionCount}</b></span>
                  <span>rollback events <b className="text-ink">{ev.rollbackEvents}</b></span>
                </div>
              </div>
            )}
            {ev.generalizationScore !== undefined && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="stat-label mb-1">Training / generalization telemetry</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slatey-400">
                  <span>generalization <b className="text-ink">{ev.generalizationScore}/100</b></span>
                  <span>overfitting <b className="text-ink">{ev.overfittingRiskLevel}</b></span>
                  <span>drift monitoring <b className="text-ink">{ev.trainingDriftMonitoringRequired ? "required" : "n/a"}</b></span>
                  <span>retrain trigger <b className="text-ink">{ev.retrainingTrigger}</b></span>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slatey-400">Switch to Live mode and frame an initiative to generate operational evidence for Govern and Realize.</p>
        )}
      </Panel>

      {/* What this stage demonstrates */}
      <Panel>
        <SectionHeader eyebrow="For reviewers" title="What this stage demonstrates" icon={ShieldCheck} />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-300">
          This stage shows how AI systems move from a successful build to controlled operation. It connects model choice, prompt and index lineage,
          evaluation regression, latency, cost, drift, incidents, rollback, and monitoring coverage into release-readiness evidence, not to replace an
          MLOps platform, but to show the operating decisions enterprise teams need before piloting or productionizing AI.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InsightCard tone="info" title="Release gates before production">A deterministic readiness score gates the pilot on Strategy, Data, Build, and Ops evidence together.</InsightCard>
          <InsightCard tone="success" title="MLOps / LLMOps lineage">Every result traces to a model, prompt, index, corpus, eval set, policy, and config version.</InsightCard>
          <InsightCard tone="warn" title="Monitoring & rollback readiness">Coverage gaps and rollback paths are explicit, so incidents are debuggable and reversible.</InsightCard>
        </div>
      </Panel>
    </div>
  );
}
