"use client";

// GAP-05 · Context & Memory Engineering (Collection 2 · toolkit).
// One task, four context strategies side by side — full dump / summarize / compress
// / sub-agent handoff — on cost, fidelity, and failure risk as the conversation
// grows, plus a memory view of what survives across turns. Context strategy is a
// cost-fidelity dial; set it per use case, not per platform. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";

const WINDOW = 24; // k tokens working budget (small on purpose, to make overflow visible)
type SKey = "full" | "sum" | "comp" | "handoff";
const STRATS: { key: SKey; label: string; note: string }[] = [
  { key: "full", label: "Full dump", note: "Send the whole history every call." },
  { key: "sum", label: "Summarize", note: "Rolling summary + last two turns." },
  { key: "comp", label: "Compress", note: "Semantic compression of history." },
  { key: "handoff", label: "Sub-agent handoff", note: "Only the current sub-task's brief." },
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
  if (key === "comp") return fact.key || fact.f !== "Member prefers email";
  return fact.rel; // handoff keeps only task-relevant
}

export function ContextMemory() {
  const [t, setT] = useState(6);
  const [view, setView] = useState<"compare" | "memory">("compare");
  const rows = STRATS.map((s) => ({ ...s, ...metrics(s.key, t) }));
  const maxCost = Math.max(...rows.map((r) => r.costPer1k));
  const introduced = FACTS.filter((f) => f.t <= t);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-05</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Context &amp; Memory Engineering</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            The same multi-turn task, four ways to carry the context. Drag the turns up and watch full-dump&apos;s cost and
            overflow risk climb while the others trade a little fidelity for a lot of headroom.
          </p>
        </div>

        <Panel className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[240px] flex-1">
              <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">Conversation turns</label><span className="font-mono text-xs font-semibold text-ink">{t}</span></div>
              <input type="range" min={1} max={10} step={1} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full accent-teal-600" />
            </div>
            <div className="flex gap-1.5">
              {(["compare", "memory"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${v === view ? "border-teal-600 bg-teal-600 text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{v}</button>
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
                    <td className="text-ink">{f.f} <span className="text-[10px] text-slatey-500">· t{f.t}</span></td>
                    {STRATS.map((s) => (
                      <td key={s.key} className="text-center">
                        {retained(s.key, f, t) ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <X className="mx-auto h-4 w-4 text-rose-500" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-slatey-500">Full dump keeps everything until the window truncates the oldest; summarize/compress trade minor facts for headroom; handoff keeps only what the current sub-task needs.</p>
          </Panel>
        )}

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="It's a dial, not a default" tone="info">
            Full dump is right for a short, high-stakes exchange; summarize or compress for a long assistant thread; handoff
            when specialized sub-agents each need only their slice. The mistake is picking one and calling it the platform standard.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> Context strategy is a cost-fidelity dial. I set it per use case, not per platform.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Per strategy, context/call grows differently with turns (full = linear, summarize = ~flat, compress = log, handoff = flat-small). Cost ≈ context × input price; fidelity and risk are modeled per strategy; overflow triggers when context exceeds a {WINDOW}k working window. Memory retention applies each policy&apos;s eviction rule to a fixed fact set.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> token sizes and fidelity are illustrative; real numbers depend on the model, the summarizer, and the task. It shows the trade-offs&apos; shape, not a benchmarked comparison.</p>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, val, pct, tone, sub }: { label: string; val: string; pct: number; tone: string; sub?: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{label}</span><span className="font-mono font-semibold text-ink">{val}</span></div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>
      {sub && <p className="mt-0.5 text-[10px] text-slatey-500">{sub}</p>}
    </div>
  );
}
