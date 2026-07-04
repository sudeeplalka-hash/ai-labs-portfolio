"use client";

// C3-5 · Business Case / ROI Builder (Collection 3 · gallery).
// Inputs → payback / NPV / IRR → a tornado sensitivity chart (±30% on the drivers)
// → a one-slide exec summary. Single-point ROI is what juniors present; ranges are
// what gets funded. Adoption ramp links conceptually to EL-01. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, KpiCard, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";

const H = 3; // horizon years

interface P { investment: number; annualValue: number; rampMonths: number; runCost: number; rate: number }

function avgAdoption(t: number, rampMonths: number) {
  let s = 0;
  for (let m = 0; m < 12; m++) s += Math.min(1, ((t - 1) * 12 + m + 1) / rampMonths);
  return s / 12;
}
function cashflows(p: P): number[] {
  const cf = [-p.investment];
  for (let t = 1; t <= H; t++) cf.push(p.annualValue * avgAdoption(t, p.rampMonths) - p.runCost);
  return cf;
}
function npv(cf: number[], r: number) { return cf.reduce((a, c, t) => a + c / Math.pow(1 + r, t), 0); }
function irr(cf: number[]) { let lo = -0.9, hi = 5; for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; (npv(cf, mid) > 0 ? (lo = mid) : (hi = mid)); } return (lo + hi) / 2; }
function payback(cf: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cf.length; t++) { const prev = cum; cum += cf[t]; if (cum >= 0 && cf[t] > 0) return t - 1 + (-prev) / cf[t]; }
  return null;
}
const fmt = (v: number) => (v < 0 ? "-" : "") + (Math.abs(v) >= 1e6 ? `$${(Math.abs(v) / 1e6).toFixed(2)}M` : `$${Math.round(Math.abs(v) / 1000)}k`);

