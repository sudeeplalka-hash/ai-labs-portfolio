"use client";

// GAP-03 · Multiagent Orchestration Board (Collection 2 · toolkit · flagship).
// Supervisor decomposes a goal → agents coordinate over A2A-style messages with
// visible task-lifecycle states → result assembles. Complete authored outcomes
// compare quality, cost, and latency; optional playback explains the handoffs.
// No model endpoint is called and playback time is never model latency.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, BarChart3, PenLine, ShieldAlert, Bot, Play, Share2, RotateCcw, Gauge, type LucideIcon } from "lucide-react";
import { InstrumentShell, usePlayback, useInViewport, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, LabToolbar, ToolbarButton, toast, ToastHost, CommandPalette, ExportMenu, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { ExplanationControls, EvidenceTable, CodeEvidence } from "./AgentExperience";
import { LIVE_MODEL, GAP03_USE_CASES, LABS } from "@labs/kit";
import { agentTimeline, messageFrames, baselineVsMulti } from "@labs/engines";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { CaseStudy } from "../reviewer/CaseStudy";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

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
      { role: "Researcher", task: "Gather the entrant's public product claims, pricing, and integration model.", output: "API first disputes, usage based pricing, no on prem, SOC 2 only." },
      { role: "Analyst", task: "Compare their approach to ours and find the gaps.", output: "Their edge: speed to integrate. Ours: regulated scale + governance. Their gap: no case level audit trail." },
      { role: "Writer", task: "Assemble a one page brief: the three things leadership must know.", output: "Drafted 3 point brief on integration speed, governance moat, and audit trail watch." },
      { role: "Critic", task: "Red team the brief for unsupported claims.", output: "Flagged one unsupported superlative; softened 'fastest in market' to 'positions on speed'." },
    ],
    messages: [
      { from: "Supervisor", to: "Researcher", label: "assign · gather intel" },
      { from: "Researcher", to: "Analyst", label: "handoff · findings" },
      { from: "Analyst", to: "Writer", label: "handoff · gap analysis" },
      { from: "Writer", to: "Critic", label: "review request · draft" },
      { from: "Critic", to: "Supervisor", label: "return · approved w/ edit" },
    ],
    assembled: [
      "They win on integration speed, API-first, live in days, but SOC 2 only and no on-prem.",
      "We win on regulated scale and governance, case-level audit trail is a moat they don't have.",
      "Watch: their audit-trail roadmap. If they close that gap, the speed advantage compounds.",
    ],
    single: { quality: 62, costUsd: 0.018, latencyS: 4.2 },
    multi: { quality: 81, costUsd: 0.043, latencyS: 9.6 },
  },
  {
    key: "playbook", label: "Dispute resolution playbook", goal: "Draft a dispute resolution playbook for a new card product.",
    agents: [
      { role: "Researcher", task: "Pull the applicable dispute reason codes and SLAs.", output: "12 reason codes in scope; issuer review SLA 30 days." },
      { role: "Analyst", task: "Map each reason code to required evidence and a decision rule.", output: "Grouped into 4 decision paths; two require manual review." },
      { role: "Writer", task: "Draft the step by step playbook.", output: "Playbook: intake → classify → evidence → decide → notify, with the two manual gates flagged." },
      { role: "Critic", task: "Check the draft against the chargeback policy for gaps.", output: "One path missed duplicate charge auto resolve; added it." },
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
      "Four decision paths from 12 reason codes; auto-resolve duplicates, manual-review two high risk paths.",
      "Every step maps to a chargeback-policy clause, auditable end to end.",
    ],
    single: { quality: 58, costUsd: 0.021, latencyS: 4.8 },
    multi: { quality: 79, costUsd: 0.052, latencyS: 11.0 },
  },
];

// SIMULATED, the run is authored and deterministic; a live-model variant is on the roadmap (no live call path is wired today).
const BASE_STEP_MS = 950;

