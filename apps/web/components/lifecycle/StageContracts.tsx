"use client";

// Phase 1, Lifecycle coherence. Small, additive cards that make each stage's
// handoff visible and write the structured contract into shared program state so
// the next stage can consume it. All writes derive from the update() draft (never
// from the contract they write), so there are no update loops. Live mode only.
//
// Phase A, ghost states (never render nothing: explain what will appear and
// offer the sample program) and linked handoff chips (→ next stage is a link).

import { useEffect } from "react";
import Link from "next/link";
import { useProgramSource, buildDataReadinessHandoff, buildBuildOutputContract } from "@labs/program-core";
import { Badge, Provenance } from "@labs/design-system";
import { Database, Boxes, ArrowRight } from "lucide-react";
import { LoadSampleInline } from "@/components/reviewer/SampleProgram";

function Shell({ icon, eyebrow, to, children }: { icon: React.ReactNode; eyebrow: string; to?: { label: string; href: string }; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{icon}{eyebrow}</div>
        {to && (
          <Link href={to.href} className="group inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark">
            → {to.label} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// Ghost: shown instead of nothing when the contract hasn't been produced yet.
function Ghost({ icon, eyebrow, children }: { icon: React.ReactNode; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-slate-50/60 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{icon}{eyebrow}</div>
      <p className="text-sm leading-relaxed text-slatey-400">{children}</p>
      <div className="mt-2"><LoadSampleInline /></div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div><p className="stat-label">{label}</p><p className="text-sm font-semibold text-ink">{value}</p></div>
);

// ---- Data → Build ----------------------------------------------------------
export function DataHandoffCard() {
  const { state, update, hydrated, isDemo, src } = useProgramSource();
  const sig = JSON.stringify({
    n: state.initiative?.name, m: state.initiative?.meta, r: state.data?.readinessScore,
    // Input only (written by DataSliceWriter, never by this card), so the
    // handoff refreshes when the live corpus backlog changes without any
    // self-retrigger risk.
    cb: state.data?.corpusBacklog?.map((e) => e.finding + e.status),
    cx: state.data?.corpusExclusions?.map((e) => e.file),
    ct: state.data?.corpusTopics?.map((t) => t.label + t.files.length),
  });
  useEffect(() => {
    if (!hydrated || isDemo || !state.initiative?.name) return;
    update((d) => { d.data = { ...(d.data ?? {}), handoff: buildDataReadinessHandoff(d) }; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isDemo]);

  if (!hydrated) return null;
  // Demo: display the contract derived from the curated sample (never persisted).
  const h = isDemo ? buildDataReadinessHandoff(src) : state.data?.handoff;
  if (!h) {
    return (
      <Ghost icon={<Database className="h-3.5 w-3.5" />} eyebrow="Data readiness handoff">
        This card will show the structured contract Data hands to Build, readiness score, approved and blocked
        sources, sensitivity restrictions, and a recommendation. It populates once an initiative is framed in
        Strategy &amp; Planning.
      </Ghost>
    );
  }
  return (
    <Shell icon={<Database className="h-3.5 w-3.5" />} eyebrow="Data readiness handoff" to={{ label: "Build / RAG", href: "/build" }}>
      <div className="mb-3"><Provenance mode={isDemo ? "Curated sample program" : "Computed browser program"} input={h.initiativeName || src.initiative?.name || "Current initiative"} method="Data readiness contract" note="Source names and readiness below belong to the program model. Inspect the Data corpus for actual file-level gates. Restrictions and unresolved work travel with this handoff." /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Data readiness" value={`${h.dataReadinessScore}/100`} />
        <Stat label="Ingestion-ready" value={`${h.ingestionReadyPercent}%`} />
        <Stat label="Approved sources" value={h.approvedSources?.length ?? 0} />
        <Stat label="Blocked / rejected" value={(h.blockedSources?.length ?? 0) + (h.rejectedSources?.length ?? 0)} />
      </div>
      {(h.sensitivityRestrictions?.length ?? 0) > 0 && (
        <p className="mt-2 flex flex-wrap gap-1.5">{h.sensitivityRestrictions!.map((s) => <Badge key={s} tone="amber">{s}</Badge>)}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-slatey-400"><b className="text-slatey-300">Recommendation:</b> {h.recommendation}</p>
      <details className="mt-3 rounded-lg border border-line p-3"><summary className="cursor-pointer py-1 text-sm font-semibold">Sources and unresolved work</summary><div className="mt-3 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold">Approved sources</p><ul className="mt-1 list-disc pl-4 text-sm text-slatey-400">{(h.approvedSources?.length ? h.approvedSources : ["No approved source recorded"]).map(source => <li key={source}>{source}</li>)}</ul></div><div><p className="text-xs font-semibold">Blocked or rejected</p><ul className="mt-1 list-disc pl-4 text-sm text-slatey-400">{([...new Set([...(h.blockedSources ?? []), ...(h.rejectedSources ?? [])])].length ? [...new Set([...(h.blockedSources ?? []), ...(h.rejectedSources ?? [])])] : ["No excluded source recorded"]).map(source => <li key={source}>{source}</li>)}</ul></div></div><p className="mt-3 text-xs font-semibold">Remediation to carry forward</p><ul className="mt-1 list-disc pl-4 text-sm text-slatey-400">{(h.remediationEntries ? (h.remediationEntries.some(entry => entry.status !== "fixed") ? h.remediationEntries.filter(entry => entry.status !== "fixed").map(entry => `${entry.status === "accepted-risk" ? "Accepted risk: " : "Open: "}${entry.finding} — ${entry.recommendation}`) : ["No unresolved remediation entry recorded"]) : h.remediationBacklog?.length ? h.remediationBacklog : h.knownDataRisks?.length ? h.knownDataRisks : ["No unresolved item recorded by this contract"]).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></details>
    </Shell>
  );
}

// ---- Build → AI Ops --------------------------------------------------------
export function BuildContractCard() {
  const { state, update, hydrated, isDemo, src } = useProgramSource();
  const active = !!state.initiative?.name || !!state.rag?.model;
  const sig = JSON.stringify({
    model: state.rag?.model, f: state.rag?.faithfulness, c: state.rag?.citationAccuracy,
    h: state.rag?.hallucination, cost: state.rag?.costPerAnswer, lat: state.rag?.modelLatencyFactor,
    pat: state.initiative?.meta?.primaryAiPattern, dr: state.data?.handoff?.knownDataRisks?.length,
  });
  useEffect(() => {
    if (!hydrated || isDemo || !active) return;
    update((d) => { d.rag = { ...(d.rag ?? {}), contract: buildBuildOutputContract(d) }; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isDemo, active]);

  if (!hydrated) return null;
  // Demo: display the contract derived from the curated sample (never persisted).
  const c = isDemo ? buildBuildOutputContract(src) : state.rag?.contract;
  if (!c) {
    return (
      <Ghost icon={<Boxes className="h-3.5 w-3.5" />} eyebrow="Build output contract">
        This card will show the contract Build hands to Operate, quality score, faithfulness, citations,
        hallucination risk, failed gates, and the selected engine. It populates once an initiative is framed.
      </Ghost>
    );
  }
  const rec = c.releaseRecommendation ?? "";
  const tone = rec.startsWith("Ready for") ? "emerald" : rec.startsWith("Ready with") ? "amber" : "rose";
  return (
    <Shell icon={<Boxes className="h-3.5 w-3.5" />} eyebrow="Build output contract" to={{ label: "Operate / AI Ops", href: "/deploy" }}>
      <div className="mb-3"><Provenance mode={isDemo ? "Curated sample program" : "Computed browser program"} input={src.initiative?.name || "Current build settings"} method="Build output contract" note="This handoff includes modeled estimates and any saved evaluation metrics. Consult the original evaluator run for its actual provider, inputs and measured timings." /></div>
      {(() => { const dh = isDemo ? buildDataReadinessHandoff(src) : state.data?.handoff; return dh && <p className="mb-2 text-[11px] text-slatey-500">Consuming data readiness {dh.dataReadinessScore}/100 · retrieval {c.retrievalModeLabel ?? c.retrievalMode}</p>; })()}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Quality" value={`${c.qualityScore}/100`} />
        <Stat label="Faithfulness" value={`${c.faithfulness}%`} />
        <Stat label="Citations" value={`${c.citationAccuracy}%`} />
        <Stat label="Hallucination" value={`${c.hallucinationRisk}%`} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={tone as "emerald" | "amber" | "rose"}>{rec}</Badge>
        {(c.failedGates?.length ?? 0) > 0 && <span className="text-[11px] text-rose-600">{c.failedGates!.length} gate(s) failing</span>}
        <span className="text-[11px] text-slatey-400">{c.selectedModel} · {c.indexVersion}</span>
      </div>
      <details className="mt-3 rounded-lg border border-line p-3"><summary className="cursor-pointer py-1 text-sm font-semibold">Gate evidence and remaining failure modes</summary><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slatey-400">{[...(c.failedGates ?? []).map(gate => `Failing gate: ${gate}`), ...(c.knownFailureModes ?? [])].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>{!c.failedGates?.length && !c.knownFailureModes?.length && <p className="mt-2 text-sm text-slatey-400">No failed gate or failure mode is recorded in this contract. That is not a production approval.</p>}<p className="mt-3 text-xs text-slatey-500">Dataset {c.datasetVersion || 'not recorded'} · Prompt {c.promptVersion || 'not recorded'} · Evaluation {c.evalRunId || 'not recorded'}</p></details>
    </Shell>
  );
}
