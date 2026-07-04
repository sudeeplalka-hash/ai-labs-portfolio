"use client";

// GAP-02 · Agent Loop & Failure Inspector (Collection 2 · toolkit).
// Step a Thought→Action→Observation trace; restructure it by architecture; inject
// one of the four failures that break agents in production and watch the detection
// signal and recovery policy fire. You don't budget for agents — you budget for
// agents plus the harness that catches these four. SIMULATED (trace constructed).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Wrench, Eye, XOctagon, Radar, LifeBuoy, CheckCircle2, Play, StepForward, RotateCcw, type LucideIcon } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { GAP02_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";

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
    { role: "final", label: "Filed via orchestrator + workers — faster, more moving parts to monitor." },
  ],
  eval: [
    { role: "thought", label: "Generator: draft the member response." },
    { role: "action", label: "draft_response(v1)" },
    { role: "observation", label: "v1 produced." },
    { role: "thought", label: "Evaluator: check tone + policy citation." },
    { role: "observation", label: "v1 missing policy citation; tone too curt." },
    { role: "action", label: "refine → draft_response(v2)" },
    { role: "observation", label: "v2 cites policy, warmer tone — passes." },
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
    { role: "recover", label: "Recovery policy", detail: "Reject at the gate, re-ask with the schema (see GAP-04 Structured Output)" },
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
  const selectUseCase = (id: string | null) => setActiveUcId(id);
  const trace = activeUc ? activeUc.payload.base : buildTrace(arch, fail);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setStep(0); setPlaying(false); if (timer.current) clearInterval(timer.current); }, [arch, fail, activeUcId]);
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => setStep((s) => { if (s >= trace.length) { if (timer.current) clearInterval(timer.current); setPlaying(false); return s; } return s + 1; }), 750);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, trace.length]);

  const shown = trace.slice(0, step);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-02</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Agent Loop &amp; Failure Inspector</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            {activeUc ? `${activeUc.payload.taskLine} Step the loop and watch the characteristic failure, its detection signal, and the recovery policy fire.` : "Task: resolve a card dispute end-to-end. Step the loop, restructure it by architecture, then inject a failure — the failure, its detection signal, and the recovery policy are the part you actually budget for."}
          </p>
        </div>

        <UseCaseRail useCases={GAP02_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        {!activeUc && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Panel>
            <p className="stat-label mb-2">Architecture</p>
            <div className="flex flex-wrap gap-1.5">
              {ARCHES.map((a) => (
                <button key={a.key} onClick={() => setArch(a.key)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${arch === a.key ? "border-teal-600 bg-teal-600 text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{a.label}</button>
              ))}
            </div>
          </Panel>
          <Panel>
            <p className="stat-label mb-2">Inject failure</p>
            <div className="flex flex-wrap gap-1.5">
              {FAIL_OPTS.map((f) => (
                <button key={f.key} onClick={() => setFail(f.key)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${fail === f.key ? (f.key === "none" ? "border-teal-600 bg-teal-600 text-white" : "border-rose-500 bg-rose-500 text-white") : "border-line text-slatey-400 hover:text-ink"}`}>{f.label}</button>
              ))}
            </div>
          </Panel>
        </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90"><Play className="h-3.5 w-3.5" /> {playing ? "Pause" : "Play"}</button>
          <button onClick={() => setStep((s) => Math.min(trace.length, s + 1))} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slatey-400 hover:text-ink"><StepForward className="h-3.5 w-3.5" /> Step</button>
          <button onClick={() => { setStep(0); setPlaying(false); }} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slatey-400 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
          <span className="ml-auto font-mono text-[11px] text-slatey-500">{Math.min(step, trace.length)}/{trace.length}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel>
            {shown.length === 0 ? <p className="text-sm text-slatey-500">Press Play or Step to run the trace.</p> : (
              <ol className="space-y-2">
                {shown.map((s, i) => {
                  const m = ROLE_META[s.role];
                  const Icon = m.icon;
                  return (
                    <li key={i} className={`rounded-lg border p-2.5 ${m.ring}`}>
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

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="Failure injection is the whole point" tone="info">
            A happy-path demo tells you nothing about production. The four failures above are what actually happen — and
            each is cheap to catch with the right signal and expensive to miss. That gap is the observability budget.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "You don't budget for agents; you budget for agents plus the harness that catches these four failures."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each architecture defines a base Thought→Action→Observation trace; a selected failure splices a failure→detection→recovery triad into the loop. The stepper reveals steps in order.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> traces are illustrative constructions, not captured from a live agent; real detection needs instrumentation (traces, token meters, action fingerprints). It shows the failure taxonomy and response pattern, not a monitoring stack.</p>
        </div>
      </main>
    </div>
  );
}
