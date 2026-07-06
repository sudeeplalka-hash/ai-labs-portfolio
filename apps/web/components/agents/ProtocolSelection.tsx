"use client";

// GAP-07 · Protocol Selection Lab (Collection 2 · toolkit · flagship).
// Six questions about an integration scenario → a recommendation across function
// calling / MCP / A2A / hybrid, with rationale, the runner-up, and the flip
// condition. Showing the runner-up and what flips it is what makes this architecture
// judgment, not a quiz. SIMULATED — deterministic scoring over visible inputs.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Share2, RotateCcw } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, LabToolbar, ToolbarButton, Drawer, toast, ToastHost, CommandPalette, ExportMenu, downloadCsv, downloadJson, parseScenarioJson, pickTextFile, radarVertices, radarAxes, pointsToStr, svgElementToPng, downloadText, type ExportAction, type Command } from "@labs/design-system";
import { PROTOCOL_STATS, PROTOCOL_STATS_AS_OF, GAP07_USE_CASES, LABS } from "@labs/kit";
import { sensitivity as protocolSensitivity, bespokeCost, protocolCost, crossoverConsumers, protocolAffinity, affinityRadar, whyNotOthers, recommendationCard, explainRecommendation, type ProtocolAxis } from "@labs/engines";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { CaseStudy } from "../reviewer/CaseStudy";
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