export function OrchestrationBoard() {
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP03_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP03_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const preset: Preset = activeUc ? { key: activeUc.id, label: activeUc.title, ...activeUc.payload } : (PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0]);
  const A = preset.agents.length;
  const frames = messageFrames(preset.messages, preset.agents, preset.goal);

  const stageRef = useRef<HTMLDivElement>(null);
  const stageVisible = useInViewport(stageRef, "0px");
  const playback = usePlayback({ steps: A + 2, intervalMs: BASE_STEP_MS, initiallyComplete: false, visible: stageVisible });
  const progress = playback.index - 1;
  const speed = playback.speed;
  const setSpeed = playback.setSpeed;
  const [inspected, setInspected] = useState<number | null>(null);
  const onPreset = (key: string) => { setPresetKey(key); setActiveUcId(null); playback.reset(); setInspected(null); };
  const selectUseCase = (id: string | null) => { setActiveUcId(id); playback.reset(); setInspected(null); };
  const run = playback.replay;
  const cycleSpeed = () => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1);
  const selectEvent = (index: number) => { playback.pause(); playback.setIndex(index + 1); setInspected(index > 0 && index <= A ? index - 1 : null); };
  // Restore a shared run setup (?cfg=) once on mount.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("cfg");
    if (!raw) return;
    try {
      const cfg = JSON.parse(atob(raw)) as { p?: string; sp?: number };
      if (cfg.p && PRESETS.some((preset) => preset.key === cfg.p)) setPresetKey(cfg.p);
      if (typeof cfg.sp === "number" && [0.5, 1, 2].includes(cfg.sp)) setSpeed(cfg.sp);
    } catch { /* ignore malformed link */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();
  const shareScenario = () => {
    const cfg = btoa(JSON.stringify({ p: activeUc ? undefined : presetKey, sp: speed }));
    const params = new URLSearchParams(window.location.search);
    params.set("cfg", cfg);
    if (activeUcId) params.set("uc", activeUcId); else params.delete("uc");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied, this run setup"), () => toast("Link is in the address bar"));
    } else { toast("Link is in the address bar"); }
  };
  const resetLab = () => { onPreset(PRESETS[0].key); setSpeed(1); toast("Board reset"); };

  // ---- Export suite + command palette ----
  const exportCsv = () => {
    const headers = ["Approach", "Quality", "Cost (USD)", "Latency (s)"];
    const rows = [
      ["Single-agent baseline", preset.single.quality, preset.single.costUsd, preset.single.latencyS],
      ["Multiagent", preset.multi.quality, preset.multi.costUsd, preset.multi.latencyS],
    ];
    downloadCsv(`orchestration-${presetKey}`, headers, rows);
    toast("Run metrics exported as CSV");
  };
  const exportRun = () => {
    downloadJson(`orchestration-${presetKey}`, { version: 1, preset: preset.key, useCaseId: activeUcId, mode: "SIMULATED", revealedSteps: playback.index, goal: preset.goal, speed, single: preset.single, multi: preset.multi, assembled: preset.assembled });
    toast("Run exported as JSON");
  };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Run metrics as CSV", hint: "Single vs multiagent", onSelect: exportCsv },
    { id: "json", label: "Export run (JSON)", hint: "Setup + assembled result", onSelect: exportRun },
  ];
  const paletteCommands: Command[] = [
    { id: "act-run", label: "Replay authored explanation", group: "action", keywords: "start orchestration", run },
    { id: "act-speed", label: "Cycle replay speed", group: "action", run: cycleSpeed },
    { id: "act-share", label: "Copy share link", group: "action", keywords: "permalink url", run: shareScenario },
    { id: "act-reset", label: "Reset the board", group: "action", run: resetLab },
    { id: "exp-csv", label: "Export run metrics as CSV", group: "export", run: exportCsv },
    { id: "exp-json", label: "Export run as JSON", group: "export", run: exportRun },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  const idle = progress === -1;
  const done = progress > A;
  const agentStatus = (i: number): "idle" | "working" | "done" => idle ? "idle" : progress > i + 1 ? "done" : progress === i + 1 ? "working" : "idle";

  const qualityDelta = Math.round((preset.multi.quality / preset.single.quality - 1) * 100);
  const costMult = (preset.multi.costUsd / preset.single.costUsd).toFixed(1);
  const h2h = baselineVsMulti(preset.single, preset.multi);
  const timeline = agentTimeline(preset.agents.map((a) => a.role), preset.multi.latencyS);

  return (
    <InstrumentShell title="Multiagent Orchestration Board" eyebrow="GAP-03 · Agent architecture" description="Follow a task across agent handoffs, then compare the quality gain with its cost."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Multiagent Orchestration Board" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Authored A2A-style trace and illustrative metrics; no live model calls" note="Illustrative results support review; they do not establish a production outcome." />}>
        <DecisionSummary title={h2h.verdict} explanation="Compare the complete authored outcome first, then inspect how this task is handed off. Playback speed is not model latency." metrics={[{ label: "Quality change", value: `${preset.multi.quality - preset.single.quality} model points` }, { label: "Cost multiple", value: `${costMult}×` }, { label: "Latency multiple", value: `${(preset.multi.latencyS / preset.single.latencyS).toFixed(1)}×` }]} />
        <UseCaseRail useCases={GAP03_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="The enterprise question is not whether multiagent workflows are technically possible. The question is whether the quality gain is worth the added coordination, runtime, observability, and cost." approach="The board shows multiple role agents coordinating through a modeled agent to agent workflow. It tracks how decomposition, role specialization, critique, and synthesis affect the final result and the economics of producing it." why="This connects architecture design to financial impact, service level expectations, user experience, and operational complexity." metric="The head to head scorecard: quality delta vs the single agent baseline and the cost and latency multiples, the ratio, not the demo, is the decision." tradeoff="More agents raise quality and cost and latency together; the single agent baseline finishes first at lower quality. The lab makes that tension literal." outcome="A per task class verdict on whether multiagent is worth it, with the tradeoff quantified, the judgment a delivery leader is accountable for." />

        <LabToolbar>
          <ToolbarButton onClick={run} title="Replay the authored orchestration explanation">
            <Play className="h-3.5 w-3.5" /> {idle ? "Play explanation" : "Replay explanation"}
          </ToolbarButton>
          <ToolbarButton onClick={cycleSpeed} title="Change explanation playback speed">
            <Gauge className="h-3.5 w-3.5" /> {speed}× speed
          </ToolbarButton>
          <ToolbarButton onClick={shareScenario} title="Copy a link to this run setup">
            <Share2 className="h-3.5 w-3.5" /> Share
          </ToolbarButton>
          <ToolbarButton onClick={resetLab} title="Reset the board">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ToolbarButton>
          <ToolbarButton onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="ml-auto" title="Command palette (⌘K)">
            ⌘K
          </ToolbarButton>
          <ExportMenu actions={exportActions} />
        </LabToolbar>

        <div ref={stageRef}><ExplanationControls playback={playback} count={A + 2} label="Authored orchestration" /></div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {!activeUc && PRESETS.map((p) => (
            <button key={p.key} aria-pressed={p.key === presetKey} onClick={() => onPreset(p.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${p.key === presetKey ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{p.label}</button>
          ))}
        </div>

        <div className="mb-3 rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wide text-slatey-500">Goal · </span>
          <span className="text-ink">{preset.goal}</span>
        </div>

        <section className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4" aria-label="Current task handoff">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Task {preset.key} · one persistent request</p>
          <p className="mt-1 font-semibold text-ink">{idle ? "Ready to inspect" : done ? "Assembly complete in this authored trace" : progress === 0 ? "Supervisor decomposes the task" : `${preset.agents[progress - 1]?.role}: ${preset.agents[progress - 1]?.task}`}</p>
          <div className="mt-3 flex flex-wrap gap-2">{timeline.map((event, index) => <button key={event.label} type="button" aria-pressed={progress === index} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${progress === index ? "border-primary bg-primary text-white" : "border-line bg-white text-ink"}`} onClick={() => selectEvent(index)}>{index + 1}. {event.label}</button>)}</div>
        </section>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Orchestration */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 rounded-lg border p-3 transition ${idle ? "border-line bg-white" : progress === 0 ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
              <Bot className={`h-5 w-5 ${!idle && progress === 0 ? "text-white" : "text-ink"}`} />
              <div>
                <p className={`text-sm font-semibold ${!idle && progress === 0 ? "text-white" : "text-ink"}`}>Supervisor</p>
                <p className={`text-[11px] ${!idle && progress === 0 ? "text-slate-300" : "text-slatey-500"}`}>{idle ? "Ready to explain" : progress === 0 ? "Selected: goal decomposition" : done ? "Selected: final authored result" : "Selected: agent coordination"}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {preset.agents.map((a, i) => {
                const st = agentStatus(i);
                const Icon = ROLE_ICON[a.role];
                return (
                  <div key={a.role} className={`rounded-lg border p-3 transition ${st === "working" ? "border-amber-400 bg-amber-50" : st === "done" ? "border-emerald-300 bg-white" : "border-line bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><Icon className="h-4 w-4 text-teal-700" /><p className="text-sm font-semibold text-ink">{a.role}</p></div>
                      <Badge tone={st === "done" ? "emerald" : st === "working" ? "amber" : "slate"}>{st === "working" ? "working" : st === "done" ? "completed" : "idle"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slatey-400">{a.task}</p><button type="button" className="mt-2 min-h-11 rounded border border-line px-3 text-xs font-semibold" aria-pressed={progress === i + 1} onClick={() => selectEvent(i + 1)}>Inspect handoff</button>
                    {st === "done" && <p className="mt-1.5 rounded bg-slate-50 px-2 py-1 text-[11px] text-slatey-300">{a.output}</p>}
                  </div>
                );
              })}
            </div>

            <Panel>
              <p className="stat-label mb-2">A2A style coordination <span className="font-normal text-slatey-500">· task lifecycle: assigned → working → completed</span></p>
              {idle ? <p className="text-xs text-slatey-500">No messages yet.</p> : (
                <>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {preset.messages.slice(0, Math.max(0, Math.min(progress, preset.messages.length))).map((m, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => { playback.pause(); setInspected(inspected === i ? null : i); }}
                          className={`flex min-h-11 w-full flex-wrap items-center gap-2 rounded px-2 py-2 text-left transition hover:bg-slate-50 ${inspected === i ? "bg-slate-50 ring-1 ring-teal-500/30" : ""}`}
                          aria-expanded={inspected === i} aria-label={`Inspect A2A frame: ${m.from} to ${m.to}, ${m.label}`}>
                          <span className="text-slatey-500">{m.from}</span><span className="text-teal-700">→</span><span className="text-slatey-500">{m.to}</span>
                          <span className="text-ink">{m.label}</span>
                          <Badge tone="slate" className="ml-auto">{i < progress - 1 ? "inspected handoff" : "current handoff"}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {inspected !== null && frames[inspected] && (
                    <div className="mt-2 rounded-md border border-line bg-slate-900 p-2.5 font-mono text-[10.5px] leading-relaxed">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-teal-600/30 px-1.5 py-0.5 text-teal-200">{frames[inspected].kind}</span>
                        <span className="text-slate-400">{frames[inspected].method}</span>
                        <span className="ml-auto text-slate-500">seq {frames[inspected].seq}</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-slate-200">{JSON.stringify({ from: frames[inspected].from, to: frames[inspected].to, method: frames[inspected].method, params: frames[inspected].params }, null, 2)}</pre>
                    </div>
                  )}
                  <p className="mt-1.5 text-[10px] text-slatey-500">Click a message to inspect its A2A frame, the envelope an agent to agent protocol carries.</p>
                </>
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
              ) : <p className="text-sm text-slatey-500">Choose Assemble or Show all to inspect the authored final result. It is also available in the complete timeline below.</p>}
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Multiagent vs single agent</p>
              <p className="mb-3 text-sm text-slatey-400">These are complete illustrative outcome values. The explanation does not accrue real cost or measure elapsed model time.</p>
              <Compare label="Quality" single={`${preset.single.quality}`} multi={`${preset.multi.quality}`} sVal={preset.single.quality} mVal={preset.multi.quality} betterHigh />
              <Compare label="Cost / run" single={`$${preset.single.costUsd.toFixed(3)}`} multi={`$${preset.multi.costUsd.toFixed(3)}`} sVal={preset.single.costUsd} mVal={preset.multi.costUsd} />
              <Compare label="Latency" single={`${preset.single.latencyS}s`} multi={`${preset.multi.latencyS}s`} sVal={preset.single.latencyS} mVal={preset.multi.latencyS} />
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {h2h.metrics.map((m) => (
                  <div key={m.key} className={`rounded-md border p-1.5 text-center ${m.multiWins ? "border-teal-500/40 bg-teal-50" : "border-line bg-slate-50"}`}>
                    <p className="text-[9px] uppercase tracking-wide text-slatey-500">{m.label}</p>
                    <p className={`text-[11px] font-semibold ${m.multiWins ? "text-teal-700" : "text-slatey-400"}`}>{m.multiWins ? "multi wins" : "baseline wins"}</p>
                    <p className="font-mono text-[9px] text-slatey-400">{m.deltaPct > 0 ? "+" : ""}{Math.round(m.deltaPct)}%</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800">
                <span className="font-semibold">The tradeoff:</span> {h2h.verdict}. That ratio, not the demo, is the decision.
              </div>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Agent timeline <span className="font-normal text-slatey-500">· why multiagent is slower</span></p>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slatey-500"><span>Multiagent (sequential handoff)</span><span className="font-mono">{preset.multi.latencyS}s</span></div>
                  <div className="flex h-6 w-full overflow-hidden rounded-md border border-line">
                    {timeline.map((sp, i) => {
                      const isAgent = sp.label !== "Decompose" && sp.label !== "Assemble";
                      return (
                        <div key={i} title={`${sp.label} · ~${sp.durationS.toFixed(1)}s`}
                          style={{ width: `${(sp.durationS / preset.multi.latencyS) * 100}%` }}
                          className={`flex items-center justify-center border-r border-white/70 text-[9px] font-medium ${isAgent ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                          <span className="truncate px-1">{sp.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slatey-500"><span>Single agent (baseline)</span><span className="font-mono">{preset.single.latencyS}s</span></div>
                  <div className="h-6 w-full rounded-md border border-line bg-slate-50">
                    <div style={{ width: `${(preset.single.latencyS / preset.multi.latencyS) * 100}%` }}
                      className="flex h-full items-center justify-center rounded-l-md bg-slate-300 text-[9px] font-medium text-slate-700">
                      <span className="truncate px-1">one pass</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slatey-500">The agents run in series, each hands off to the next, so their spans add up. That&apos;s the latency you buy for the quality. Per agent durations are an even split of the authored {preset.multi.latencyS}s (illustrative); the sequence is the point.</p>
            </Panel>
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Read the complete timeline and result</summary>
          <EvidenceTable caption="Authored task timeline" headers={["Stage", "Illustrative duration", "Task/output"]} rows={timeline.map((event) => [event.label, `${event.durationS.toFixed(2)} seconds`, preset.agents.find((agent) => agent.role === event.label)?.output ?? (event.label === "Decompose" ? preset.goal : preset.assembled.join(" "))])} />
          <CodeEvidence title="Complete authored result" value={{ task: preset.key, mode: "SIMULATED", single: preset.single, multi: preset.multi, result: preset.assembled }} />
        </details>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Use multiagent orchestration only when the quality lift justifies the cost and latency multiple." lift="Improves output quality for tasks that benefit from decomposition, critique, and role specialization." measure="Quality lift, cost multiple, latency multiple, rework reduction, user acceptance." />
          <InsightCard title="When multiagent is worth it" tone="info">
            Decompose only when the subtasks genuinely differ (research vs critique) and quality matters more than the 2 to 3× cost. For high volume, low stakes calls, a single agent wins. Budget for the harness, not the party trick.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : `The decision is not whether the workflow looks sophisticated. The decision is whether the quality gained per dollar and per second is high enough for the task.`}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Orchestration pattern: a supervisor decomposes the goal and delegates to role specialized agents that coordinate over A2A style messages with explicit lifecycle states (assigned → working → completed).</p>
              <p>The run is authored and deterministic, a scripted supervisor/worker trace with illustrative cost, latency, and quality figures for this task class, not measured from a live model. A real model variant against {LIVE_MODEL} is designed for but not wired today, so the badge stays SIMULATED.</p>
              <p>Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> the model uses deterministic scoring and authored scenarios. Production orchestration would require live model calls, trace storage, routing policies, evaluation data, and failure handling.</p>
        </div>
        <ToastHost />
        <CommandPalette commands={paletteCommands} />
    </InstrumentShell>
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
