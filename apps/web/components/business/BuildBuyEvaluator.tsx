"use client";

// C3-2 · Build-vs-Buy-vs-Fine-Tune Evaluator (Collection 3 · gallery).
// Structured inputs → three-column comparison with enumerated 3-year TCO and a
// weighted score, plus the flip condition. This decision is re-made every 18 months;
// the evaluator matters less than knowing your flip conditions. SIMULATED — stated
// formulas, visible line items, adjustable inputs.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { C32_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type OKey = "api" | "ft" | "buy";
const OPT: Record<OKey, { label: string; blurb: string }> = {
  api: { label: "API (usage-based)", blurb: "Pay per call; fastest to value; no control of the model." },
  ft: { label: "Fine-tune / self-host", blurb: "Train + host + maintain; most control and differentiation; needs the team." },
  buy: { label: "Buy (license)", blurb: "COTS product; fast, but lock-in and little differentiation." },
};
const FLIP: Record<OKey, string> = {
  api: "volume falls, or you can't staff a build",
  ft: "volume roughly triples (self-host amortizes) or differentiation need rises",
  buy: "speed-to-value trumps control and differentiation is low",
};

const COST_PER_CALL = 0.004; // $ per call, blended (see how-built)
const WEIGHTS = { cost: 0.35, speed: 0.15, control: 0.15, diff: 0.20, risk: 0.15 };

const fmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

