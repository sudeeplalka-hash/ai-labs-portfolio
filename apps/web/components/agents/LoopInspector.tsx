"use client";

// GAP-02 · Agent Loop & Failure Inspector (Collection 2 · toolkit).
// Step a Thought→Action→Observation trace; restructure it by architecture; inject
// one of the four failures that break agents in production and watch the detection
// signal and recovery policy fire. You don't budget for agents, you budget for
// agents plus the harness that catches these four. SIMULATED (trace constructed).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Wrench, Eye, XOctagon, Radar, LifeBuoy, CheckCircle2, Play, StepForward, RotateCcw, type LucideIcon } from "lucide-react";
import { InstrumentShell, usePlayback, useInViewport, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { ExplanationControls, EvidenceTable } from "./AgentExperience";
import { GAP02_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type Role = "thought" | "action" | "observation" | "failure" | "detect" | "recover" | "final";
interface Step { role: Role; label: string; detail?: string }

const ROLE_META: Record<Role, { icon: LucideIcon; tone: string; ring: string }> = {
  thought: { icon: Brain, tone: "text-slatey-400", ring: "border-line" },
  action: { icon: Wrench, tone: "text-primary", ring: "border-primary/30" },
  observation: { icon: Eye, tone: "text-teal-700", ring: "border-teal-500/30" },
  failure: { icon: XOctagon, tone: "text-rose-700", ring: "border-rose-300 bg-rose-50" },
  detect: { icon: Radar, tone: "text-amber-700", ring: "border-amber-300 bg-amber-50" },
  recover: { icon: LifeBuoy, tone: "text-emerald-700", ring: "border-emerald-300 bg-emerald-50" },
  final: { icon: CheckCircle2, tone: "text-ink", ring: "border-ink/20 bg-slate-50" },
};

const BASE: Record<string, Step[]> = {
  single: [
    { role: "thought", label: "I need the dispute details first." },
    { role: "action", label: "get_dispute(\"DSP-48213\")" },
    { role: "observation", label: "status=under_review · amount=$214.50" },
    { role: "thought", label: "Check the chargeback policy for this reason code." },
    { role: "action", label: "read_resource(\"disputes://policy/chargeback\")" },
    { role: "observation", label: "reason 'not_recognized' → issuer review, 30-day SLA" },
    { role: "action", label: "open_dispute(account=\"ACCT-0021\", amount=214.50, reason=\"not_recognized\")" },
    { role: "observation", label: "dispute_id=DSP-48999 opened" },
    { role: "final", label: "Dispute filed; member notified. Done in one linear loop." },
  ],
  orch: [
    { role: "thought", label: "Supervisor: decompose into fetch · policy · draft · file." },
    { role: "action", label: "dispatch → [Fetcher, Policy, Drafter] (parallel)" },
    { role: "observation", label: "Fetcher ✓ details · Policy ✓ reason mapped · Drafter ✓ response" },
    { role: "thought", label: "Supervisor: aggregate results and file." },
    { role: "action", label: "open_dispute(...)" },
    { role: "observation", label: "filed ✓" },
    { role: "final", label: "Filed via orchestrator + workers, faster, more moving parts to monitor." },
  ],
  eval: [
    { role: "thought", label: "Generator: draft the member response." },
    { role: "action", label: "draft_response(v1)" },
    { role: "observation", label: "v1 produced." },
    { role: "thought", label: "Evaluator: check tone + policy citation." },
    { role: "observation", label: "v1 missing policy citation; tone too curt." },
    { role: "action", label: "refine → draft_response(v2)" },
    { role: "observation", label: "v2 cites policy, warmer tone, passes." },
    { role: "final", label: "Approved after one evaluate→refine cycle." },
  ],
};

const FAILS: Record<string, Step[]> = {
  tool: [
    { role: "failure", label: "Tool error", detail: "get_dispute → 503 Service Unavailable" },
    { role: "detect", label: "Detection signal", detail: "Monitor: non-2xx tool response + latency spike over threshold" },
    { role: "recover", label: "Recovery policy", detail: "Retry ×2 with exponential backoff → fall back to cached record; flag for review" },
  ],
  loop: [
    { role: "failure", label: "Infinite loop", detail: "read_resource called ×4 with no new information" },
    { role: "detect", label: "Detection signal", detail: "Monitor: identical action signature repeated ≥3 times" },
    { role: "recover", label: "Recovery policy", detail: "Loop breaker: cap iterations, then escalate to a human with the transcript" },
  ],
  halluc: [
    { role: "failure", label: "Hallucinated args", detail: "open_dispute(account_id=\"UNKNOWN\", amount=\"around 50\")" },
    { role: "detect", label: "Detection signal", detail: "Monitor: argument schema validation failed / unknown entity" },
    { role: "recover", label: "Recovery policy", detail: "Reject at the gate, re ask with the schema (see GAP-04 Structured Output)" },
  ],
  overflow: [
    { role: "failure", label: "Context overflow", detail: "assembled context 142k tokens > 128k window" },
    { role: "detect", label: "Detection signal", detail: "Monitor: token budget exceeded before the call" },
    { role: "recover", label: "Recovery policy", detail: "Summarize + evict old turns (see GAP-05 Context & Memory)" },
  ],
};

const FAIL_OPTS = [
  { key: "none", label: "Happy path" }, { key: "tool", label: "Tool error" }, { key: "loop", label: "Loop" },
  { key: "halluc", label: "Hallucinated args" }, { key: "overflow", label: "Context overflow" },
];
const ARCHES = [{ key: "single", label: "Single (ReAct)" }, { key: "orch", label: "Orchestrator-worker" }, { key: "eval", label: "Evaluator-optimizer" }];

function buildTrace(arch: string, fail: string): Step[] {
  const base = BASE[arch];
  if (fail === "none") return base;
  const at = Math.min(3, base.length - 1);
  return [...base.slice(0, at), ...FAILS[fail], ...base.slice(at)];
}

export function LoopInspector() {
  const [arch, setArch] = useState("single");
  const [fail, setFail] = useState("none");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP02_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP02_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => setActiveUcId(id);
  const trace = activeUc ? activeUc.payload.base : buildTrace(arch, fail);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageVisible = useInViewport(stageRef, "0px");
  const playback = usePlayback({ steps: trace.length, intervalMs: 1100, initiallyComplete: false, visible: stageVisible });
  const step = playback.index;
  const resetPlayback = playback.reset;
  useEffect(() => { resetPlayback(); }, [arch, fail, activeUcId, resetPlayback]);
  const currentStep = trace[Math.max(0, step - 1)];
  const failure = trace.find((event) => event.role === "failure");
  const recovery = trace.find((event) => event.role === "recover");
  const shown = trace.slice(0, step);

  return (
    <InstrumentShell title="Agent Failure and Recovery Inspector" eyebrow="GAP-02 · Agent architecture" description="Inspect the failure, the signal that detects it and the policy that recovers."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Agent Failure and Recovery Inspector" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Authored trace; no tools are executed" note="Illustrative results support review; they do not establish a production outcome." />}>
        <DecisionSummary title={failure ? `${failure.label}: inspect the control that catches it` : "Inspect the complete happy-path trace"} explanation={recovery?.detail ?? "No failure is injected. Choose a failure to inspect its detection and recovery policy."} metrics={[{ label: "Trace events", value: trace.length }, { label: "Selected event", value: step ? `${step} · ${currentStep.role}` : "Not started" }]} />
        <UseCaseRail useCases={GAP02_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Enterprise teams often discuss agents as if autonomy is the main decision. The more important decision is whether the organization has the harness required to observe, interrupt, retry, escalate, or roll back agent behavior when it drifts." approach="The inspector steps through single agent, orchestrator worker, and evaluator optimizer patterns. For each architecture, it shows how specific failures are detected, what recovery policy applies, and what latency or operational overhead the control introduces." why="This connects agent architecture to reliability, control cost, incident exposure, and the support model required to operate autonomous workflows safely." metric="Failure classes caught vs escaped; harness coverage of the taxonomy." tradeoff="A richer harness costs money and latency; an un instrumented failure reaches a system of record." outcome="A defensible observability harness budget tied to the failure modes that actually occur." />

        {!activeUc && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Panel>
            <p className="stat-label mb-2">Architecture</p>
            <div className="flex flex-wrap gap-1.5">
              {ARCHES.map((a) => (
                <button key={a.key} aria-pressed={arch === a.key} onClick={() => setArch(a.key)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${arch === a.key ? "border-teal-600 bg-teal-600 text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{a.label}</button>
              ))}
            </div>
          </Panel>
          <Panel>
            <p className="stat-label mb-2">Inject failure</p>
            <div className="flex flex-wrap gap-1.5">
              {FAIL_OPTS.map((f) => (
                <button key={f.key} aria-pressed={fail === f.key} onClick={() => setFail(f.key)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${fail === f.key ? (f.key === "none" ? "border-teal-600 bg-teal-600 text-white" : "border-rose-500 bg-rose-500 text-white") : "border-line text-slatey-400 hover:text-ink"}`}>{f.label}</button>
              ))}
            </div>
          </Panel>
        </div>
        )}

        <div ref={stageRef}><ExplanationControls playback={playback} count={trace.length} label="Authored agent trace" /></div>
        {step > 0 && <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="text-sm font-semibold">Selected event {step}: {currentStep.role}</p><p className="mt-1 break-words text-sm">{currentStep.detail ?? currentStep.label}</p></div>}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel>
            {shown.length === 0 ? <p className="text-sm text-slatey-500">Press Play explanation or Step to inspect the authored trace. No tool is executed.</p> : (
              <ol className="space-y-2">
                {shown.map((s, i) => {
                  const m = ROLE_META[s.role];
                  const Icon = m.icon;
                  return (
                    <li key={i} className={`rounded-lg border p-2.5 ${m.ring} ${step === i + 1 ? "ring-2 ring-primary/40" : ""}`}><button type="button" className="mb-2 min-h-11 rounded border border-line px-3 text-xs font-semibold" aria-pressed={step === i + 1} onClick={() => { playback.pause(); playback.setIndex(i + 1); }}>Inspect event {i + 1}</button>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${m.tone}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${m.tone}`}>{s.role === "detect" ? "detection" : s.role}</span>
                        {(s.role === "failure" || s.role === "detect" || s.role === "recover") && <span className="ml-1 text-xs font-semibold text-ink">{s.label}</span>}
                      </div>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-slatey-300">{s.detail ?? s.label}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel className="self-start">
            <p className="stat-label mb-2">The harness you budget for</p>
            <ul className="space-y-2 text-xs">
              {[["Tool error", "non-2xx / timeout → retry + fallback"], ["Loop", "repeated action ≥3 → cap + escalate"], ["Hallucinated args", "schema validation → reject + re-ask"], ["Context overflow", "token budget → summarize + evict"]].map(([k, v]) => (
                <li key={k} className="rounded-md border border-line p-2"><p className="font-semibold text-ink">{k}</p><p className="text-slatey-400">{v}</p></li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slatey-500">Every one needs a detection signal and a recovery policy. That&apos;s the observability line item.</p>
          </Panel>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Read the full trace without playback</summary><EvidenceTable caption="Complete authored trace" headers={["Event", "Type", "Explanation"]} rows={trace.map((event, i) => [i + 1, event.role, event.detail ?? event.label])} /></details>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Size the observability and recovery harness to the actual failure modes of the chosen architecture." lift="Reduces uncontrolled agent behavior by pairing each failure mode with a detection signal and recovery policy." measure="Failure detection time, recovery success rate, escalation rate, repeat failure rate, incident cost." />
          <InsightCard title="Failure injection is the whole point" tone="info">
            A happy-path demo tells you nothing about production. The four failures above are what actually happen, and
            each is cheap to catch with the right signal and expensive to miss. That gap is the observability budget.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Do not budget for agents alone. Budget for agents plus the operating harness that detects failures, recovers safely, and knows when to involve a human."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each architecture defines a base Thought→Action→Observation trace; a selected failure splices a failure→detection→recovery triad into the loop. The stepper reveals steps in order.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this artifact models representative failure paths. A production environment would require live traces, tool telemetry, policy enforcement, alert routing, and incident management integration.</p>
        </div>
    </InstrumentShell>
  );
}
