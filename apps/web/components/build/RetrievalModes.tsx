"use client";

// Phase 3 — retrieval substrate UI. Mode selector + governed re-rank + mode
// comparison + trace-by-mode + vector-index readiness + honest simulation
// boundary. Persists the chosen mode (and refreshes the Build contract) in live
// mode. Leaves the live-lab BM25 pipeline untouched.

import { useMemo, useState } from "react";
import { useProgram, buildBuildOutputContract } from "@labs/program-core";
import { Panel, SectionHeader, Badge, InsightCard, cn } from "@labs/design-system";
import { Layers, GitCompare, ListOrdered, Boxes, ShieldCheck, Info } from "lucide-react";
import {
  RETRIEVAL_MODES, runRetrieval, compareModes, vectorIndexReadiness, SAMPLE_QUERY,
  type RetrievalMode, type ModeResult,
} from "@rag/lib/live-lab/retrievalModes";

const rdTone = (s: string): "emerald" | "amber" | "rose" | "slate" =>
  s === "Ready" ? "emerald" : s === "Partial" ? "amber" : s === "Missing" ? "rose" : "slate";

export function RetrievalModes() {
  const { state, mode: appMode, hydrated, update } = useProgram();
  // Mode-aware: demo uses the curated sample's exclusions, never the live list.
  const blocked = (appMode === "demo" ? undefined : state.data?.handoff?.blockedSources) ?? ["Raw customer PII export"];
  const [sel, setSel] = useState<RetrievalMode>((state.rag?.retrievalMode as RetrievalMode) ?? "lexical");

  const result = useMemo(() => runRetrieval(sel, blocked), [sel, blocked.join("|")]);
  const comparison = useMemo(() => compareModes(blocked), [blocked.join("|")]);
  const traces = useMemo(() => RETRIEVAL_MODES.map((m) => runRetrieval(m.id, blocked)), [blocked.join("|")]);
  const readiness = useMemo(() => vectorIndexReadiness({
    dataReadinessScore: state.data?.handoff?.dataReadinessScore ?? state.data?.readinessScore,
    blockedCount: blocked.length, hasHandoff: !!state.data?.handoff,
  }), [state.data]);

  const pickMode = (id: RetrievalMode) => {
    setSel(id);
    if (!hydrated || appMode === "demo") return;
    update((d) => { d.rag = { ...(d.rag ?? {}), retrievalMode: id }; d.rag.contract = buildBuildOutputContract(d); });
  };

  const selMeta = RETRIEVAL_MODES.find((m) => m.id === sel)!;

  return (
    <div className="space-y-6">
      {/* Selector + BM25 baseline note */}
      <Panel>
        <SectionHeader eyebrow="Retrieval substrate" title="Retrieval mode" icon={Layers}
          description="BM25 stays the explainable baseline. Vector, hybrid, and governed re-rank build on the same retriever seam." />
        <div className="flex flex-wrap gap-2">
          {RETRIEVAL_MODES.map((m) => (
            <button key={m.id} onClick={() => pickMode(m.id)} aria-pressed={sel === m.id}
              className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", sel === m.id ? "border-ink bg-ink text-white" : "border-line bg-white text-slatey-300 hover:border-slatey-500 hover:text-ink")}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slatey-400">{selMeta.desc}</p>
        <div className="mt-3 rounded-lg border border-line bg-slate-50/60 p-3 text-[12px] leading-relaxed text-slatey-400">
          <b className="text-slatey-300">Lexical BM25 baseline —</b> strong when queries share important terms with source text: fast, explainable, and a useful floor, but it misses semantically similar evidence when wording differs. Query: <span className="italic">&ldquo;{SAMPLE_QUERY}&rdquo;</span>
        </div>
      </Panel>

      {/* Ranked evidence for selected mode */}
      <Panel>
        <SectionHeader eyebrow={selMeta.label} title="Ranked evidence" icon={ListOrdered}
          description={sel === "hybrid-rerank" ? "Re-ranked by source authority, freshness, metadata, and citation readiness — with Data-handoff exclusions applied." : "Top evidence for the selected retrieval mode."} />
        <div className="space-y-2">
          {result.results.map((r) => (
            <div key={r.id} className={cn("rounded-lg border p-3", r.excluded ? "border-rose-300 bg-rose-50/40" : "border-line bg-white")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {r.excluded ? <Badge tone="rose">Excluded</Badge> : <span className="font-mono text-[11px] text-slatey-400">#{r.rank}{r.prevRank && r.prevRank !== r.rank ? ` (was #${r.prevRank})` : ""}</span>}
                  <span className="text-sm font-semibold text-ink">{r.source}</span>
                  {!r.fresh && !r.excluded && <Badge tone="amber">stale</Badge>}
                  {!r.citationReady && !r.excluded && <Badge tone="slate">no citation meta</Badge>}
                </div>
                <div className="flex gap-3 text-[11px] text-slatey-400">
                  <span>lex {r.lexScore}</span><span>vec {r.vecScore}</span><span>hybrid {r.hybridScore}</span>
                  {!r.excluded && <span className="font-semibold text-ink">final {r.finalScore}</span>}
                </div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slatey-400">{r.text}</p>
              {r.excluded ? <p className="mt-1 text-[11px] font-medium text-rose-600">{r.excludedReason}</p>
                : r.rerankReason ? <p className="mt-1 text-[11px] text-slatey-500">Re-rank: {r.rerankReason}</p> : null}
            </div>
          ))}
        </div>
      </Panel>

      {/* Phase F — rank slopegraph: the story of re-ranking, drawn */}
      <Panel>
        <SectionHeader eyebrow="Rank movement" title="How each mode re-orders the evidence" icon={GitCompare}
          description="Follow a source across the four modes. Rising lines gain authority under governed re-rank; falling lines lose it; blocked sources drop to the exclusion gutter." />
        <RankSlopegraph traces={traces} />
      </Panel>

      {/* Mode comparison */}
      <Panel className="overflow-x-auto">
        <SectionHeader eyebrow="Side by side" title="Retrieval mode comparison" icon={GitCompare} />
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
            <th className="py-2 pr-3 font-semibold">Mode</th><th className="py-2 pr-3 font-semibold">Top evidence</th><th className="py-2 pr-3 font-semibold">Strength</th><th className="py-2 pr-3 font-semibold">Risk</th><th className="py-2 pr-3 font-semibold text-right">Latency</th><th className="py-2 font-semibold text-right">Cost</th>
          </tr></thead>
          <tbody>{comparison.map((c) => (
            <tr key={c.mode} className={cn("border-b border-line/60", c.mode === sel && "bg-primary/[0.04]")}>
              <td className="py-2 pr-3 font-medium text-ink">{c.label}</td>
              <td className="py-2 pr-3 text-slatey-300">{c.topSource}</td>
              <td className="py-2 pr-3 text-slatey-400">{c.strength}</td>
              <td className="py-2 pr-3 text-slatey-400">{c.risk}</td>
              <td className="py-2 pr-3 text-right text-slatey-400">{c.latencyMs} ms</td>
              <td className="py-2 text-right text-slatey-400">${c.cost.toFixed(3)}</td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>

      {/* Trace comparison */}
      <Panel className="overflow-x-auto">
        <SectionHeader eyebrow="Trace comparison by retrieval mode" title="How mode changes the pipeline" icon={GitCompare}
          description="Changing retrieval mode changes which evidence reaches the answer engine — and its citation quality, faithfulness, risk, latency, and cost." />
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
            <th className="py-2 pr-3 font-semibold">Mode</th><th className="py-2 pr-3 font-semibold text-right">Citations</th><th className="py-2 pr-3 font-semibold text-right">Faithfulness</th><th className="py-2 pr-3 font-semibold text-right">Hallucination</th><th className="py-2 pr-3 font-semibold text-right">Quality</th><th className="py-2 pr-3 font-semibold text-right">Latency</th><th className="py-2 font-semibold text-right">Cost</th>
          </tr></thead>
          <tbody>{traces.map((t) => (
            <tr key={t.mode} className={cn("border-b border-line/60", t.mode === sel && "bg-primary/[0.04]")}>
              <td className="py-2 pr-3 font-medium text-ink">{RETRIEVAL_MODES.find((m) => m.id === t.mode)!.label}</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{t.metrics.citationAccuracy}%</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{t.metrics.faithfulness}%</td>
              <td className="py-2 pr-3 text-right text-slatey-300">{t.metrics.hallucinationRisk}%</td>
              <td className="py-2 pr-3 text-right font-semibold text-ink">{t.metrics.quality}</td>
              <td className="py-2 pr-3 text-right text-slatey-400">{t.metrics.latencyMs} ms</td>
              <td className="py-2 text-right text-slatey-400">${t.metrics.cost.toFixed(3)}</td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>

      {/* Vector index readiness */}
      <Panel>
        <SectionHeader eyebrow="Production readiness" title="Vector index readiness" icon={Boxes}
          action={<Badge tone={rdTone(readiness.readiness)}>{readiness.readiness}</Badge>} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {readiness.fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2">
              <span className="text-[12px] text-slatey-300">{f.label}</span>
              <Badge tone={rdTone(f.status)}>{f.status}</Badge>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slatey-400"><b className="text-slatey-300">Recommendation:</b> {readiness.recommendation}</p>
      </Panel>

      {/* Simulation boundary + what this demonstrates */}
      <Panel>
        <SectionHeader eyebrow="Retrieval simulation boundary" title="What&rsquo;s real vs modeled here" icon={Info} />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-300">
          This portfolio demo runs locally and needs no hosted vector database. BM25 is a real lexical baseline. Vector and hybrid
          retrieval use deterministic local representations to demonstrate ranking tradeoffs and lifecycle handoffs. In production, the
          same retriever seam could be backed by OpenAI, MiniLM, Voyage, or Cohere embeddings over Pinecone, Weaviate, pgvector,
          Milvus, or Elasticsearch.
        </p>
        <p className="mt-4 stat-label">What this retrieval layer demonstrates</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard tone="info" title="Lexical baseline">BM25 as an explainable floor — and a clear view of where it fails.</InsightCard>
          <InsightCard tone="info" title="Semantic retrieval">Local vector similarity handles wording variation the baseline misses.</InsightCard>
          <InsightCard tone="success" title="Hybrid search">Lexical + vector fusion balances precision and recall.</InsightCard>
          <InsightCard tone="success" title="Governance-aware re-rank">Authority, freshness, metadata, citations, and Data-handoff exclusions reorder evidence.</InsightCard>
          <InsightCard tone="warn" title="Traceable quality impact">Every mode shows its effect on citation quality, faithfulness, risk, latency, and cost.</InsightCard>
        </div>
      </Panel>
    </div>
  );
}

// ---- Phase F · rank slopegraph -------------------------------------------------
// One line per source across the four retrieval modes. y = rank (1 is best);
// sources below the top-4 cutoff sit in the "not retrieved" band; blocked
// sources drop to the exclusion gutter. Click a line or label to highlight it.
function RankSlopegraph({ traces }: { traces: ModeResult[] }) {
  const [focus, setFocus] = useState<string | null>(null);

  const sources = Array.from(new Set(traces.flatMap((t) => t.results.map((r) => r.source))));
  // Per source, per mode: rank 1..4, "cut" (below top-4) or "excluded".
  const series = sources.map((src) => ({
    source: src,
    points: traces.map((t) => {
      const r = t.results.find((x) => x.source === src);
      if (!r) return "cut" as const;
      if (r.excluded) return "excluded" as const;
      return r.rank;
    }),
  }));

  const W = 680, H = 250, padL = 40, padR = 190, padT = 20;
  const rowH = 30;
  const yFor = (p: number | "cut" | "excluded") =>
    p === "excluded" ? padT + 5.6 * rowH : p === "cut" ? padT + 4.4 * rowH : padT + (p - 1) * rowH;
  const xFor = (i: number) => padL + (i * (W - padL - padR)) / (traces.length - 1);

  const colorFor = (pts: (number | "cut" | "excluded")[]): string => {
    if (pts.includes("excluded")) return "#e11d48";
    const first = pts[0], last = pts[pts.length - 1];
    if (typeof first === "number" && typeof last === "number") {
      if (last < first) return "#059669";
      if (last > first) return "#d97706";
    }
    if (first === "cut" && typeof last === "number") return "#059669";
    if (typeof first === "number" && last === "cut") return "#d97706";
    return "#64748b";
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px]" role="img" aria-label="Evidence rank by retrieval mode">
        {/* rank rows */}
        {[1, 2, 3, 4].map((r) => (
          <g key={r}>
            <line x1={padL} y1={yFor(r)} x2={W - padR} y2={yFor(r)} stroke="#f1f5f9" />
            <text x={padL - 8} y={yFor(r) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">#{r}</text>
          </g>
        ))}
        <text x={padL - 8} y={yFor("cut") + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">cut</text>
        <line x1={padL} y1={yFor("cut")} x2={W - padR} y2={yFor("cut")} stroke="#f1f5f9" strokeDasharray="3 3" />
        <text x={padL - 8} y={yFor("excluded") + 3.5} textAnchor="end" fontSize="9" fill="#e11d48">excl.</text>
        <line x1={padL} y1={yFor("excluded")} x2={W - padR} y2={yFor("excluded")} stroke="#fecdd3" strokeDasharray="3 3" />

        {/* mode columns */}
        {traces.map((t, i) => (
          <text key={t.mode} x={xFor(i)} y={H - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
            {RETRIEVAL_MODES.find((m) => m.id === t.mode)?.label ?? t.mode}
          </text>
        ))}

        {/* series */}
        {series.map((s) => {
          const c = colorFor(s.points);
          const dim = focus !== null && focus !== s.source;
          const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p)}`).join(" ");
          const lastY = yFor(s.points[s.points.length - 1]);
          return (
            <g key={s.source} opacity={dim ? 0.18 : 1} style={{ cursor: "pointer" }}
              onClick={() => setFocus(focus === s.source ? null : s.source)}>
              <path d={path} fill="none" stroke={c} strokeWidth={focus === s.source ? 3 : 2} />
              {s.points.map((p, i) => <circle key={i} cx={xFor(i)} cy={yFor(p)} r={focus === s.source ? 4 : 3} fill={c} />)}
              <text x={W - padR + 8} y={lastY + 3.5} fontSize="9.5" fontWeight={focus === s.source ? 700 : 500} fill={c}>
                {s.source}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[11px] text-slatey-500">
        Click a line to isolate it. <span className="text-emerald-700">Green</span> = gains rank under governed re-rank ·{" "}
        <span className="text-amber-700">amber</span> = loses rank · <span className="text-rose-700">rose</span> = excluded by the Data handoff.
      </p>
    </div>
  );
}
