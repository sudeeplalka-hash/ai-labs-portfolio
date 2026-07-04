"use client";

// C3-3 · Inference Cost Forecaster (Collection 3 · gallery).
// Portfolio-level run-rate over 24 months: API (grows with volume) vs self-host
// (fixed capacity that steps up), with the crossover CLIFF marked. Self-host cost =
// hardware amortization + utilization + ops headcount — all visible. Distinct
// altitude from GAP-06 (portfolio vs per-call). SIMULATED, stated formulas.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";

const CLUSTER_CAP_TOKENS = 2.5e9; // tokens/month per cluster at 100% utilization
const CLUSTER_COST = 38000; // $/month amortized (hardware + power + DC)
const OPS_COST_PER_FTE = 22000; // $/month loaded
const CHEAP_PRICE = 3; // $ / 1M tokens (blended in+out)
const FRONTIER_PRICE = 18;

const fmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

export function InferenceForecaster() {
  const [startVol, setStartVol] = useState(500_000); // calls/mo
  const [growth, setGrowth] = useState(6); // %/mo
  const [tokensPerCall, setTokensPerCall] = useState(3000);
  const [frontierShare, setFrontierShare] = useState(40); // %
  const [util, setUtil] = useState(60); // %
  const [opsFte, setOpsFte] = useState(1.5);

  const blendedPrice = CHEAP_PRICE + (frontierShare / 100) * (FRONTIER_PRICE - CHEAP_PRICE);
  const apiCostPerCall = (tokensPerCall / 1e6) * blendedPrice;
  const effCap = CLUSTER_CAP_TOKENS * (util / 100);

  const api: number[] = [];
  const self: number[] = [];
  for (let m = 0; m < 24; m++) {
    const vol = startVol * Math.pow(1 + growth / 100, m);
    const tokens = vol * tokensPerCall;
    api.push(vol * apiCostPerCall);
    const clusters = Math.max(1, Math.ceil(tokens / effCap));
    self.push(clusters * CLUSTER_COST + opsFte * OPS_COST_PER_FTE);
  }
  const cliff = api.findIndex((a, i) => a > self[i]); // first month self-host wins
  const apiCum = api.reduce((a, b) => a + b, 0);
  const selfCum = self.reduce((a, b) => a + b, 0);

  const W = 720, H = 220, PAD = 40;
  const maxY = Math.max(...api, ...self);
  const xf = (i: number) => PAD + (i / 23) * (W - PAD * 2);
  const yf = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2);
  const poly = (arr: number[]) => arr.map((v, i) => `${xf(i).toFixed(1)},${yf(v).toFixed(1)}`).join(" ");

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">C3-3</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Business of AI · Gallery</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Inference Cost Forecaster</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Portfolio-level, 24 months out. API scales linearly with volume; self-host is fixed capacity that steps up.
            Where they cross is the cliff — and utilization decides where it lands. (Per-call economics live in{" "}
            <Link href="/agents/cost-simulator" className="font-medium text-primary hover:underline">GAP-06</Link>.)
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Inputs */}
          <Panel className="space-y-4">
            <Slider label="Starting volume" value={startVol} min={100000} max={5000000} step={100000} onChange={setStartVol} fmt={(v) => `${(v / 1e6).toFixed(1)}M/mo`} accent="amber" />
            <Slider label="Monthly growth" value={growth} min={0} max={20} step={1} onChange={setGrowth} fmt={(v) => `${v}%`} accent="amber" />
            <Slider label="Tokens / call" value={tokensPerCall} min={500} max={8000} step={100} onChange={setTokensPerCall} fmt={(v) => v.toLocaleString()} accent="amber" />
            <Slider label="Share on frontier model" value={frontierShare} min={0} max={100} step={5} onChange={setFrontierShare} fmt={(v) => `${v}%`} accent="amber" />
            <Slider label="Self-host utilization" value={util} min={20} max={95} step={5} onChange={setUtil} fmt={(v) => `${v}%`} accent="teal" />
            <Slider label="Ops headcount (FTE)" value={opsFte} min={0.5} max={5} step={0.5} onChange={setOpsFte} fmt={(v) => `${v}`} accent="teal" />
          </Panel>

          {/* Chart + KPIs */}
          <div className="space-y-4">
            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Monthly run-rate · 24 months</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rose-500" /> API</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-teal-600" /> Self-host</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="API vs self-host monthly run-rate over 24 months">
                  <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e4e7eb" />
                  <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#e4e7eb" />
                  {cliff > 0 && (
                    <g>
                      <line x1={xf(cliff)} y1={PAD} x2={xf(cliff)} y2={H - PAD} stroke="#152433" strokeDasharray="3 3" strokeOpacity="0.5" />
                      <circle cx={xf(cliff)} cy={yf(self[cliff])} r="4" fill="#152433" />
                      <text x={xf(cliff)} y={PAD - 6} textAnchor="middle" className="fill-ink" fontSize="11" fontWeight="600">cliff · mo {cliff + 1}</text>
                    </g>
                  )}
                  <polyline points={poly(api)} fill="none" stroke="#e24b4a" strokeWidth="2.5" />
                  <polyline points={poly(self)} fill="none" stroke="#0d9488" strokeWidth="2.5" />
                  <text x={PAD} y={H - PAD + 14} className="fill-slate-400" fontSize="10">mo 1</text>
                  <text x={W / 2} y={H - PAD + 14} textAnchor="middle" className="fill-slate-400" fontSize="10">mo 12</text>
                  <text x={W - PAD} y={H - PAD + 14} textAnchor="end" className="fill-slate-400" fontSize="10">mo 24</text>
                  <text x={PAD - 6} y={PAD + 4} textAnchor="end" className="fill-slate-400" fontSize="10">{fmt(maxY)}</text>
                </svg>
              </div>
            </Panel>

            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="The cliff" value={cliff > 0 ? `Mo ${cliff + 1}` : "—"} tone={cliff > 0 ? "watch" : "healthy"} interpretation={cliff > 0 ? "Self-host undercuts API" : "Beyond 24 mo"} />
              <KpiCard label="API · 24-mo total" value={fmt(apiCum)} tone="neutral" interpretation="Cumulative" />
              <KpiCard label="Self-host · 24-mo total" value={fmt(selfCum)} tone="neutral" interpretation="Cumulative" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={cliff > 0 ? `The cliff is at month ${cliff + 1}` : "No cliff inside 24 months"} tone={cliff > 0 ? "warn" : "success"}>
            {cliff > 0
              ? <>Below month {cliff + 1}, API&apos;s pay-per-use wins; above it, fixed capacity amortizes. Now drop utilization — the cliff slides right. Idle GPUs are the cost vendors leave out of the pitch.</>
              : <>At these assumptions API stays cheaper for all 24 months. Raise growth or lower the frontier-model share to bring a cliff into view — or accept that self-host doesn&apos;t pay yet.</>}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> The cliff is real but further out than vendors say — utilization assumptions decide it, not sticker price.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built &amp; assumptions</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>API/mo = volume × tokens/call × blended price (${CHEAP_PRICE}–${FRONTIER_PRICE}/1M tokens by frontier share). Volume compounds at the monthly growth rate.</p>
              <p>Self-host/mo = ⌈tokens ÷ (cluster capacity {(CLUSTER_CAP_TOKENS / 1e9).toFixed(1)}B × utilization)⌉ × ${(CLUSTER_COST / 1000)}k amortized + ops FTE × ${(OPS_COST_PER_FTE / 1000)}k. The cliff is the first month self-host &lt; API.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> cluster capacity, amortization, and ops load are illustrative defaults; real forecasts need your hardware, contracts, and utilization telemetry. It finds the crossover&apos;s shape, not the exact date.</p>
        </div>
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt, accent }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string; accent: "amber" | "teal" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">{label}</label><span className="font-mono text-xs font-semibold text-ink">{fmt(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full ${accent === "amber" ? "accent-amber-500" : "accent-teal-600"}`} />
    </div>
  );
}
