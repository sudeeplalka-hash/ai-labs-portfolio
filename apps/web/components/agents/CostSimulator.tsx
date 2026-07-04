"use client";

// GAP-06 · Prompt Cost & Token Simulator (Collection 2 · toolkit).
// Type a prompt → live token estimate → set volume → monthly + annual cost at
// current published pricing (dated, from @labs/kit) → toggle caching + batching
// and watch the annual figure drop. Unit economics decide build-vs-buy long before
// architecture does. SIMULATED (deterministic arithmetic; pricing in a dated file).

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp } from "@labs/design-system";
import { MODEL_PRICING, modelPrice, modelLabel, COST_LEVERS, PRICING_AS_OF, LIVE_MODEL_CHEAP } from "@labs/kit";

const SAMPLE_PROMPT =
  "You are a card-servicing assistant. Using ONLY the account context and dispute policy below, draft a response to the member's question. Cite the policy sections you rely on, keep it under 120 words, and never invent account details.\n\n[account context ~1,200 tokens]\n[dispute policy excerpt ~1,800 tokens]";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd4 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });
const estTokens = (t: string) => Math.max(1, Math.ceil(t.length / 4));

export function CostSimulator() {
  const [modelId, setModelId] = useState(LIVE_MODEL_CHEAP);
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [outTok, setOutTok] = useState(400);
  const [callsPerDay, setCallsPerDay] = useState(5000);
  const [caching, setCaching] = useState(true);
  const [cacheShare, setCacheShare] = useState(0.6);
  const [batching, setBatching] = useState(false);
  const [batchShare, setBatchShare] = useState(0.3);

  const price = modelPrice(modelId) ?? MODEL_PRICING[0];
  const inTok = estTokens(prompt);
  const callsPerMonth = callsPerDay * 30;

  const inputPerCall = price.inputPerMTok * (inTok / 1e6);
  const outputPerCall = price.outputPerMTok * (outTok / 1e6);
  const basePerCall = inputPerCall + outputPerCall;
  const baseAnnual = basePerCall * callsPerMonth * 12;

  const cacheRatio = price.cachedInputPerMTok !== undefined ? price.cachedInputPerMTok / price.inputPerMTok : 1;
  const effInputPerCall = caching ? inputPerCall * (1 - cacheShare * (1 - cacheRatio)) : inputPerCall;
  const postCachePerCall = effInputPerCall + outputPerCall;
  const batchFactor = batching ? 1 - batchShare * COST_LEVERS.batchDiscount : 1;
  const effPerCall = postCachePerCall * batchFactor;

  const effMonthly = effPerCall * callsPerMonth;
  const effAnnual = effMonthly * 12;
  const savings = baseAnnual - effAnnual;
  const savingsPct = baseAnnual > 0 ? Math.round((savings / baseAnnual) * 100) : 0;
  const cacheable = price.cachedInputPerMTok !== undefined;

  const portfolioPreset = () => {
    setModelId(LIVE_MODEL_CHEAP);
    setCallsPerDay(200000);
    setOutTok(500);
    setCaching(true); setCacheShare(0.7);
    setBatching(true); setBatchShare(0.5);
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-06</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Prompt Cost &amp; Token Simulator</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02", asOf: PRICING_AS_OF, note: `Pricing as of ${PRICING_AS_OF}` }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Architecture debates stall on taste; unit economics settle them. Size a single call, set the volume, and the
            annual number is the build-vs-buy conversation — before anyone draws a box.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Inputs */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Model</p>
              <div className="flex flex-wrap gap-1.5">
                {MODEL_PRICING.map((m) => (
                  <button key={m.id} onClick={() => setModelId(m.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${m.id === modelId ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
                    {modelLabel(m.id)}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Prompt</p>
                <span className="font-mono text-[11px] text-slatey-500">≈ {inTok.toLocaleString()} input tokens</span>
              </div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
                className="w-full rounded-lg border border-line bg-white p-2.5 font-mono text-xs text-slatey-300 outline-none focus:border-primary/50" />
              <p className="mt-1 text-[11px] text-slatey-500">Rough estimate (~4 chars/token). Paste a real prompt to size it.</p>
            </Panel>

            <Panel className="space-y-4">
              <Slider label="Output tokens / call" value={outTok} min={50} max={2000} step={50} onChange={setOutTok} fmt={(v) => v.toLocaleString()} />
              <Slider label="Calls / day" value={callsPerDay} min={100} max={300000} step={100} onChange={setCallsPerDay} fmt={(v) => v.toLocaleString()} />
              <Toggle label="Prompt caching" hint={cacheable ? "Reuse the static context at cache-read price" : "This model has no cache-read price"} on={caching && cacheable} disabled={!cacheable} onChange={setCaching} />
              {caching && cacheable && <Slider label="Cacheable share of input" value={Math.round(cacheShare * 100)} min={0} max={95} step={5} onChange={(v) => setCacheShare(v / 100)} fmt={(v) => `${v}%`} />}
              <Toggle label="Batch eligible" hint="Async workloads at batch discount" on={batching} onChange={setBatching} />
              {batching && <Slider label="Batch-eligible share" value={Math.round(batchShare * 100)} min={0} max={100} step={5} onChange={(v) => setBatchShare(v / 100)} fmt={(v) => `${v}%`} />}
              <button onClick={portfolioPreset} className="text-xs font-semibold text-primary hover:underline">Load portfolio-scale preset →</button>
            </Panel>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Tokens / call" value={(inTok + outTok).toLocaleString()} tone="neutral" interpretation={`${inTok.toLocaleString()} in · ${outTok.toLocaleString()} out`} />
              <KpiCard label="Cost / call" value={usd4.format(effPerCall)} tone="neutral" interpretation={`${modelLabel(modelId)}`} />
              <KpiCard label="Monthly run-rate" value={usd0.format(effMonthly)} tone="watch" interpretation={`${callsPerMonth.toLocaleString()} calls/mo`} />
              <KpiCard label="Annual run-rate" value={usd0.format(effAnnual)} tone={effAnnual > 500000 ? "risk" : "healthy"} interpretation="At current pricing" />
            </div>

            <Panel>
              <p className="stat-label mb-2">Where the money goes</p>
              <Bar label="Input" value={effInputPerCall * callsPerMonth * 12} max={baseAnnual} fmt={usd0.format} tone="bg-primary" />
              <Bar label="Output" value={outputPerCall * callsPerMonth * 12} max={baseAnnual} fmt={usd0.format} tone="bg-teal-500" />
              {savings > 0 && <Bar label="Saved by caching + batching" value={savings} max={baseAnnual} fmt={usd0.format} tone="bg-emerald-500" />}
            </Panel>

            <InsightCard title={savings > 0 ? `Caching + batching cut ${savingsPct}% — ${usd0.format(savings)} / year` : "No leverage applied yet"} tone={savings > 0 ? "success" : "info"}>
              {savings > 0
                ? <>Before leverage this workload runs <span className="font-semibold">{usd0.format(baseAnnual)}</span>/year; after, <span className="font-semibold">{usd0.format(effAnnual)}</span>. The static context you send on every call is the lever — cache it and the input line collapses.</>
                : <>Toggle caching on. Most enterprise prompts carry a large, static context block on every call — pricing it at cache-read rates is where the savings live.</>}
            </InsightCard>
          </div>
        </div>

        {/* Credibility */}
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> Unit economics decide build-vs-buy long before architecture does. Size the call, then argue the design.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stack: Next.js (static) + shared design system; pure client-side arithmetic.</p>
              <p>Pricing lives in a dated config (`@labs/kit`, as of {PRICING_AS_OF}) — never in copy — with a per-model cache-read price. Tokens are estimated at ~4 chars/token.</p>
              <p>Cost/call = input tokens × input price + output tokens × output price. Caching reprices the cacheable share of input at the cache-read rate; batching applies a {Math.round(COST_LEVERS.batchDiscount * 100)}% discount to the eligible share.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> token estimate is approximate (not a real tokenizer); pricing is published list price, not a negotiated rate; excludes retries, tool-call round-trips, and egress. It sizes the decision, not the invoice.</p>
        </div>
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-slatey-400">{label}</label>
        <span className="font-mono text-xs font-semibold text-ink">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function Toggle({ label, hint, on, disabled, onChange }: { label: string; hint: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${disabled ? "cursor-not-allowed border-line bg-slate-50 opacity-70" : on ? "border-primary bg-primary-soft" : "border-line bg-white hover:border-primary/40"}`}>
      <span>
        <span className="block text-xs font-semibold text-ink">{label}</span>
        <span className="block text-[11px] text-slatey-500">{hint}</span>
      </span>
      <span className={`ml-3 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${on ? "bg-primary" : "bg-slate-300"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function Bar({ label, value, max, fmt, tone }: { label: string; value: number; max: number; fmt: (n: number) => string; tone: string }) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex items-center justify-between text-[11px]">
        <span className="text-slatey-400">{label}</span>
        <span className="font-mono font-semibold text-ink">{fmt(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