export function BuildBuyEvaluator() {
  const [volume, setVolume] = useState(1_000_000);
  const [dataSens, setDataSens] = useState(1);
  const [diffNeed, setDiffNeed] = useState(1);
  const [latency, setLatency] = useState(1);
  const [teamSkill, setTeamSkill] = useState(1);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C32_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C32_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? C32_USE_CASES.find((u) => u.id === id) : null;
    const p = uc ? uc.payload : { volume: 1_000_000, dataSens: 1, diffNeed: 1, latency: 1, teamSkill: 1 };
    setVolume(p.volume); setDataSens(p.dataSens); setDiffNeed(p.diffNeed); setLatency(p.latency); setTeamSkill(p.teamSkill);
  };

  // --- TCO (3 years) ---
  const apiUsage = volume * 36 * COST_PER_CALL;
  const hostMonthly = 6000 * Math.max(1, Math.ceil(volume / 2_000_000));
  const ftHost = hostMonthly * 36;
  const tco: Record<OKey, number> = {
    api: 20000 + apiUsage,
    ft: 60000 + 40000 + ftHost + 45000,
    buy: 360000 + 50000 + 30000,
  };
  const items: Record<OKey, [string, number][]> = {
    api: [["Integration (one-time)", 20000], ["Usage · 36 mo", apiUsage]],
    ft: [["Training (one-time)", 60000], ["Eval-harness build", 40000], ["Hosting · 36 mo", ftHost], ["Eval maintenance · 3 yr", 45000]],
    buy: [["License · 3 yr", 360000], ["Integration", 50000], ["Lock-in premium (risk)", 30000]],
  };

  // --- Qualitative scores adjusted by inputs ---
  const base: Record<OKey, { control: number; speed: number; diff: number; risk: number }> = {
    api: { control: 30 - latency * 4, speed: 90, diff: 45, risk: 80 - dataSens * 8 },
    ft: { control: 90 + dataSens * 4 + latency * 3, speed: 40, diff: 90, risk: 55 },
    buy: { control: 30, speed: 85, diff: 25, risk: 45 - dataSens * 3 },
  };
  const minTco = Math.min(tco.api, tco.ft, tco.buy);
  const diffFactor = 0.4 + 0.3 * diffNeed; // differentiation matters more when needed
  const feasibility = (k: OKey) => (k === "ft" ? 0.7 + 0.15 * teamSkill : 1);

  const composite: Record<OKey, number> = { api: 0, ft: 0, buy: 0 };
  (Object.keys(OPT) as OKey[]).forEach((k) => {
    const costScore = 100 * (minTco / tco[k]);
    const b = base[k];
    const raw = WEIGHTS.cost * costScore + WEIGHTS.speed * b.speed + WEIGHTS.control * b.control + WEIGHTS.diff * b.diff * diffFactor + WEIGHTS.risk * b.risk;
    composite[k] = Math.round(raw * feasibility(k));
  });

  const ranked = (Object.keys(OPT) as OKey[]).sort((a, b) => composite[b] - composite[a]);
  const primary = ranked[0];
  const runnerUp = ranked[1];

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">C3-2</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Business of AI · Gallery</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Build vs Buy vs Fine-Tune</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Three paths, one 3-year number each, scored on more than cost. The recommendation is the easy part — the flip
            condition is the one worth remembering, because you&apos;ll re-run this in 18 months.
          </p>
        </div>

        <UseCaseRail useCases={C32_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        {/* Inputs */}
        <Panel className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">Monthly volume</label><span className="font-mono text-xs font-semibold text-ink">{(volume / 1e6).toFixed(1)}M calls</span></div>
              <input type="range" min={100000} max={12000000} step={100000} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <Seg label="Data sensitivity" value={dataSens} onChange={setDataSens} opts={["Low", "Medium", "High"]} />
            <Seg label="Differentiation need" value={diffNeed} onChange={setDiffNeed} opts={["Low", "Medium", "High"]} />
            <Seg label="Latency requirement" value={latency} onChange={setLatency} opts={["Relaxed", "Moderate", "Strict"]} />
            <Seg label="Team skill" value={teamSkill} onChange={setTeamSkill} opts={["Low", "Medium", "High"]} />
          </div>
        </Panel>

        {/* Three columns */}
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(OPT) as OKey[]).map((k) => {
            const isP = k === primary;
            return (
              <div key={k} className={`rounded-xl border bg-white p-4 shadow-card ${isP ? "border-emerald-400 ring-1 ring-emerald-400/40" : "border-line"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{OPT[k].label}</p>
                  {isP && <Badge tone="emerald">Recommended</Badge>}
                </div>
                <p className="mt-0.5 text-[11px] text-slatey-500">{OPT[k].blurb}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div><p className="text-[11px] text-slatey-500">3-yr TCO</p><p className="font-mono text-2xl font-semibold text-ink">{fmt(tco[k])}</p></div>
                  <div className="text-right"><p className="text-[11px] text-slatey-500">Score</p><p className="font-mono text-lg font-semibold text-ink">{composite[k]}</p></div>
                </div>
                <ul className="mt-3 space-y-0.5 border-t border-line pt-2 text-[11px]">
                  {items[k].map(([lbl, val]) => (
                    <li key={lbl} className="flex justify-between gap-2"><span className="text-slatey-400">{lbl}</span><span className="font-mono text-slatey-500">{fmt(val)}</span></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Recommendation */}
        <Panel className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">{OPT[primary].label}</Badge>
            <span className="text-sm text-slatey-300">at {(volume / 1e6).toFixed(1)}M calls/mo, this data sensitivity, and this team.</span>
          </div>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold">Flip condition — {OPT[runnerUp].label}</span> wins if {FLIP[runnerUp]}.</p>
        </Panel>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="Know the flip, not just the answer" tone="info">
            Cross the volume slider slowly and watch API and fine-tune trade places — the crossover is the whole decision.
            Buy wins on speed when differentiation is low; it loses the moment the capability becomes your edge.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "This decision is re-made every 18 months. The evaluator matters less than knowing your flip conditions."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built &amp; assumptions</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>TCO (3 yr): API = integration + volume × 36 × ${COST_PER_CALL}/call. Fine-tune = training + eval-harness + hosting (scales with volume) + eval maintenance. Buy = license + integration + a lock-in risk premium.</p>
              <p>Score = weighted blend of cost (inverse TCO), speed, control, differentiation, and risk (cost {Math.round(WEIGHTS.cost * 100)}% · diff {Math.round(WEIGHTS.diff * 100)}% · others {Math.round(WEIGHTS.control * 100)}% each). Data sensitivity and latency shift control/risk; differentiation need scales the diff weight; team skill gates fine-tune feasibility.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> rates and line items are illustrative defaults; real TCO needs your negotiated pricing and utilization. It frames the decision and its sensitivity, not a procurement quote.</p>
        </div>
      </main>
    </div>
  );
}

function Seg({ label, value, onChange, opts }: { label: string; value: number; onChange: (v: number) => void; opts: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slatey-400">{label}</p>
      <div className="flex gap-1">
        {opts.map((o, i) => (
          <button key={o} onClick={() => onChange(i)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${value === i ? "border-amber-500 bg-amber-500 text-white" : "border-line bg-white text-slatey-400 hover:border-amber-400/50 hover:text-ink"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
