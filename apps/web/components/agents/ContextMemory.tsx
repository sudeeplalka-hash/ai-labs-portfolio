"use client";

// GAP-05 · Context & Memory Engineering (Collection 2 · toolkit).
// One task, four context strategies side by side, full dump / summarize / compress
// / subagent handoff, on cost, fidelity, and failure risk as the conversation
// grows, plus a memory view of what survives across turns. Context strategy is a
// cost-fidelity dial; set it per use case, not per platform. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { ChangeReceipt, EvidenceTable, signed } from "./AgentExperience";
import { GAP05_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

const WINDOW = 24; // k tokens working budget (small on purpose, to make overflow visible)
type SKey = "full" | "sum" | "comp" | "handoff";
const STRATS: { key: SKey; label: string; note: string }[] = [
  { key: "full", label: "Full dump", note: "Send the whole history every call." },
  { key: "sum", label: "Summarize", note: "Rolling summary + last two turns." },
  { key: "comp", label: "Compress", note: "Semantic compression of history." },
  { key: "handoff", label: "Subagent handoff", note: "Only the current subtask's brief." },
];

function metrics(key: SKey, t: number) {
  let ctx: number, fidelity: number, risk: number, riskLabel: string;
  if (key === "full") { ctx = 4 + t * 3; fidelity = ctx <= WINDOW ? 100 : Math.round((WINDOW / ctx) * 100); risk = Math.max(0, Math.min(100, Math.round(((ctx - WINDOW * 0.7) / (WINDOW * 0.3)) * 100))); riskLabel = "overflow"; }
  else if (key === "sum") { ctx = 6 + Math.min(t, 2) * 3; fidelity = Math.max(60, 82 - t); risk = Math.min(60, t * 4); riskLabel = "info loss"; }
  else if (key === "comp") { ctx = 7 + Math.round(2 * Math.log2(t + 1)); fidelity = Math.max(70, 90 - Math.round(t * 0.7)); risk = Math.min(40, t * 2); riskLabel = "detail loss"; }
  else { ctx = 7; fidelity = Math.max(58, 76 - t); risk = Math.min(75, t * 5); riskLabel = "coordination"; }
  return { ctx, fidelity, risk, riskLabel, costPer1k: ctx * 3 }; // $/1k calls at ~$3/1M input tokens
}

interface Fact { t: number; f: string; key: boolean; rel: boolean }
const FACTS: Fact[] = [
  { t: 1, f: "Member acct ACCT-0021", key: true, rel: true },
  { t: 1, f: "Disputed amount $214.50", key: true, rel: true },
  { t: 2, f: "Reason: not recognized", key: true, rel: true },
  { t: 2, f: "Policy: 30-day SLA", key: true, rel: true },
  { t: 3, f: "Prior dispute last year", key: false, rel: false },
  { t: 4, f: "Member prefers email", key: false, rel: false },
];

function retained(key: SKey, fact: Fact, t: number): boolean {
  if (fact.t > t) return false; // not introduced yet
  if (key === "full") { const ctx = 4 + t * 3; const dropped = ctx > WINDOW ? Math.ceil((ctx - WINDOW) / 3) : 0; return fact.t > dropped; }
  if (key === "sum") return fact.key;
  if (key === "comp") return fact.key || fact.rel;
  return fact.rel; // handoff keeps only task-relevant
}

export function ContextMemory() {
  const [t, setT] = useState(6);
  const [baselineTurn, setBaselineTurn] = useState(6);
  const [view, setView] = useState<"compare" | "memory">("compare");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP05_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP05_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP05_USE_CASES.find((u) => u.id === id) : null;
    if (uc) { setT(uc.payload.turns); setBaselineTurn(uc.payload.turns); setView(uc.payload.view); } else { setT(6); setBaselineTurn(6); setView("compare"); }
  };
  const facts: Fact[] = activeUc ? activeUc.payload.facts : FACTS;
  const rows = STRATS.map((s) => ({ ...s, ...metrics(s.key, t) }));
  const maxCost = Math.max(...rows.map((r) => r.costPer1k));
  const introduced = facts.filter((f) => f.t <= t);
  const fullLost = introduced.filter((fact) => !retained("full", fact, t));
  const changedFacts = STRATS.flatMap((strategy) => facts.filter((fact) => fact.t <= Math.min(t, baselineTurn) && retained(strategy.key, fact, t) !== retained(strategy.key, fact, baselineTurn)).map((fact) => `${strategy.label}: ${fact.f} is now ${retained(strategy.key, fact, t) ? "retained" : "lost"}.`));

  return (
    <InstrumentShell title="Context and Memory Strategy Evaluator" eyebrow="GAP-05 · Agent architecture" description="Compare the cost of keeping context with the consequences of losing it."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Context and Memory Strategy Evaluator" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Deterministic memory and cost model" note="Illustrative results support review; they do not establish a production outcome." />}>
        <DecisionSummary title={fullLost.length ? `${fullLost.length} known facts lost from the full history at turn ${t}` : `All introduced facts fit in the full history at turn ${t}`} explanation="Fidelity and risk are illustrative model scores. Inspect the actual retention rule before choosing the lower-cost strategy." metrics={[{ label: "Working context budget", value: `${WINDOW}k tokens` }, { label: "Full history", value: `${rows[0].ctx}k tokens` }, { label: "Facts introduced", value: introduced.length }]} />
        <UseCaseRail useCases={GAP05_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="A naive full history approach may preserve context but can become expensive and fragile. Summarization, compression, and handoff patterns reduce load but introduce fidelity tradeoffs, and the right answer depends on the business task and the risk of losing detail." approach="The evaluator compares full context, summarization, compression, and subagent handoff across the same growing task. It shows how token load, overflow risk, and fidelity change as conversations lengthen." why="This connects context design to unit economics, reliability, accuracy, user experience, and operating scalability." metric="Tokens and cost per call versus answer fidelity, by strategy." tradeoff="Higher fidelity costs tokens; aggressive compression eventually hurts the answer." outcome="The context strategy to run per use case, with the point where compression starts to hurt." />

        <ChangeReceipt title={`Compared with turn ${baselineTurn}`} onPin={() => setBaselineTurn(t)}>
          <p>Turn change: {signed(t - baselineTurn)}. Compare the same supplied facts; new facts are not counted as memory losses.</p>
          {changedFacts.length ? <ul className="mt-2 list-disc pl-5">{changedFacts.map((change) => <li key={change}>{change}</li>)}</ul> : <p>No previously introduced fact changed its retention state.</p>}
        </ChangeReceipt>
        <Panel className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">Conversation turns</label><span className="font-mono text-xs font-semibold text-ink">{t}</span></div>
              <input type="range" aria-label="Conversation turns" min={1} max={10} step={1} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full accent-teal-600" />
            </div>
            <div className="flex gap-1.5">
              {(["compare", "memory"] as const).map((v) => (
                <button key={v} aria-pressed={v === view} onClick={() => setView(v)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${v === view ? "border-teal-600 bg-teal-600 text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{v}</button>
              ))}
            </div>
          </div>
        </Panel>

        {view === "compare" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {rows.map((r) => (
              <div key={r.key} className="rounded-xl border border-line bg-white p-4 shadow-card">
                <p className="text-sm font-semibold text-ink">{r.label}</p>
                <p className="mt-0.5 text-[11px] text-slatey-500">{r.note}</p>
                <div className="mt-3 space-y-2">
                  <Metric label="Context / call" val={`${r.ctx}k tok`} pct={(r.costPer1k / maxCost) * 100} tone="bg-primary" sub={`$${r.costPer1k}/1k calls`} />
                  <Metric label="Fidelity" val={`${r.fidelity}%`} pct={r.fidelity} tone="bg-emerald-500" />
                  <Metric label={`Risk · ${r.riskLabel}`} val={`${r.risk}%`} pct={r.risk} tone={r.risk > 60 ? "bg-rose-500" : "bg-amber-400"} />
                </div>
                {r.key === "full" && r.ctx > WINDOW && <Badge tone="rose" className="mt-2">exceeds {WINDOW}k window</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <Panel className="overflow-x-auto">
            <p className="stat-label mb-2">What survives at turn {t}</p>
            <table className="data-table">
              <thead><tr><th>Fact (introduced)</th>{STRATS.map((s) => <th key={s.key} className="text-center">{s.label}</th>)}</tr></thead>
              <tbody>
                {introduced.map((f) => (
                  <tr key={f.f}>
                    <th scope="row" className="text-left font-medium text-ink">{f.f} <span className="text-[10px] text-slatey-500">· t{f.t}</span></th>
                    {STRATS.map((s) => (
                      <td key={s.key} className="text-center">
                        {retained(s.key, f, t) ? <Check aria-hidden="true" className="mx-auto h-4 w-4 text-emerald-600" /> : <X aria-hidden="true" className="mx-auto h-4 w-4 text-rose-500" />}<span className="text-xs">{retained(s.key, f, t) ? "Retained" : "Lost"}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-slatey-500">Full dump keeps everything until the window truncates the oldest; summarize/compress trade minor facts for headroom; handoff keeps only what the current subtask needs.</p>
          </Panel>
        )}

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Compare exact strategy values</summary><EvidenceTable caption={`Strategy values at turn ${t}`} headers={["Strategy", "Context", "Cost / 1k calls", "Fidelity (modeled)", "Risk (modeled)"]} rows={rows.map((row) => [row.label, `${row.ctx}k tokens`, `$${row.costPer1k}`, `${row.fidelity}%`, `${row.risk}% ${row.riskLabel}`])} /></details>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Select context strategy by use case, not by platform default." lift="Reduces runaway token cost and overflow risk while preserving enough fidelity for the task." measure="Token cost per task, overflow events, answer quality, context recall, user rework." />
          <InsightCard title="It's a dial, not a default" tone="info">
            Full dump is right for a short, high-stakes exchange; summarize or compress for a long assistant thread; handoff
            when specialized subagents each need only their slice. The mistake is picking one and calling it the platform standard.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Context strategy is a cost and fidelity decision. Set it based on the workflow, not enthusiasm for larger windows."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Per strategy, context/call grows differently with turns (full = linear, summarize = ~flat, compress = log, handoff = flat small). Cost ≈ context × input price; fidelity and risk are modeled per strategy; overflow triggers when context exceeds a {WINDOW}k working window. Memory retention applies each policy&apos;s eviction rule to a fixed fact set.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a modeled comparison. Production use would require actual conversation traces, task level evaluation, memory policies, privacy controls, and retention rules.</p>
        </div>
    </InstrumentShell>
  );
}

function Metric({ label, val, pct, tone, sub }: { label: string; val: string; pct: number; tone: string; sub?: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{label}</span><span className="font-mono font-semibold text-ink">{val}</span></div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
      {sub && <p className="mt-0.5 text-[10px] text-slatey-500">{sub}</p>}
    </div>
  );
}
