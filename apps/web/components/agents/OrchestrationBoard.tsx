"use client";

// GAP-03 · Multi-Agent Orchestration Board (Collection 2 · toolkit · flagship).
// Supervisor decomposes a goal → agents coordinate over A2A-style messages with
// visible task-lifecycle states → result assembles → a running cost/latency/quality
// meter compares this run to a single-agent baseline. The meter is the judgment
// layer: multi-agent is a tradeoff, not a party trick.
//
// LIVE-ready: when a host model endpoint is configured (NEXT_PUBLIC_AGENT_ENDPOINT)
// the run goes real; with none set it replays a dignified CACHED run — labeled as
// such, never fake-streamed as if live (§B2 / §A4.4).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, BarChart3, PenLine, ShieldAlert, Bot, Play, type LucideIcon } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { LIVE_MODEL } from "@labs/kit";

type Role = "Researcher" | "Analyst" | "Writer" | "Critic";
const ROLE_ICON: Record<Role, LucideIcon> = { Researcher: Search, Analyst: BarChart3, Writer: PenLine, Critic: ShieldAlert };

interface Agent { role: Role; task: string; output: string }
interface Msg { from: string; to: string; label: string }
interface Metrics { quality: number; costUsd: number; latencyS: number }
interface Preset {
  key: string; label: string; goal: string;
  agents: Agent[]; messages: Msg[]; assembled: string[];
  single: Metrics; multi: Metrics;
}

const PRESETS: Preset[] = [
  {
    key: "brief", label: "Competitive brief", goal: "Prep a competitive brief on a new fintech entrant in card disputes.",
    agents: [
      { role: "Researcher", task: "Gather the entrant's public product claims, pricing, and integration model.", output: "API-first disputes, usage-based pricing, no on-prem, SOC 2 only." },
      { role: "Analyst", task: "Compare their approach to ours and find the gaps.", output: "Their edge: speed-to-integrate. Ours: regulated scale + governance. Their gap: no case-level audit trail." },
      { role: "Writer", task: "Assemble a one-page brief: the three things leadership must know.", output: "Drafted 3-point brief on integration speed, governance moat, and audit-trail watch." },
      { role: "Critic", task: "Red-team the brief for unsupported claims.", output: "Flagged one unsupported superlative; softened 'fastest in market' to 'positions on speed'." },
    ],
    messages: [
      { from: "Supervisor", to: "Researcher", label: "assign · gather intel" },
      { from: "Researcher", to: "Analyst", label: "handoff · findings" },
      { from: "Analyst", to: "Writer", label: "handoff · gap analysis" },
      { from: "Writer", to: "Critic", label: "review request · draft" },
      { from: "Critic", to: "Supervisor", label: "return · approved w/ edit" },
    ],
    assembled: [
      "They win on integration speed — API-first, live in days, but SOC 2 only and no on-prem.",
      "We win on regulated scale and governance — case-level audit trail is a moat they don't have.",
      "Watch: their audit-trail roadmap. If they close that gap, the speed advantage compounds.",
    ],
    single: { quality: 62, costUsd: 0.018, latencyS: 4.2 },
    multi: { quality: 81, costUsd: 0.043, latencyS: 9.6 },
  },
  {
    key: "playbook", label: "Dispute-resolution playbook", goal: "Draft a dispute-resolution playbook for a new card product.",
    agents: [
      { role: "Researcher", task: "Pull the applicable dispute reason codes and SLAs.", output: "12 reason codes in scope; issuer-review SLA 30 days." },
      { role: "Analyst", task: "Map each reason code to required evidence and a decision rule.", output: "Grouped into 4 decision paths; two require manual review." },
      { role: "Writer", task: "Draft the step-by-step playbook.", output: "Playbook: intake → classify → evidence → decide → notify, with the two manual gates flagged." },
      { role: "Critic", task: "Check the draft against the chargeback policy for gaps.", output: "One path missed duplicate-charge auto-resolve; added it." },
    ],
    messages: [
      { from: "Supervisor", to: "Researcher", label: "assign · pull reason codes" },
      { from: "Researcher", to: "Analyst", label: "handoff · codes + SLAs" },
      { from: "Analyst", to: "Writer", label: "handoff · decision paths" },
      { from: "Writer", to: "Critic", label: "review request · playbook" },
      { from: "Critic", to: "Supervisor", label: "return · gap fixed" },
    ],
    assembled: [
      "Five-step flow: intake → classify → evidence → decide → notify, one owner per step.",
      "Four decision paths from 12 reason codes; auto-resolve duplicates, manual-review two high-risk paths.",
      "Every step maps to a chargeback-policy clause — auditable end to end.",
    ],
    single: { quality: 58, costUsd: 0.021, latencyS: 4.8 },
    multi: { quality: 79, costUsd: 0.052, latencyS: 11.0 },
  },
];

