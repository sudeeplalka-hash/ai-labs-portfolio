"use client";

// Phase 4, Govern live-loop layer. Reads the live lifecycle state (Strategy,
// Data, Build, Operate, Realize) when present, derives a governance decision,
// scorecard, required controls, findings, and an audit evidence pack, and writes
// governance.decision back to shared state for Realize. Falls back to a polished
// sample prompt when no initiative is loaded. The existing cockpit renders below.

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  useProgramSource,
  selectGovernInputs, deriveGovernanceDecision, deriveGovernanceScorecard,
  deriveOpenFindings, deriveRequiredControls, buildAuditEvidencePack,
  deriveDecisionBreakdown,
  type GovLevel, type Severity, type DecisionBreakdown,
} from "@labs/program-core";
import { Panel, SectionHeader, Badge, CopyButton, Provenance } from "@labs/design-system";
import { assessProgramEvidence } from "@gov/lib/program-evidence";
import { RegulatoryMap } from "@/components/govern/RegulatoryMap";
import {
  ShieldCheck, ClipboardCheck, AlertTriangle, ListChecks, FileText, ArrowRight, Gavel, Printer,
} from "lucide-react";

const lvlTone = (l: GovLevel): "emerald" | "amber" | "rose" => (l === "good" ? "emerald" : l === "warn" ? "amber" : "rose");
const sevTone = (s: Severity): "rose" | "amber" | "slate" => (s === "Critical" || s === "High" ? "rose" : s === "Medium" ? "amber" : "slate");
const decTone = (d?: string): "emerald" | "amber" | "rose" | "slate" =>
  d?.startsWith("Approved for") ? "emerald" : d?.startsWith("Approved with") || d?.startsWith("Human") ? "amber" : d?.startsWith("Hold") || d?.startsWith("Not approved") ? "rose" : "slate";