// Short axis labels for the protocol radar (the six decision dimensions).
const AXES: ProtocolAxis[] = [
  { key: "q1", label: "Tools" },
  { key: "q2", label: "Consumers" },
  { key: "q3", label: "Coordination" },
  { key: "q4", label: "Governance" },
  { key: "q5", label: "Reuse" },
  { key: "q6", label: "Simplicity" },
];
const PROTO_COLOR: Record<PKey, string> = { fc: "#94a3b8", mcp: "#0d9488", a2a: "#6366f1", hybrid: "#f59e0b" };

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
  const router = useRouter();
  const cardRef = useRef<SVGSVGElement>(null);

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
  const crossoverM = crossoverConsumers(systems);

  // Sensitivity: which single answer change would flip the call? (engine)
  const sensitivity = protocolSensitivity(ans, QUESTIONS, (a) => evaluate(a, W).primary);

  // Protocol radar + why-not-others — probe the SAME weighted scorer for each protocol's
  // responsiveness to each decision dimension (engine), then explain the call per rival.
  const scoreOf = (a: Record<string, number>) => evaluate(a, W).scores;
  const affinity = protocolAffinity(scoreOf, AXES);
  const radar = affinityRadar(affinity, AXES);
  const whyNot = whyNotOthers(affinity, ans, AXES, primary);
  const card = recommendationCard(scores, primary, runnerUp, (k) => PROTO[k].label);
  const explanation = explainRecommendation(card, whyNot, sensitivity, (k) => PROTO[k].label);

  // ---- Export suite + command palette ----
  const exportCsv = () => {
    const order: PKey[] = ["fc", "mcp", "a2a", "hybrid"];
    const headers = ["Protocol", "Score", "Fit %", "Role"];
    const rows = order.map((k) => [PROTO[k].label, Number(scores[k].toFixed(2)), Math.round((scores[k] / maxScore) * 100), k === primary ? "Primary" : k === runnerUp ? "Runner-up" : ""]);
    downloadCsv("protocol-scores", headers, rows);
    toast("Protocol scores exported as CSV");
  };
  const exportScenario = () => {
    downloadJson("protocol-scenario", { version: 1, answers: ans, weights: W });
    toast("Scenario exported as JSON");
  };
  const exportCard = () => {
    if (!cardRef.current) { toast("Card isn't ready yet"); return; }
    svgElementToPng(cardRef.current, `protocol-card-${primary}`).then((ok) => toast(ok ? "Recommendation card exported as PNG" : "Couldn't render the card"));
  };
  const explanationText = () => explanation.map((l) => `\u2022 ${l.text}`).join("\n");
  const copyExplanation = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(explanationText()).then(() => toast("Explanation copied"), () => toast("Couldn't copy"));
    else toast("Clipboard unavailable");
  };
  const exportExplanation = () => { downloadText("protocol-explanation", explanationText()); toast("Explanation exported as text"); };
  const importScenario = async () => {
    const text = await pickTextFile();
    if (!text) return;
    try {
      const cfg = parseScenarioJson<{ answers?: Record<string, number>; weights?: Partial<Weights> }>(text);
      if (cfg.answers) setAns(cfg.answers);
      if (cfg.weights) {
        const w = cfg.weights;
        setWeights({ scale: w.scale ?? 1, coordination: w.coordination ?? 1, governance: w.governance ?? 1, simplicity: w.simplicity ?? 1 });
      }
      toast("Scenario imported");
    } catch { toast("That file isn't a valid scenario"); }
  };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Protocol scores as CSV", hint: "All four, with fit %", onSelect: exportCsv },
    { id: "json", label: "Export scenario (JSON)", hint: "Answers + weights, re-importable", onSelect: exportScenario },
    { id: "card", label: "Recommendation card (PNG)", hint: "Shareable image of the call", onSelect: exportCard },
    { id: "explain", label: "Explanation (text)", hint: "Plain-English rationale", onSelect: exportExplanation },
    { id: "import", label: "Import scenario (JSON)…", hint: "Load a saved .json", onSelect: importScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "act-weights", label: "Edit scoring weights", group: "action", keywords: "your model assumptions", run: () => setDrawerOpen(true) },
    { id: "act-share", label: "Copy share link", group: "action", keywords: "permalink url", run: shareScenario },
    { id: "act-reset", label: "Reset weights", group: "action", run: resetWeights },
    { id: "exp-csv", label: "Export protocol scores as CSV", group: "export", run: exportCsv },
    { id: "exp-json", label: "Export scenario as JSON", group: "export", run: exportScenario },
    { id: "exp-import", label: "Import scenario…", group: "export", run: importScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

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
        <CaseStudy problem="Teams argue function-calling vs MCP vs A2A vs hybrid on taste, and either over-engineer a protocol layer they do not need or under-build one they will." approach="Six questions about the integration scenario feed a transparent weighted scorer; the lab returns a recommendation, the runner-up, and the single answer that would flip the call, plus a four-protocol radar and a producers×consumers crossover curve." why="The decision is a function of how many systems, how many consumers, and how much coordination — not religion. Making the scorer editable keeps it honest." metric="The fit scores and the flip conditions: which single input change would change the recommendation." tradeoff="Broadening scope raises value but lowers feasibility; the radar shows function-calling and MCP as mirror opposites on tool breadth — you choose where on that curve to sit." outcome="A protocol recommendation you can defend in a design review, with the runner-up and the exact condition that would flip it — exportable as a one-page card." />

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
          <ToolbarButton onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="ml-auto" title="Command palette (⌘K)">
            ⌘K
          </ToolbarButton>
          <ExportMenu actions={exportActions} />
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
              <div className="mt-3">
                <p className="stat-label mb-1">Why not the others</p>
                <ul className="space-y-1">
                  {whyNot.map((w) => (
                    <li key={w.protocol} className="flex items-start gap-1.5 text-[11px] text-slatey-400">
                      <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: PROTO_COLOR[w.protocol] }} />
                      <span><span className="font-medium text-slatey-300">vs {PROTO[w.protocol].label}:</span> {PROTO[primary].label} leads on {w.axisLabel}.</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Why this call</p>
                <button onClick={copyExplanation} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-400 hover:text-ink">Copy text</button>
              </div>
              <ul className="space-y-1.5 text-xs">
                {explanation.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${l.kind === "verdict" ? "bg-emerald-500" : l.kind === "flip" ? "bg-amber-500" : l.kind === "robust" ? "bg-teal-500" : "bg-slate-300"}`} />
                    <span className={l.kind === "verdict" ? "font-semibold text-ink" : "text-slatey-300"}>{l.text}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Shareable card</p>
                <button onClick={exportCard} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-400 hover:text-ink">Download PNG</button>
              </div>
              {(() => {
                const confColor = card.confidence === "clear" ? "#16a34a" : card.confidence === "close" ? "#d97706" : "#64748b";
                return (
                  <svg ref={cardRef} viewBox="0 0 440 250" className="w-full" role="img" aria-label={`Recommendation card: ${card.primaryLabel}, ${card.confidence} call.`}>
                    <rect x="0" y="0" width="440" height="250" rx="14" fill="#ffffff" stroke="#e4e7eb" />
                    <rect x="0" y="0" width="440" height="5" fill={PROTO_COLOR[card.primary]} />
                    <text x="24" y="40" fontSize="10.5" letterSpacing="1.5" fill="#94a3b8">PROTOCOL RECOMMENDATION</text>
                    <text x="24" y="68" fontSize="23" fontWeight="700" fill="#152433">{card.primaryLabel}</text>
                    <text x="24" y="90" fontSize="11" fontWeight="600" fill={confColor}>&#9679; {card.confidence} call &middot; +{card.margin.toFixed(1)} over {card.runnerUpLabel}</text>
                    {card.bars.map((b, i) => {
                      const y = 112 + i * 29, bw = 240;
                      return (
                        <g key={b.key}>
                          <text x="24" y={y + 11} fontSize="11" fontWeight={b.primary ? 600 : 400} fill={b.primary ? "#152433" : "#64748b"}>{b.label}</text>
                          <rect x="170" y={y + 2} width={bw} height="12" rx="6" fill="#eef1f4" />
                          <rect x="170" y={y + 2} width={Math.max(2, (bw * b.pct) / 100)} height="12" rx="6" fill={PROTO_COLOR[b.key]} opacity={b.primary ? 1 : 0.5} />
                          <text x={170 + bw + 8} y={y + 11} fontSize="10" fill="#94a3b8">{b.pct}%</text>
                        </g>
                      );
                    })}
                    <text x="24" y="240" fontSize="9" fill="#b6bdc6">Protocol Selection Lab &middot; deterministic scoring over your inputs</text>
                  </svg>
                );
              })()}
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
              <p className="stat-label mb-2">Protocol shapes <span className="font-normal text-slatey-500">· responsiveness to each decision dimension</span></p>
              {(() => {
                const cx = 120, cy = 104, R = 66;
                const axesPts = radarAxes(AXES.length, R, cx, cy);
                const labelPts = radarAxes(AXES.length, R + 12, cx, cy);
                const order: PKey[] = ["mcp", "a2a", "hybrid", "fc"];
                return (
                  <svg viewBox="0 0 240 216" className="w-full" role="img" aria-label="Radar comparing how strongly each protocol is favored by each of the six decision dimensions.">
                    {[0.25, 0.5, 0.75, 1].map((f) => <circle key={f} cx={cx} cy={cy} r={R * f} fill="none" stroke={f === 0.5 ? "#cbd5e1" : "#eceff2"} strokeDasharray={f === 0.5 ? "2 2" : undefined} />)}
                    {axesPts.map((pt, i) => <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#eceff2" />)}
                    {order.map((k) => {
                      const pts = radarVertices(radar[k], R, 100, cx, cy);
                      const isP = k === primary;
                      return <polygon key={k} points={pointsToStr(pts)} fill={isP ? `${PROTO_COLOR[k]}22` : "none"} stroke={PROTO_COLOR[k]} strokeWidth={isP ? 2 : 1} strokeOpacity={isP ? 1 : 0.55} strokeDasharray={isP ? undefined : "3 2"} />;
                    })}
                    {labelPts.map((pt, i) => (
                      <text key={i} x={pt.x} y={pt.y} fontSize="7.5" fill="#64748b"
                        textAnchor={pt.x < cx - 4 ? "end" : pt.x > cx + 4 ? "start" : "middle"}
                        dominantBaseline={pt.y < cy ? "auto" : "hanging"}>{AXES[i].label}</text>
                    ))}
                  </svg>
                );
              })()}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slatey-500">
                {(["fc", "mcp", "a2a", "hybrid"] as PKey[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: PROTO_COLOR[k] }} />
                    <span className={k === primary ? "font-semibold text-ink" : ""}>{PROTO[k].label}</span>
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slatey-500">Outer = the dimension favors that protocol; the dashed mid-ring is neutral; inside it the dimension argues against. Moves with your weights.</p>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Producers × consumers</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slatey-400">≈ {systems} systems × {consumers} consumers</span>
                <span className="ml-auto rounded bg-rose-50 px-2 py-1 font-mono text-rose-700">{bespoke} bespoke</span>
                <span className="rounded bg-teal-50 px-2 py-1 font-mono text-teal-700">{proto} protocol</span>
              </div>
              {(() => {
                const maxM = Math.max(12, consumers + 3);
                const maxCost = Math.max(1, bespokeCost(systems, maxM));
                const W = 320, H = 132, padL = 6, padR = 6, padT = 12, padB = 16;
                const plotW = W - padL - padR, plotH = H - padT - padB;
                const X = (m: number) => padL + (m / maxM) * plotW;
                const Y = (cost: number) => padT + (1 - cost / maxCost) * plotH;
                const cross = crossoverM;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img"
                    aria-label={`Integration cost versus number of consumers: bespoke ${bespoke} vs protocol ${proto} at ${consumers} consumers${cross ? `, protocol overtakes at about ${Math.ceil(cross)}` : ""}.`}>
                    <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#cbd2d9" />
                    <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#cbd2d9" />
                    {cross && cross <= maxM && (
                      <g>
                        <line x1={X(cross)} y1={padT} x2={X(cross)} y2={H - padB} stroke="#94a3b8" strokeDasharray="3 3" />
                        <text x={X(cross) + 3} y={padT + 7} fontSize="8" fill="#64748b">crossover ~{Math.ceil(cross)}</text>
                      </g>
                    )}
                    <line x1={X(0)} y1={Y(bespokeCost(systems, 0))} x2={X(maxM)} y2={Y(bespokeCost(systems, maxM))} stroke="#e11d48" strokeWidth="2" />
                    <line x1={X(0)} y1={Y(protocolCost(systems, 0))} x2={X(maxM)} y2={Y(protocolCost(systems, maxM))} stroke="#0d9488" strokeWidth="2" />
                    <line x1={X(consumers)} y1={padT} x2={X(consumers)} y2={H - padB} stroke="#152433" strokeWidth="1" opacity="0.2" />
                    <circle cx={X(consumers)} cy={Y(bespoke)} r="3" fill="#e11d48" />
                    <circle cx={X(consumers)} cy={Y(proto)} r="3" fill="#0d9488" />
                    <text x={W - padR} y={padT + 6} fontSize="8" textAnchor="end" fill="#e11d48">bespoke</text>
                    <text x={W - padR} y={H - padB - 3} fontSize="8" textAnchor="end" fill="#0d9488">protocol</text>
                    <text x={X(consumers)} y={H - 4} fontSize="8" textAnchor="middle" fill="#64748b">you ({consumers})</text>
                  </svg>
                );
              })()}
              <p className="mt-1 text-[11px] text-slatey-500">
                Bespoke point-to-point integrations grow as producers&times;consumers; a shared protocol grows as producers+consumers. {crossoverM ? <>Past ~{Math.ceil(crossoverM)} consumer{Math.ceil(crossoverM) === 1 ? "" : "s"} the protocol wins &mdash; you&apos;re at {consumers}.</> : <>With a single producer, bespoke is already minimal.</>}
              </p>
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
          <OutcomeFrame call="Standardize on the recommended protocol for this integration shape, with the runner-up noted." lift="Avoids the rework of an under- or over-engineered integration layer; the recommendation and the single input that would flip it are explicit." measure="Integration lead time; number of point-to-point connectors; rework and incident tickets 90 days after the decision; re-run the six answers if scope changes." />
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
        <CommandPalette commands={paletteCommands} />
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