// SIMULATED — the run is authored and deterministic; a live-model variant is on the roadmap (no live call path is wired today).
const STEP_MS = 950;

export function OrchestrationBoard() {
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const preset = PRESETS.find((p) => p.key === presetKey)!;
  const A = preset.agents.length;

  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState(-1); // -1 idle · 0..A running · >A done
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (runId === 0) return;
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= A + 1) { if (timer.current) clearInterval(timer.current); return p; }
        return p + 1;
      });
    }, STEP_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [runId, A]);

  const onPreset = (k: string) => { setPresetKey(k); setProgress(-1); setRunId(0); if (timer.current) clearInterval(timer.current); };
  const run = () => setRunId((r) => r + 1);

  const idle = progress === -1;
  const done = progress > A;
  const agentStatus = (i: number): "idle" | "working" | "done" => idle ? "idle" : progress > i ? "done" : progress === i ? "working" : "idle";

  const qualityDelta = Math.round((preset.multi.quality / preset.single.quality - 1) * 100);
  const costMult = (preset.multi.costUsd / preset.single.costUsd).toFixed(1);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-03</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Multi-Agent Orchestration Board</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02", note: "Authored illustrative run" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A supervisor decomposes the goal, agents coordinate, and a result assembles. The meter on the right is the
            point: multi-agent buys quality — but at a cost and latency multiple you should be able to name.
          </p>
          <p className="mt-1 text-[11px] text-slatey-500">Authored, deterministic run — the steps and the cost/latency/quality figures are hand-built to teach the tradeoff, not captured from a live model. A real-model variant is on the roadmap.</p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => onPreset(p.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${p.key === presetKey ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{p.label}</button>
          ))}
          <button onClick={run} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90"><Play className="h-3.5 w-3.5" /> {idle ? "Run" : "Re-run"}</button>
        </div>

        <div className="mb-3 rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wide text-slatey-500">Goal · </span>
          <span className="text-ink">{preset.goal}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Orchestration */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 rounded-lg border p-3 transition ${idle ? "border-line bg-white" : progress === 0 ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
              <Bot className={`h-5 w-5 ${!idle && progress === 0 ? "text-white" : "text-ink"}`} />
              <div>
                <p className={`text-sm font-semibold ${!idle && progress === 0 ? "text-white" : "text-ink"}`}>Supervisor</p>
                <p className={`text-[11px] ${!idle && progress === 0 ? "text-slate-300" : "text-slatey-500"}`}>{idle ? "Idle — press Run" : progress === 0 ? "Decomposing goal into subtasks…" : done ? "Assembled the final result" : "Coordinating agents…"}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {preset.agents.map((a, i) => {
                const st = agentStatus(i);
                const Icon = ROLE_ICON[a.role];
                return (
                  <div key={a.role} className={`rounded-lg border p-3 transition ${st === "working" ? "border-amber-400 bg-amber-50" : st === "done" ? "border-emerald-300 bg-white" : "border-line bg-white opacity-70"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><Icon className="h-4 w-4 text-teal-700" /><p className="text-sm font-semibold text-ink">{a.role}</p></div>
                      <Badge tone={st === "done" ? "emerald" : st === "working" ? "amber" : "slate"}>{st === "working" ? "working" : st === "done" ? "completed" : "idle"}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slatey-500">{a.task}</p>
                    {st === "done" && <p className="mt-1.5 rounded bg-slate-50 px-2 py-1 text-[11px] text-slatey-300">{a.output}</p>}
                  </div>
                );
              })}
            </div>

            <Panel>
              <p className="stat-label mb-2">A2A-style coordination <span className="font-normal text-slatey-500">· task lifecycle: assigned → working → completed</span></p>
              {idle ? <p className="text-xs text-slatey-500">No messages yet.</p> : (
                <ul className="space-y-1 font-mono text-[11px]">
                  {preset.messages.slice(0, Math.max(0, Math.min(progress + 1, preset.messages.length))).map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-slatey-300">
                      <span className="text-slatey-500">{m.from}</span><span className="text-teal-700">→</span><span className="text-slatey-500">{m.to}</span>
                      <span className="text-ink">{m.label}</span>
                      <Badge tone="emerald" className="ml-auto">completed</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Result + meter */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Assembled result</p>
              {done ? (
                <ul className="space-y-1.5 text-sm text-slatey-300">
                  {preset.assembled.map((b, i) => <li key={i} className="flex gap-2"><span className="font-semibold text-teal-700">•</span><span>{b}</span></li>)}
                </ul>
              ) : <p className="text-sm text-slatey-500">{idle ? "Run the orchestration to assemble a result." : "Assembling…"}</p>}
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Multi-agent vs single-agent</p>
              <Compare label="Quality" single={`${preset.single.quality}`} multi={`${preset.multi.quality}`} sVal={preset.single.quality} mVal={preset.multi.quality} betterHigh />
              <Compare label="Cost / run" single={`$${preset.single.costUsd.toFixed(3)}`} multi={`$${preset.multi.costUsd.toFixed(3)}`} sVal={preset.single.costUsd} mVal={preset.multi.costUsd} />
              <Compare label="Latency" single={`${preset.single.latencyS}s`} multi={`${preset.multi.latencyS}s`} sVal={preset.single.latencyS} mVal={preset.multi.latencyS} />
              <div className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800">
                <span className="font-semibold">The ratio:</span> multi-agent bought <span className="font-semibold">+{qualityDelta}% quality</span> for <span className="font-semibold">{costMult}× cost</span> on this task class. That ratio — not the demo — is the decision.
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="When multi-agent is worth it" tone="info">
            Decompose only when the subtasks genuinely differ (research vs critique) and quality matters more than the 2–3× cost. For high-volume, low-stakes calls, a single agent wins. Budget for the harness, not the party trick.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> Multi-agent bought +{qualityDelta}% quality on this task class for {costMult}× cost. That ratio, not the demo, is the decision.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Orchestration pattern: a supervisor decomposes the goal and delegates to role-specialized agents that coordinate over A2A-style messages with explicit lifecycle states (assigned → working → completed).</p>
              <p>The run is authored and deterministic — a scripted supervisor/worker trace with illustrative cost, latency, and quality figures for this task class, not measured from a live model. A real-model variant against {LIVE_MODEL} is designed for but not wired today, so the badge stays SIMULATED.</p>
              <p>Stack: Next.js (static) + shared design system; client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> the outputs and the cost/latency/quality figures are authored illustrations of a typical run on this task class, not measured from a live execution. The +{qualityDelta}% / {costMult}× ratio is representative, not a benchmarked result.</p>
        </div>
      </main>
    </div>
  );
}

function Compare({ label, single, multi, sVal, mVal, betterHigh }: { label: string; single: string; multi: string; sVal: number; mVal: number; betterHigh?: boolean }) {
  const max = Math.max(sVal, mVal) || 1;
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{label}</span><span className="font-mono text-slatey-500">single {single} · multi {multi}</span></div>
      <div className="space-y-1">
        <div className="flex items-center gap-2"><span className="w-10 text-[10px] text-slatey-500">single</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-400" style={{ width: `${(sVal / max) * 100}%` }} /></div></div>
        <div className="flex items-center gap-2"><span className="w-10 text-[10px] text-slatey-500">multi</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${betterHigh ? "bg-emerald-500" : "bg-teal-600"}`} style={{ width: `${(mVal / max) * 100}%` }} /></div></div>
      </div>
    </div>
  );
}
