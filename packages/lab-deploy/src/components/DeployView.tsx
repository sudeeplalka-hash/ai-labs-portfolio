"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import { Gauge, Rocket, Coins, Timer, Activity, Workflow, AlertTriangle, Cpu } from "lucide-react";
import {
  Panel, SectionHeader, KpiCard, Badge, InsightCard, MetricTooltip, SectionTabs, cn,
} from "@labs/design-system";
import { useProgramSource } from "@labs/program-core";
import {
  deriveBaseline, computeOps, envelopeGrid, ENVELOPE_VOLUMES, ENVELOPE_CACHE, driftSeries, deployVerdict,
} from "../engine/model";
import type { DeployLevers, ModelTier } from "../engine/types";
import { OperatingEnvelope } from "./OperatingEnvelope";
import { IncidentPanel } from "./IncidentPanel";

const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtVol = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`);
const VMIN = 100, VMAX = 200000, RATIO = VMAX / VMIN;
const posToVol = (p: number) => Math.round(VMIN * Math.pow(RATIO, p / 100));
const volToPos = (v: number) => (100 * Math.log(v / VMIN)) / Math.log(RATIO);

// Curated mixes for the comparison matrix — not every combination, just the ones
// that tell a story about the cost/quality/latency tradeoff.
const COMPARE_CONFIGS: { key: string; label: string; tier: ModelTier; cachePct: number; reranker: boolean; blurb: string }[] = [
  { key: "lean", label: "Lean", tier: "small", cachePct: 0, reranker: false, blurb: "Cheapest compute, no extras" },
  { key: "cached", label: "Cached", tier: "small", cachePct: 40, reranker: false, blurb: "Cache the most common questions" },
  { key: "quality", label: "Quality", tier: "small", cachePct: 0, reranker: true, blurb: "Reranker lifts answer quality" },
  { key: "balanced", label: "Balanced", tier: "small", cachePct: 40, reranker: true, blurb: "Cache plus reranker" },
  { key: "premium", label: "Premium", tier: "large", cachePct: 40, reranker: true, blurb: "Large model, everything on" },
];

export function DeployView() {
  // Live = the threaded initiative; Demo = a self-contained sample scenario.
  const { state, isDemo, update, hydrated, src } = useProgramSource();
  const baseline = useMemo(() => deriveBaseline(src), [src]);
  const [section, setSection] = useState("envelope");
  const [tier, setTier] = useState<ModelTier>("small");
  const [cachePct, setCachePct] = useState(0);
  const [reranker, setReranker] = useState(false);
  const [vol, setVol] = useState(() => Math.min(VMAX, Math.max(VMIN, baseline.suggestedVolume)));

  const levers: DeployLevers = { volumePerDay: vol, tier, cachePct, reranker };
  const ops = useMemo(() => computeOps(baseline, levers), [baseline, levers]);
  const envelope = useMemo(() => envelopeGrid(baseline, levers), [baseline, levers]);
  const drift = useMemo(() => driftSeries(baseline), [baseline]);
  const verdict = useMemo(() => deployVerdict(baseline, ops), [baseline, ops]);

  // Write the deploy slice (computed at the production target volume) for Realize.
  // Demo mode is a standalone sandbox, so it never writes back to the real program.
  useEffect(() => {
    if (!hydrated || isDemo) return;
    const prod = computeOps(baseline, { ...levers, volumePerDay: baseline.suggestedVolume });
    update((d) => {
      const meetsSlo = prod.reliability >= baseline.sloReliability && prod.p95 <= baseline.sloLatencyMs;
      const sloStatus = meetsSlo ? "within" : prod.zone === "red" ? "breached" : "at risk";
      // Version lineage pulled from the Build Output Contract when present.
      const c = d.rag?.contract;
      const lineage: Record<string, string> = {};
      if (d.rag?.model) lineage.model = d.rag.model;
      if (c?.promptVersion) lineage.prompt = c.promptVersion;
      if (c?.indexVersion) lineage.index = c.indexVersion;
      if (c?.datasetVersion) lineage.dataset = c.datasetVersion;
      d.deploy = {
        costPerQuery: prod.costPerQuery,
        monthlyCostAtTarget: prod.monthlyCost,
        latencyP95: prod.p95,
        latencyP99: prod.p99,
        reliability: prod.reliability,
        errorBudgetPct: prod.errorBudgetPct,
        driftRisk: drift.driftRisk,
        status: prod.zone === "green" ? "healthy" : prod.zone === "amber" ? "watch" : "at-risk",
        // Phase 1 — Ops Evidence for Govern / Realize.
        evidence: {
          sloStatus,
          latencyP95: prod.p95,
          costPerQuery: prod.costPerQuery,
          errorBudgetPct: prod.errorBudgetPct,
          driftRisk: drift.driftRisk,
          incidentStatus: "none",
          monitoringCoverage: reranker ? 88 : 80,
          rollbackReadiness: "Prompt + index rollback available",
          versionLineage: lineage,
          operationalDecision: prod.zone === "green" ? "Ready for pilot" : prod.zone === "amber" ? "Ready with restrictions" : "Hold — not production ready",
          createdAt: new Date().toISOString(),
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, cachePct, reranker, hydrated, isDemo, baseline.suggestedVolume]);

  // Deep-link the active section via the URL hash, so the sidebar sub-items work.
  useEffect(() => {
    const apply = () => { const h = window.location.hash.replace("#", ""); if (h) setSection(h); };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const meetsRel = ops.reliability >= baseline.sloReliability;
  const meetsLat = ops.p95 <= baseline.sloLatencyMs;
  const meetsCost = ops.costPerQuery <= baseline.targetCostPerQuery;
  const vtone = { healthy: "healthy", watch: "watch", risk: "risk", info: "neutral" } as const;

  // Project every curated mix at the current scale so users can compare, not just
  // see the one default. Cheap: computeOps is pure.
  const compareRows = useMemo(
    () => COMPARE_CONFIGS.map((c) => {
      const o = computeOps(baseline, { volumePerDay: vol, tier: c.tier, cachePct: c.cachePct, reranker: c.reranker });
      const meetsSlo = o.reliability >= baseline.sloReliability && o.p95 <= baseline.sloLatencyMs;
      return { ...c, o, meetsSlo };
    }),
    [baseline, vol],
  );
  // Best value = cheapest mix that still meets both SLOs (else cheapest overall).
  const bestKey = useMemo(() => {
    const ok = compareRows.filter((r) => r.meetsSlo);
    const pool = ok.length ? ok : compareRows;
    return pool.reduce((a, b) => (b.o.monthlyCost < a.o.monthlyCost ? b : a)).key;
  }, [compareRows]);
  const isCurrent = (c: { tier: ModelTier; cachePct: number; reranker: boolean }) =>
    c.tier === tier && c.cachePct === cachePct && c.reranker === reranker;
  const applyConfig = (c: { tier: ModelTier; cachePct: number; reranker: boolean }) => {
    setTier(c.tier); setCachePct(c.cachePct); setReranker(c.reranker);
  };

  // Section tabs replace the endless scroll — every section available to everyone.
  const tabs = [
    { key: "envelope", label: "Operating envelope" },
    { key: "compare", label: "Compare configs" },
    { key: "under-load", label: "Under load" },
    { key: "incident", label: "Incident response" },
  ];
  const active = tabs.some((t) => t.key === section) ? section : "envelope";

  // Engine chosen in Build · RAG → Model Fit (Live only). Names the model behind these costs.
  const engine = isDemo ? null : state.rag;

  return (
    <div className="space-y-6">
      {engine?.model && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-primary-soft/40 px-3 py-2 text-xs text-slatey-400">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>
            Envelope driven by engine <span className="font-semibold text-ink">{engine.model}</span>
            {engine.modelDeployment ? ` (${engine.modelDeployment})` : ""}
            {typeof engine.modelCostFactor === "number" ? ` · cost ×${engine.modelCostFactor}` : ""}
            {typeof engine.modelLatencyFactor === "number" ? `, latency ×${engine.modelLatencyFactor}` : ""}
          </span>
          <span className="text-slatey-500">— set in Build · Model Fit</span>
        </div>
      )}

      {/* Exec KPI strip — live, moves with the dial */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Monthly cost" value={fmtUsd(ops.monthlyCost)} tone={meetsCost ? "healthy" : "watch"}
          target={`at ${fmtVol(vol)}/day`} tooltip="The total monthly cost to run the system at the current load. It is the per-query cost (compute plus human-escalation cost) times daily volume across the month. Escalation is the dominant driver and rises with the engine's hallucination rate from Build, so better answers lower this number." interpretation={`$${ops.costPerQuery}/query`} />
        <KpiCard label="Reliability" value={`${(ops.reliability * 100).toFixed(2)}%`} suffix="" tone={meetsRel ? "healthy" : ops.reliability < baseline.sloReliability * 0.985 ? "critical" : "watch"}
          target={`SLO ${(baseline.sloReliability * 100).toFixed(1)}%`} tooltip="The share of requests served successfully without error at the current load, measured against your SLO. It falls as peak traffic approaches the system's capacity and queues build up. It captures whether the service stays dependable as you scale, not just whether it works in a demo." interpretation={`error budget ${ops.errorBudgetPct}%`} />
        <KpiCard label="p95 latency" value={`${(ops.p95 / 1000).toFixed(2)}s`} tone={meetsLat ? "healthy" : "watch"}
          target={`target ${(baseline.sloLatencyMs / 1000).toFixed(1)}s`} tooltip="The 95th-percentile end-to-end response time: 95% of requests are at least this fast. Tail latency climbs sharply once utilization passes roughly 80%, so this is more honest than an average. It captures the experience of your slowest, most affected users." interpretation={`p99 ${(ops.p99 / 1000).toFixed(2)}s · util ${Math.round(ops.utilization * 100)}%`} />
        <KpiCard label="Drift risk" value={`${drift.driftRisk}`} suffix="/100" tone={drift.driftRisk < 40 ? "healthy" : drift.driftRisk < 70 ? "watch" : "risk"}
          target="quality decay over time" tooltip="How quickly answer quality is expected to decay in production before a refresh or retrain is needed, on a 0 to 100 scale. It is driven by how weak the underlying data is and how fast the world it describes changes. Higher means you should plan more frequent refreshes to hold quality." interpretation={drift.driftRisk < 40 ? "stable" : "plan refreshes"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTabs tabs={tabs} active={active} onChange={(k) => { setSection(k); if (typeof window !== "undefined") history.replaceState(null, "", "#" + k); }} />
      </div>

      {active === "envelope" && (
      <div className="space-y-6">
      {/* Hero — Operating Envelope + Scale Dial */}
      <Panel>
        <SectionHeader eyebrow="Signature · where it breaks" title="Operating envelope"
          description="Load × caching → SLO & cost zones. Drag the scale dial and watch your operating point drift toward the edge."
          icon={Gauge} action={<Badge tone={ops.zone === "green" ? "emerald" : ops.zone === "amber" ? "amber" : "rose"}>{ops.zone === "green" ? "Safe" : ops.zone === "amber" ? "Margin" : "Breaks"}</Badge>} />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <OperatingEnvelope cells={envelope} volumes={ENVELOPE_VOLUMES} caches={ENVELOPE_CACHE} current={{ volume: vol, cachePct }} />
          <div>
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slatey-200">Scale</span>
                <span className="font-mono text-primary">{fmtVol(vol)} queries/day</span>
              </div>
              <input type="range" min={0} max={100} value={Math.round(volToPos(vol))} onChange={(e) => setVol(posToVol(Number(e.target.value)))} className="w-full accent-primary" aria-label="Scale (queries per day)" />
              <div className="mt-1 flex justify-between text-[11px] text-slatey-500"><span>pilot · 100</span><span>production · 200k</span></div>
            </div>
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slatey-300">Model tier</span>
                <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
                  {(["small", "large"] as const).map((t) => (
                    <button key={t} onClick={() => setTier(t)} aria-pressed={tier === t}
                      className={cn("rounded-md px-2.5 py-1 text-xs font-semibold capitalize", tier === t ? "bg-primary/10 text-primary" : "text-slatey-400")}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-slatey-300">Cache hit rate</span><span className="font-mono text-slatey-400">{cachePct}%</span></div>
                <input type="range" min={0} max={60} step={5} value={cachePct} onChange={(e) => setCachePct(Number(e.target.value))} className="w-full accent-primary" aria-label="Cache hit rate" />
              </div>
              <label className="flex items-center justify-between text-xs">
                <span className="font-medium text-slatey-300">Reranker (better quality, +latency)</span>
                <input type="checkbox" checked={reranker} onChange={(e) => setReranker(e.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
            </div>
            <div className={cn("mt-4 rounded-lg border p-3 text-sm",
              verdict.tone === "healthy" ? "border-emerald-500/30 bg-emerald-500/[0.06]" : verdict.tone === "risk" ? "border-rose-500/30 bg-rose-500/[0.06]" : verdict.tone === "watch" ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-primary/30 bg-primary/[0.05]")}>
              <p className="font-semibold text-ink">{verdict.headline}</p>
              <p className="mt-0.5 leading-relaxed text-slatey-300">{verdict.detail}</p>
            </div>
          </div>
        </div>
      </Panel>

      {/* cost + reliability read alongside the envelope */}
      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard tone={meetsCost ? "success" : "warn"} title={`Run cost ${meetsCost ? "within budget" : "over budget"}`}>
          {meetsCost ? `At ${fmtVol(vol)}/day you're at $${ops.costPerQuery}/query, under the $${baseline.targetCostPerQuery.toFixed(3)} target.` : `$${ops.costPerQuery}/query vs $${baseline.targetCostPerQuery.toFixed(3)} target — escalation is ${ops.escalationRate}% of cost; better answers (Build) or caching closes it.`}
        </InsightCard>
        <InsightCard tone={meetsRel ? "success" : "danger"} title={`Reliability ${meetsRel ? "meets SLO" : "below SLO"}`}>
          {meetsRel ? `${(ops.reliability * 100).toFixed(2)}% ≥ ${(baseline.sloReliability * 100).toFixed(1)}% SLO at this load.` : `${(ops.reliability * 100).toFixed(2)}% vs ${(baseline.sloReliability * 100).toFixed(1)}% — add capacity or shed load before scaling further.`}
        </InsightCard>
      </div>
      </div>
      )}

      {active === "under-load" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader title="Latency & cost under load" description="The numbers behind the envelope at your current operating point." icon={Timer} />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["p50", `${ops.p50} ms`], ["p95", `${ops.p95} ms`], ["p99", `${ops.p99} ms`],
                ["Utilization", `${Math.round(ops.utilization * 100)}%`], ["Error rate", `${ops.errorRatePct}%`],
                ["Compute / query", `$${ops.computeCost}`], ["Escalation / query", `$${ops.escalationCost} (${ops.escalationRate}%)`],
                ["Cost / query", `$${ops.costPerQuery}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line/70 py-1"><dt className="text-slatey-400">{k}</dt><dd className="font-mono text-ink">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 rounded-md bg-slate-50 p-2.5 font-mono text-[11px] leading-relaxed text-slatey-500">
              cost/q = compute·tier·(1−cache) + reranker + escalation(hallucination)·$2.50 · p95 ≈ p50·(1+util²)·queueing · errors ↑ sharply once util &gt; 1
            </p>
          </Panel>
          <Panel>
            <SectionHeader title="Production drift" description="Answer quality decays over time until a refresh fires — distinct from Build's version regression." icon={Activity} />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={drift.points} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#5f6f81" }} label={{ value: "weeks in production", position: "insideBottom", offset: -2, fontSize: 10, fill: "#5f6f81" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "#5f6f81" }} />
                <Tooltip contentStyle={{ border: "1px solid rgba(21,36,51,.12)", borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={80} stroke="#d97706" strokeDasharray="4 3" label={{ value: "refresh threshold", fontSize: 10, fill: "#d97706", position: "insideTopRight" }} />
                <Line dataKey="quality" stroke="#1f6fc4" strokeWidth={2} dot={false} isAnimationActive />
                {drift.points.filter((p) => p.refreshed).map((p) => (
                  <ReferenceDot key={p.week} x={p.week} y={p.quality} r={4} fill="#16a34a" stroke="#fff" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {active === "compare" && (
      <Panel>
        <SectionHeader eyebrow="Compare" title="Configuration tradeoffs"
          description={`Every mix of model tier, caching, and reranker, projected at ${fmtVol(vol)} queries/day. Apply any row to load it onto the dial.`}
          icon={Workflow} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slatey-500">
                <th className="py-2 pr-3 font-semibold">Configuration</th>
                <th className="py-2 px-3 font-semibold">Cost / query</th>
                <th className="py-2 px-3 font-semibold">Monthly</th>
                <th className="py-2 px-3 font-semibold">p95</th>
                <th className="py-2 px-3 font-semibold">Reliability</th>
                <th className="py-2 px-3 font-semibold">Zone</th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody>
              {compareRows.map((r) => {
                const cur = isCurrent(r);
                return (
                  <tr key={r.key} className={cn("border-b border-line/70", cur && "bg-primary/[0.04]")}>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-ink">{r.label}</span>
                        {r.key === bestKey && <Badge tone="emerald">best value</Badge>}
                        {cur && <Badge tone="blue">current</Badge>}
                      </div>
                      <p className="text-[11px] text-slatey-400">{r.blurb}</p>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink">${r.o.costPerQuery}</td>
                    <td className="py-2.5 px-3 font-mono text-ink">{fmtUsd(r.o.monthlyCost)}</td>
                    <td className="py-2.5 px-3 font-mono text-ink">{(r.o.p95 / 1000).toFixed(2)}s</td>
                    <td className="py-2.5 px-3 font-mono text-ink">{(r.o.reliability * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3">
                      <Badge tone={r.o.zone === "green" ? "emerald" : r.o.zone === "amber" ? "amber" : "rose"}>
                        {r.o.zone === "green" ? "Safe" : r.o.zone === "amber" ? "Margin" : "Breaks"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <button
                        onClick={() => applyConfig(r)}
                        disabled={cur}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                          cur ? "text-slatey-400" : "bg-primary/10 text-primary hover:bg-primary/15",
                        )}
                      >
                        {cur ? "Applied" : "Apply"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slatey-500">
          Cheaper compute is not always cheaper overall: the reranker lifts answer quality, which cuts human escalation (the dominant cost driver), so a pricier mix can land at a lower total cost per query. Apply a row, then open the Operating envelope to see where it sits against the SLO and budget edges.
        </p>
      </Panel>
      )}

      {active === "incident" && (
      <div className="space-y-6">
      {/* Incident set-piece — the wow */}
      <Panel>
        <SectionHeader eyebrow="Set-piece" title="Incident response" description="Fire an incident and watch alerts trip, the error budget burn, and the system recover (MTTR)." icon={AlertTriangle} />
        <IncidentPanel baseline={baseline} levers={levers} />
      </Panel>

      {/* handoff to Govern → Realize */}
      <InsightCard tone="info" title="Next: Govern, then Realize">
        These reliability and cost numbers flow into governance&apos;s risk tier, and from there into the risk adjusted ROI in Realize — run cost is a direct input to the business case.
      </InsightCard>
      </div>
      )}
    </div>
  );
}