export function RoiBuilder() {
  const [p, setP] = useState<P>({ investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 });
  const set = (k: keyof P, v: number) => setP((cur) => ({ ...cur, [k]: v }));
  const r = p.rate / 100;

  const cf = cashflows(p);
  const baseNpv = npv(cf, r);
  const baseIrr = irr(cf);
  const pb = payback(cf);

  const drivers = [
    { label: "Annual value", low: npv(cashflows({ ...p, annualValue: p.annualValue * 0.7 }), r), high: npv(cashflows({ ...p, annualValue: p.annualValue * 1.3 }), r) },
    { label: "Adoption ramp", low: npv(cashflows({ ...p, rampMonths: p.rampMonths * 1.3 }), r), high: npv(cashflows({ ...p, rampMonths: p.rampMonths * 0.7 }), r) },
    { label: "Run cost", low: npv(cashflows({ ...p, runCost: p.runCost * 1.3 }), r), high: npv(cashflows({ ...p, runCost: p.runCost * 0.7 }), r) },
    { label: "Discount rate", low: npv(cf, r * 1.3), high: npv(cf, r * 0.7) },
  ].map((d) => ({ ...d, swing: Math.abs(d.high - d.low) })).sort((a, b) => b.swing - a.swing);

  const lows = drivers.map((d) => Math.min(d.low, d.high));
  const highs = drivers.map((d) => Math.max(d.low, d.high));
  const gMin = Math.min(baseNpv, ...lows);
  const gMax = Math.max(baseNpv, ...highs);
  const span = gMax - gMin || 1;
  const pct = (v: number) => ((v - gMin) / span) * 100;

  const rangeLow = Math.min(...lows);
  const rangeHigh = Math.max(...highs);
  const fundable = rangeLow > 0 ? "Fund" : baseNpv > 0 ? "Fund with conditions" : "Do not fund";
  const fundTone = rangeLow > 0 ? "emerald" : baseNpv > 0 ? "amber" : "rose";

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">C3-5</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Business of AI · Gallery</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Business Case / ROI Builder</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Payback, NPV, and IRR are table stakes. The tornado is the difference — single-point ROI gets challenged in
            the room; a range that stays positive gets funded. Adoption ramp ties to{" "}
            <Link href="/engagement/adoption" className="font-medium text-primary hover:underline">EL-01</Link>.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Inputs */}
          <Panel className="space-y-4">
            <Slider label="Investment (upfront)" value={p.investment} min={100000} max={2000000} step={50000} onChange={(v) => set("investment", v)} fmt={fmt} />
            <Slider label="Annual value @ full adoption" value={p.annualValue} min={200000} max={5000000} step={100000} onChange={(v) => set("annualValue", v)} fmt={fmt} />
            <Slider label="Adoption ramp (months to full)" value={p.rampMonths} min={1} max={24} step={1} onChange={(v) => set("rampMonths", v)} fmt={(v) => `${v} mo`} />
            <Slider label="Annual run cost" value={p.runCost} min={0} max={800000} step={20000} onChange={(v) => set("runCost", v)} fmt={fmt} />
            <Slider label="Discount rate" value={p.rate} min={4} max={25} step={1} onChange={(v) => set("rate", v)} fmt={(v) => `${v}%`} />
          </Panel>

          {/* Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label={`NPV · ${H}yr`} value={fmt(baseNpv)} tone={baseNpv > 0 ? "healthy" : "critical"} interpretation={`@ ${p.rate}% discount`} />
              <KpiCard label="IRR" value={`${Math.round(baseIrr * 100)}%`} tone={baseIrr > r ? "healthy" : "risk"} interpretation="Break-even discount rate" />
              <KpiCard label="Payback" value={pb ? `${pb.toFixed(1)} yr` : ">3 yr"} tone={pb && pb < 2 ? "healthy" : "watch"} interpretation="Undiscounted" />
            </div>

            <Panel>
              <p className="stat-label mb-3">Tornado · NPV sensitivity (±30%)</p>
              <div className="relative">
                <div className="absolute bottom-0 top-0 border-l border-dashed border-ink/40" style={{ left: `${pct(baseNpv)}%` }} />
                <div className="space-y-2">
                  {drivers.map((d) => {
                    const l = Math.min(d.low, d.high), hgh = Math.max(d.low, d.high);
                    return (
                      <div key={d.label}>
                        <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{d.label}</span><span className="font-mono text-slatey-500">{fmt(l)} … {fmt(hgh)}</span></div>
                        <div className="relative h-4 w-full">
                          <div className="absolute top-0.5 h-3 rounded bg-amber-400/80" style={{ left: `${pct(l)}%`, width: `${Math.max(1.5, pct(hgh) - pct(l))}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slatey-500">Dashed line = base NPV {fmt(baseNpv)}. Widest bar = the driver that most moves the case.</p>
              </div>
            </Panel>

            {/* Exec slide */}
            <div className="rounded-xl border-2 border-ink/10 bg-white p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slatey-500">Steering pre-read · business case</p>
                <Badge tone={fundTone}>{fundable}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-ink">AI initiative — {H}-year business case</h2>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-[11px] text-slatey-500">NPV (range)</p><p className="font-mono text-sm font-semibold text-ink">{fmt(rangeLow)} – {fmt(rangeHigh)}</p></div>
                <div><p className="text-[11px] text-slatey-500">IRR</p><p className="font-mono text-sm font-semibold text-ink">{Math.round(baseIrr * 100)}%</p></div>
                <div><p className="text-[11px] text-slatey-500">Payback</p><p className="font-mono text-sm font-semibold text-ink">{pb ? `${pb.toFixed(1)} yr` : ">3 yr"}</p></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slatey-300">
                Recommendation: <span className="font-semibold text-ink">{fundable}</span>. The case {rangeLow > 0 ? "stays NPV-positive across the full ±30% sensitivity band" : baseNpv > 0 ? "is positive at plan but turns negative under adverse assumptions — condition funding on the adoption ramp" : "does not clear the hurdle rate at these assumptions"}. Largest lever: <span className="font-semibold text-ink">{drivers[0].label.toLowerCase()}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="Present the range, not the point" tone="info">
            A single NPV invites a fight about the assumption behind it. A tornado shows you already stress-tested it — and
            names the one driver leadership should actually govern. That&apos;s what moves a case from "interesting" to "funded."
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> I present the range, not the point. Points get challenged; ranges get funded.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Cash flows: year 0 = −investment; year t = annual value × average adoption (linear ramp) − run cost, over {H} years. NPV discounts at the chosen rate; IRR solved by bisection; payback interpolated on undiscounted cumulative flow.</p>
              <p>Tornado varies each driver ±30% and re-computes NPV; bars are sorted by swing and centered on the base NPV. Stack: Next.js (static) + shared design system; client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> a 3-year horizon and a linear adoption ramp are simplifications; real cases model per-year ramps, taxes, and terminal value. It frames the decision and its sensitivity, not an audited model.</p>
        </div>
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">{label}</label><span className="font-mono text-xs font-semibold text-ink">{fmt(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
    </div>
  );
}