export function GovernLoop() {
  const { state, isDemo, hydrated, update, src } = useProgramSource();
  const isLiveMode = !isDemo;

  const g = useMemo(() => selectGovernInputs(src), [src]);
  const decision = useMemo(() => deriveGovernanceDecision(src), [src]);
  const scorecard = useMemo(() => deriveGovernanceScorecard(src), [src]);
  const findings = useMemo(() => deriveOpenFindings(src), [src]);
  const controls = useMemo(() => deriveRequiredControls(src), [src]);
  const pack = useMemo(() => buildAuditEvidencePack(src), [src]);
  const breakdown = useMemo(() => deriveDecisionBreakdown(src), [src]);
  const coverage = assessProgramEvidence({ ...g, hasDataHandoff: Boolean(src.data?.handoff), hasBuildContract: Boolean(src.rag?.contract), hasOperateEvidence: Boolean(src.deploy?.evidence) });
  const missing = Object.entries(coverage.dimensions).filter(([, dimension]) => !dimension.assessed);
  const decisionLabel = coverage.complete ? decision.decision : "Pending evidence";
  const packDimensions: Record<string, keyof typeof coverage.dimensions> = { strategy: "usecase", data: "data", build: "build", operate: "ops" };
  const displayPack = pack.map(section => {
    const dimension = packDimensions[section.key] && coverage.dimensions[packDimensions[section.key]];
    if (dimension && !dimension.assessed) return { ...section, items: [{ label: "Assessment", value: "Not assessed" }, { label: "Missing record", value: dimension.missing }] };
    if (section.key === "governance" && !coverage.complete) return { ...section, items: [{ label: "Decision", value: "Pending evidence" }, { label: "Missing sources", value: missing.map(([, item]) => item.source).join("; ") }] };
    if (section.key === "strategy") return { ...section, items: section.items.map(item => (item.label === "Human review" && g.humanReviewRequired === undefined) || (item.label === "Audit evidence" && g.auditEvidenceRequired === undefined) ? { ...item, value: "Not recorded" } : item) };
    return section;
  });
  const packText = `${isDemo ? "Curated sample program" : "Current browser program"} — modeled governance evidence. Missing records are not clearance.\n\n${displayPack.map(section => `${section.label}\n${section.items.map(item => `${item.label}: ${item.value}`).join("\n")}`).join("\n\n")}`;

  // Persist the governance decision for Realize, safe effect keyed on inputs.
  const sig = JSON.stringify({
    tier: state.initiative?.meta?.governanceTier, name: state.initiative?.name,
    blocked: state.data?.handoff?.blockedSources?.length, gates: state.rag?.contract?.failedGates?.length,
    q: state.rag?.contract?.qualityScore, cite: state.rag?.contract?.citationAccuracy,
    rel: state.deploy?.evidence?.releaseReadinessScore, reg: state.deploy?.evidence?.regressionStatus, drift: state.deploy?.evidence?.driftRisk,
  });
  useEffect(() => {
    if (!hydrated || !isLiveMode || !g.hasLive) return;
    update((d) => { d.governance = { ...(d.governance ?? {}), riskTier: decision.tier, status: "assessed", decision: deriveGovernanceDecision(d) }; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isLiveMode, g.hasLive]);

  // R1.1: the banner derives from the SAME source (src) as the sidebar and the
  // stepper. In Demo mode src is the curated archetype, so the banner names it
  // instead of claiming no initiative exists while the rail shows one.
  const loaded = coverage.loaded;

  if (!loaded) return (
    <Panel>
      <SectionHeader eyebrow="Current program" title="Governance not assessed" icon={ShieldCheck} action={<Badge tone="slate">Not assessed</Badge>} />
      <p className="text-sm text-slatey-400">No framed initiative is loaded. A governance decision needs recorded Strategy, Data, Build and Operate evidence. The separate registry below contains sample records.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(coverage.dimensions).map(([key, dimension]) => <li key={key} className="rounded-lg border border-line p-3"><p className="text-sm font-semibold text-ink">{dimension.source}</p><p className="mt-1 text-xs text-slatey-400">Not assessed — {dimension.missing}</p></li>)}</ul>
      <Link href="/frame" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"><ArrowRight className="h-4 w-4" /> Frame an initiative</Link>
    </Panel>
  );

  return (
    <div className="space-y-6">
      {/* 1, Banner */}
        <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
                {isDemo ? "Curated sample program" : "Current browser program"}
              </span>
            </div>
            <Badge tone={coverage.complete ? decTone(decision.decision) : "slate"}>{decisionLabel}</Badge>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-ink">{g.initiativeName}</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div><p className="stat-label">Pattern</p><p className="font-medium text-ink">{g.primaryAiPattern ?? "Not recorded"}</p></div>
            <div><p className="stat-label">Governance tier</p><Badge tone={g.governanceTier ? lvlTone(g.governanceTier === "Critical" || g.governanceTier === "High" ? "bad" : g.governanceTier === "Medium" ? "warn" : "good") : "slate"}>{g.governanceTier ?? "Not assessed"}</Badge></div>
            <div><p className="stat-label">Operational criticality</p><p className="font-medium text-ink">{g.operationalCriticality ?? "N/A"}</p></div>
            <div><p className="stat-label">Release status</p><p className="font-medium text-ink">{g.releaseRecommendation ?? "pending Operate"}</p></div>
          </div>
          {(g.capabilityTags?.length ?? 0) > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{g.capabilityTags!.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}</div>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slatey-400">
            {g.humanReviewRequired && <span>Human review required</span>}
            {g.auditEvidenceRequired && <span>Audit evidence required</span>}
          </div>
        </div>

      {/* 2, Scorecard */}
      <Provenance mode={isDemo ? "Curated sample program" : "Current browser program"} input="Recorded lifecycle contracts" method="Deterministic governance rules" note="These are planning assessments, not production telemetry or external audit approval. Missing stage evidence remains not assessed." />
      <Panel>
        <SectionHeader eyebrow="Program governance scorecard" title="Where this initiative stands, by recorded evidence" icon={ShieldCheck} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {scorecard.map((d) => {
            const dimension = coverage.dimensions[d.key as keyof typeof coverage.dimensions];
            return (
            <div key={d.key} className="flex flex-col rounded-xl border border-line bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-xs font-semibold text-ink">{d.dimension}</p>
                <Badge tone={dimension.assessed ? lvlTone(d.level) : "slate"}>{dimension.assessed ? d.status : "Not assessed"}</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slatey-400">{dimension.assessed ? d.why : dimension.missing}</p>
              {dimension.assessed && d.findings.length > 0 && <ul className="mt-1.5 space-y-0.5 text-[11px] text-slatey-500">{d.findings.slice(0, 3).map((f, i) => <li key={i}>· {f}</li>)}</ul>}
              {!dimension.assessed && <Link href={dimension.href} className="mt-2 text-xs font-semibold text-primary underline">Record evidence</Link>}
              <p className="mt-auto pt-2 text-[10px] uppercase tracking-wide text-slatey-500">{d.source}</p>
            </div>
          ); })}
        </div>
      </Panel>

      {/* 3, Decision panel */}
      <Panel>
        <SectionHeader eyebrow="Modeled governance decision" title="Decision and evidence coverage" icon={Gavel}
          action={<Badge tone={coverage.complete ? decTone(decision.decision) : "slate"}>{decisionLabel}</Badge>} />
        {!coverage.complete ? <div className="rounded-lg border border-line bg-slate-50 p-4"><p className="text-sm font-semibold text-ink">Complete the missing assessments before interpreting a governance score.</p><ul className="mt-2 space-y-2 text-sm text-slatey-400">{missing.map(([key, dimension]) => <li key={key}><Link href={dimension.href} className="text-primary underline">{dimension.source}</Link>: {dimension.missing}</li>)}</ul><p className="mt-3 text-xs text-slatey-500">Controls and findings below are provisional outputs from the inputs already recorded.</p></div> : <>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-slate-50/60 p-4 text-center">
            <p className="stat-label">Governance score</p>
            <p className="text-4xl font-semibold text-ink">{decision.score}<span className="text-lg text-slatey-400">/100</span></p>
            <p className="mt-1 text-[11px] text-slatey-400">Audit: {decision.auditReadiness}</p>
            <p className="text-[11px] text-slatey-400">Next review: {decision.nextReviewDate}</p>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-slatey-300">{decision.rationale}</p>
            {(decision.releaseBlockers?.length ?? 0) > 0 && (
              <div className="mt-2"><p className="stat-label mb-1 text-rose-600">Release blockers</p>
                <ul className="space-y-0.5 text-[12px] text-slatey-400">{decision.releaseBlockers!.map((b, i) => <li key={i} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />{b}</li>)}</ul></div>
            )}
            {(decision.approvalConditions?.length ?? 0) > 0 && (
              <div className="mt-2"><p className="stat-label mb-1">Approval conditions</p>
                <div className="flex flex-wrap gap-1.5">{decision.approvalConditions!.map((c) => <Badge key={c} tone="amber">{c}</Badge>)}</div></div>
            )}
            {(decision.evidenceUsed?.length ?? 0) > 0 && (
              <div className="mt-2"><p className="stat-label mb-1">Evidence used</p>
                <ul className="space-y-0.5 text-[11px] text-slatey-500">{decision.evidenceUsed!.map((e, i) => <li key={i}>· {e}</li>)}</ul></div>
            )}
          </div>
        </div>

        {/* Phase D, why this score: baseline → per-dimension deltas → score */}
        <div className="mt-5 border-t border-line pt-4">
          <p className="stat-label mb-3">Why this score: each dimension&rsquo;s pull on the {breakdown.baseline} point all clear baseline</p>
          <DecisionWaterfall b={breakdown} />
          <div className="mt-3">
            <p className="stat-label mb-1">Decision drivers</p>
            <ul className="space-y-0.5 text-[12px] text-slatey-400">
              {breakdown.decisionDrivers.map((d, i) => <li key={i} className="flex gap-1.5"><Gavel className="mt-0.5 h-3 w-3 shrink-0 text-slatey-500" />{d}</li>)}
            </ul>
          </div>
        </div>
        </>}
      </Panel>

      {/* 3.5, Regulatory orientation (EU AI Act + NIST AI RMF) */}
      <RegulatoryMap />

      {/* 4, Required controls */}
      <Panel>
        <SectionHeader eyebrow="Required controls" title={coverage.complete ? "Controls from recorded inputs" : "Provisional controls from recorded inputs"} icon={ListChecks} />
        {controls.length === 0 ? <p className="text-sm text-slatey-400">No controls were triggered by the recorded inputs. {coverage.complete ? "Review applicability with the responsible owner." : "Missing evidence may introduce additional requirements."}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
                <th className="py-2 pr-3 font-semibold">Control</th><th className="py-2 pr-3 font-semibold">Triggered by</th><th className="py-2 pr-3 font-semibold">Owner</th><th className="py-2 pr-3 font-semibold">Before pilot?</th><th className="py-2 font-semibold">Source</th>
              </tr></thead>
              <tbody>{controls.map((c, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-medium text-ink">{c.name}</td>
                  <td className="py-2 pr-3 text-slatey-400">{c.triggeredBy}</td>
                  <td className="py-2 pr-3 text-slatey-400">{c.owner}</td>
                  <td className="py-2 pr-3">{c.requiredBeforePilot ? <Badge tone="rose">Required</Badge> : <Badge tone="slate">Recommended</Badge>}</td>
                  <td className="py-2 text-slatey-400">{c.evidenceSource}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 5, Open findings */}
      <Panel>
        <SectionHeader eyebrow="Open governance findings" title="What must be resolved, and by whom" icon={AlertTriangle} />
        {findings.length === 0 ? <p className="text-sm text-slatey-400">No findings were generated from the recorded inputs. {coverage.complete ? "This does not certify production readiness." : "Unassessed stages still require evidence; no clearance is implied."}</p> : (
          <div className="grid gap-3 lg:grid-cols-3">{findings.map((f, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between"><Badge tone={sevTone(f.severity)}>{f.severity}</Badge><span className="text-[11px] text-slatey-400">{f.status}</span></div>
              <p className="mt-1.5 text-sm font-semibold text-ink">{f.finding}</p>
              <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
                <div><dt className="inline font-semibold text-slatey-500">Evidence: </dt><dd className="inline text-slatey-400">{f.evidenceSource}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Impact: </dt><dd className="inline text-slatey-400">{f.impact}</dd></div>
                <div><dt className="inline font-semibold text-emerald-700">Action: </dt><dd className="inline text-slatey-400">{f.requiredAction}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Owner: </dt><dd className="inline text-slatey-400">{f.owner} · due in {f.dueStage}</dd></div>
              </dl>
            </div>
          ))}</div>
        )}
      </Panel>

      {/* 6, Audit evidence pack */}
      <Panel>
        <SectionHeader eyebrow="Program evidence summary" title="Recorded inputs and explicit gaps" icon={FileText}
          action={
            <div className="no-print flex flex-wrap gap-2">
              <CopyButton text={packText} label="Copy evidence summary" />
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-slatey-300 hover:bg-slate-50"><Printer className="h-3.5 w-3.5" /> Print / save PDF</button>
              <Link href="/realize" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"><ArrowRight className="h-3.5 w-3.5" /> Continue to Realize</Link>
            </div>
          } />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayPack.map((sec) => (
            <div key={sec.key} className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">{sec.label}</p>
              <dl className="mt-1.5 space-y-1 text-[11px] leading-relaxed">
                {sec.items.map((it, i) => (
                  <div key={i} className="flex flex-wrap justify-between gap-2"><dt className="text-slatey-500">{it.label}</dt><dd className="min-w-0 break-words font-medium text-ink">{it.value}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slatey-500"><ClipboardCheck className="h-3.5 w-3.5" /> Modeled outputs are planning inputs. This summary does not approve production deployment.</p>
      </Panel>
    </div>
  );
}

// ---- Phase D · decision-driver waterfall -------------------------------------
// Baseline (all dimensions passing) on the left, each dimension's pull as a
// floating drop, and the final governance score on the right. Hand-rolled so it
// stays deterministic, dependency-free, and print-safe.
const SHORT_DIM: Record<string, string> = {
  usecase: "Use case", data: "Data", build: "Build", ops: "Ops", audit: "Audit",
};

function DecisionWaterfall({ b }: { b: DecisionBreakdown }) {
  const H = 120; // px chart height, scaled to the baseline score
  const px = (v: number) => Math.max(2, Math.round((v / b.baseline) * H));
  let running = b.baseline;

  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1" role="img"
      aria-label={`Governance score waterfall: baseline ${b.baseline}, final score ${b.score}`}>
      {/* Baseline */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <span className="font-mono text-[11px] font-semibold text-ink">{b.baseline}</span>
        <div className="w-full rounded-t bg-slate-300/80" style={{ height: px(b.baseline) }} />
        <span className="text-[10px] font-medium text-slatey-500">Baseline</span>
      </div>

      {/* Factor drops */}
      {b.factors.map((f) => {
        const top = running;
        running += f.delta;
        const dropPx = f.delta < 0 ? px(-f.delta) : 3;
        const spacerPx = Math.round(((b.baseline - top) / b.baseline) * H);
        return (
          <div key={f.key} className="flex w-16 shrink-0 flex-col items-center gap-1" title={`${f.dimension}: ${f.status}${f.findings.length ? `. ${f.findings.join("; ")}` : ""}`}>
            <span className={cnDelta(f.delta)}>{f.delta === 0 ? "0" : f.delta}</span>
            <div className="flex w-full flex-col" style={{ height: px(b.baseline) }}>
              <div style={{ height: spacerPx }} />
              <div className={f.delta === 0 ? "w-full rounded bg-emerald-400/70" : f.delta <= -8 ? "w-full rounded bg-rose-400/80" : "w-full rounded bg-amber-400/80"} style={{ height: dropPx }} />
            </div>
            <span className="text-[10px] font-medium text-slatey-500">{SHORT_DIM[f.key] ?? f.dimension}</span>
          </div>
        );
      })}

      {/* Final score */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <span className="font-mono text-[11px] font-semibold text-primary-dark">{b.score}</span>
        <div className="w-full rounded-t bg-primary/70" style={{ height: px(b.score) }} />
        <span className="text-[10px] font-medium text-slatey-500">Score</span>
      </div>
    </div>
  );
}

const cnDelta = (d: number) =>
  d === 0 ? "font-mono text-[11px] font-semibold text-emerald-600"
    : d <= -8 ? "font-mono text-[11px] font-semibold text-rose-600"
    : "font-mono text-[11px] font-semibold text-amber-600";
