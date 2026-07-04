"use client";

// GAP-07 · Protocol Selection Lab (Collection 2 · toolkit · flagship).
// Six questions about an integration scenario → a recommendation across function
// calling / MCP / A2A / hybrid, with rationale, the runner-up, and the flip
// condition. Showing the runner-up and what flips it is what makes this architecture
// judgment, not a quiz. SIMULATED — deterministic scoring over visible inputs.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { PROTOCOL_STATS, PROTOCOL_STATS_AS_OF, GAP07_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type PKey = "fc" | "mcp" | "a2a" | "hybrid";
const PROTO: Record<PKey, { label: string; blurb: string; rationale: string }> = {
  fc: { label: "Function calling", blurb: "The model calls a handful of typed functions directly.", rationale: "Small surface — a few tools, one consumer, one agent. A protocol layer is overhead you don't need yet." },
  mcp: { label: "MCP", blurb: "One shared protocol for tool/resource access across many systems and consumers.", rationale: "Many systems and many consumers: bespoke integrations explode as N×M. One MCP contract makes it N+M." },
  a2a: { label: "A2A", blurb: "A protocol for coordination between independent agents.", rationale: "The work is coordination between agents, not just tool calls — A2A gives them a shared task and message contract." },
  hybrid: { label: "MCP + A2A hybrid", blurb: "MCP vertically for tools, A2A horizontally for agents — the 2026 two-layer stack.", rationale: "You have both: many tools to expose AND agents that must coordinate, under central governance. Use each on its axis." },
};
const DRIVER: Record<PKey, string> = {
  fc: "you drop to ~3 tools and a single consumer",
  mcp: "you expose more systems to more consumers",
  a2a: "agents need to coordinate, not just call tools",
  hybrid: "you add multi-agent coordination on top of the tool sprawl",
};

const QUESTIONS: { key: string; q: string; opts: string[] }[] = [
  { key: "q1", q: "How many systems / tools to expose?", opts: ["1–3 tools", "4–10 systems", "10+ systems"] },
  { key: "q2", q: "How many agent consumers?", opts: ["One", "A few teams", "Many teams / org-wide"] },
  { key: "q3", q: "Coordination needs?", opts: ["One agent does it", "Some handoffs", "Many agents collaborate"] },
  { key: "q4", q: "Governance / central control?", opts: ["Low", "Moderate", "High — central policy + audit"] },
  { key: "q5", q: "Reuse across teams?", opts: ["One-off", "Shared in a team", "Org-wide platform"] },
  { key: "q6", q: "Simplicity sensitivity?", opts: ["Keep it minimal", "Moderate", "Complexity is fine"] },
];

function evaluate(a: Record<string, number>) {
  const { q1, q2, q3, q4, q5, q6 } = a;
  const mcp = q1 * 1.6 + q2 * 1.1 + q4 * 1.0 + q5 * 1.1;
  const a2a = q3 * 2.4 + q2 * 0.8;
  const fc = (2 - q1) * 1.7 + (2 - q3) * 1.6 + (q2 === 0 ? 1.5 : 0) + (q6 === 0 ? 1.0 : 0);
  const hybrid = Math.min(mcp, a2a) * 1.15 + q4 * 0.7;
  const scores: Record<PKey, number> = { fc, mcp, a2a, hybrid };
  const ranked = (Object.entries(scores) as [PKey, number][]).sort((x, y) => y[1] - x[1]);
  return { scores, primary: ranked[0][0], runnerUp: ranked[1][0] };
}

const SYS_COUNT = [2, 7, 15];
const CON_COUNT = [1, 4, 12];

export function ProtocolSelection() {
  const [ans, setAns] = useState<Record<string, number>>({ q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1 });
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP07_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP07_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP07_USE_CASES.find((u) => u.id === id) : null;
    setAns(uc ? uc.payload.answers : { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1 });
  };
  const setAnswer = (key: string, i: number) => { setAns((a) => ({ ...a, [key]: i })); setActiveUcId(null); };
  const { scores, primary, runnerUp } = evaluate(ans);
  const maxScore = Math.max(...Object.values(scores)) || 1;

  const systems = SYS_COUNT[ans.q1];
  const consumers = CON_COUNT[ans.q2];
  const bespoke = systems * consumers;
  const proto = systems + consumers;

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-07</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Protocol Selection Lab</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02", asOf: PROTOCOL_STATS_AS_OF }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            The question every enterprise architect is asking in 2026. Describe the integration and get a call — with the
            runner-up and the condition that flips it, because that&apos;s the part that&apos;s actually judgment.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROTOCOL_STATS.map((s) => <Badge key={s.key} tone="slate">{s.value} {s.label}</Badge>)}
          </div>
        </div>

        <UseCaseRail useCases={GAP07_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Questions */}
          <Panel className="space-y-3">
            {QUESTIONS.map((qu) => (
              <div key={qu.key}>
                <p className="mb-1 text-xs font-medium text-slatey-400">{qu.q}</p>
                <div className="flex gap-1">
                  {qu.opts.map((o, i) => (
                    <button key={o} onClick={() => setAnswer(qu.key, i)}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${ans[qu.key] === i ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </Panel>

          {/* Recommendation */}
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between">
                <p className="stat-label">Recommendation</p>
                <Badge tone="emerald">{PROTO[primary].label}</Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">{PROTO[primary].label}</p>
              <p className="mt-0.5 text-xs text-slatey-400">{PROTO[primary].blurb}</p>
              <p className="mt-2 text-sm leading-relaxed text-slatey-300">{PROTO[primary].rationale}</p>

              <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span className="font-semibold">Runner-up: {PROTO[runnerUp].label}.</span> Flips to primary if {DRIVER[runnerUp]}.
              </div>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Fit scores</p>
              <div className="space-y-2">
                {(Object.keys(PROTO) as PKey[]).map((k) => (
                  <div key={k}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className={k === primary ? "font-semibold text-ink" : "text-slatey-400"}>{PROTO[k].label}</span><span className="font-mono text-slatey-500">{scores[k].toFixed(1)}</span></div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${k === primary ? "bg-emerald-500" : k === runnerUp ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${(scores[k] / maxScore) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Producers × consumers</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slatey-400">≈ {systems} systems × {consumers} consumers</span>
                <span className="ml-auto rounded bg-rose-50 px-2 py-1 font-mono text-rose-700">{bespoke} bespoke</span>
                <span className="rounded bg-teal-50 px-2 py-1 font-mono text-teal-700">{proto} protocol</span>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="Why the runner-up matters" tone="info">
            A recommendation without a runner-up is a quiz answer. The flip condition tells leadership exactly what would
            change the architecture — so the decision survives the next scale-up instead of being re-litigated.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "The protocol isn't the decision — the number of producers and consumers is. Count those first."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each protocol scores against the six answers: function calling rewards small surface + single consumer; MCP rewards systems × consumers + governance + reuse; A2A rewards multi-agent coordination; hybrid tops only when MCP and A2A signals are both strong.</p>
              <p>Primary = top score, runner-up = second; the flip condition names the runner-up&apos;s dominant driver. Protocol-landscape stats are dated config (as of {PROTOCOL_STATS_AS_OF}).</p>
              <p>Stack: Next.js (static) + shared design system; client-side only.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> weights are heuristic judgment, not a benchmarked model; real selection also weighs vendor support, team skill, and existing investments. It structures the call and its sensitivity, not a procurement decision.</p>
        </div>
      </main>
    </div>
  );
}
