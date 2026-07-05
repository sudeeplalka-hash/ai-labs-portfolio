"use client";

// GAP-07 · Protocol Selection Lab (Collection 2 · toolkit · flagship).
// Six questions about an integration scenario → a recommendation across function
// calling / MCP / A2A / hybrid, with rationale, the runner-up, and the flip
// condition. Showing the runner-up and what flips it is what makes this architecture
// judgment, not a quiz. SIMULATED — deterministic scoring over visible inputs.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Share2, RotateCcw } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, LabToolbar, ToolbarButton, Drawer, toast, ToastHost } from "@labs/design-system";
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

// Editable weights: interpretable multipliers on each signal. All 1.0 reproduces the
// original model exactly; tilting them makes it "your model" (still SIMULATED).
interface Weights { scale: number; coordination: number; governance: number; simplicity: number }
const DEFAULT_WEIGHTS: Weights = { scale: 1, coordination: 1, governance: 1, simplicity: 1 };

function evaluate(a: Record<string, number>, W: Weights) {
  const { q1, q2, q3, q4, q5, q6 } = a;
  const mcp = (q1 * 1.6 + q5 * 1.1) * W.scale + q2 * 1.1 + q4 * 1.0 * W.governance;
  const a2a = q3 * 2.4 * W.coordination + q2 * 0.8;
  const fc = ((2 - q1) * 1.7 + (2 - q3) * 1.6 + (q2 === 0 ? 1.5 : 0) + (q6 === 0 ? 1.0 : 0)) * W.simplicity;
  const hybrid = Math.min(mcp, a2a) * 1.15 + q4 * 0.7 * W.governance;
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

  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const W = weights;
  const edited = JSON.stringify(W) !== JSON.stringify(DEFAULT_WEIGHTS);

  // Restore a shared recommendation (?cfg=) once on mount — answers + weights.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("cfg");
    if (!raw) return;
    try {
      const cfg = JSON.parse(atob(raw)) as { ans?: Record<string, number>; w?: Partial<Weights> };
      if (cfg.ans) setAns(cfg.ans);
      if (cfg.w) { const w = cfg.w; setWeights({ scale: w.scale ?? 1, coordination: w.coordination ?? 1, governance: w.governance ?? 1, simplicity: w.simplicity ?? 1 }); }
    } catch { /* ignore malformed link */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareScenario = () => {
    const cfg = btoa(JSON.stringify({ ans, w: W }));
    const params = new URLSearchParams(window.location.search);
    params.set("cfg", cfg);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied — this exact recommendation"), () => toast("Link is in the address bar"));
    } else { toast("Link is in the address bar"); }
  };
  const resetWeights = () => { setWeights(DEFAULT_WEIGHTS); toast("Weights reset to defaults"); };

  const { scores, primary, runnerUp } = evaluate(ans, W);
  const maxScore = Math.max(...Object.values(scores)) || 1;

  const systems = SYS_COUNT[ans.q1];
  const consumers = CON_COUNT[ans.q2];
  const bespoke = systems * consumers;
  const proto = systems + consumers;

  // Sensitivity: which single answer change would flip the primary recommendation?
  const sensitivity = QUESTIONS.map((qu) => {
    const cur = ans[qu.key];
    for (let i = 0; i < qu.opts.length; i++) {
      if (i === cur) continue;
      const alt = evaluate({ ...ans, [qu.key]: i }, W);
      if (alt.primary !== primary) return { key: qu.key, q: qu.q, to: qu.opts[i], newPrimary: alt.primary };
    }
    return null;
  }).filter((s): s is { key: string; q: string; to: string; newPrimary: PKey } => s !== null);

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

        <LabToolbar>
          <ToolbarButton onClick={() => setDrawerOpen(true)} active={edited} title="Tune how much each signal counts">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Weights
            {edited && <span className="ml-1 rounded bg-white/25 px-1 py-px text-[10px] font-bold uppercase tracking-wide">your model</span>}
          </ToolbarButton>
          <ToolbarButton onClick={shareScenario} title="Copy a link that reproduces this recommendation">
            <Share2 className="h-3.5 w-3.5" /> Share
          </ToolbarButton>
          <ToolbarButton onClick={resetWeights} title="Reset weights to defaults">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ToolbarButton>
        </LabToolbar>

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

            <Panel>
              <p className="stat-label mb-2">What would change the call <span className="font-normal text-slatey-500">· sensitivity</span></p>
              {sensitivity.length === 0 ? (
                <p className="text-xs text-slatey-500">Robust — no single answer change flips the recommendation. That&apos;s a strong signal the call survives the next scale-up.</p>
              ) : (
                <ul className="space-y-1.5">
                  {sensitivity.map((s) => (
                    <li key={s.key} className="rounded-md border border-line p-2 text-xs">
                      <span className="text-slatey-400">{s.q}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1 text-ink">→ answer <span className="font-semibold">&ldquo;{s.to}&rdquo;</span> and it flips to <Badge tone="amber">{PROTO[s.newPrimary].label}</Badge></span>
                    </li>
                  ))}
                </ul>
              )}
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

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Scoring weights">
          <div className="space-y-5">
            <p className="text-xs leading-relaxed text-slatey-400">
              Each slider multiplies how much a signal counts. All at <span className="font-mono">1.0</span> is the default model; tilt them to reflect your context. Editing makes this{" "}
              <span className="font-semibold text-ink">your model</span> — still SIMULATED.
            </p>
            <div className="space-y-3">
              <AssumptionRow label="Scale (systems × consumers → MCP)" value={W.scale} min={0} max={2} step={0.1} fixed={1}
                onChange={(v) => setWeights((p) => ({ ...p, scale: v }))} />
              <AssumptionRow label="Coordination (multi-agent → A2A)" value={W.coordination} min={0} max={2} step={0.1} fixed={1}
                onChange={(v) => setWeights((p) => ({ ...p, coordination: v }))} />
              <AssumptionRow label="Governance (central control → MCP / hybrid)" value={W.governance} min={0} max={2} step={0.1} fixed={1}
                onChange={(v) => setWeights((p) => ({ ...p, governance: v }))} />
              <AssumptionRow label="Simplicity (keep it minimal → function calling)" value={W.simplicity} min={0} max={2} step={0.1} fixed={1}
                onChange={(v) => setWeights((p) => ({ ...p, simplicity: v }))} />
            </div>
            <button onClick={resetWeights} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-400 transition-colors hover:border-primary/40 hover:text-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>
        </Drawer>
        <ToastHost />
      </main>
    </div>
  );
}

function AssumptionRow({
  label, value, min, max, step, suffix, fixed, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; fixed?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slatey-400">{label}</label>
        <span className="font-mono text-xs font-semibold text-ink">{fixed !== undefined ? value.toFixed(fixed) : value}{suffix ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-teal-600" />
    </div>
  );
}
