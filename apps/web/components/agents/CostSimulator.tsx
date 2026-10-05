"use client";

// GAP-06 · Prompt Cost & Token Simulator (Collection 2 · toolkit).
// Type a prompt → live token estimate → set volume → monthly + annual cost at
// current published pricing (dated, from @labs/kit) → toggle caching + batching
// and watch the annual figure drop. Unit economics decide build versus buy long before
// architecture does. SIMULATED (deterministic arithmetic; pricing in a dated file).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callCost, monthlyCost, compareModels, savingsLadder } from "@labs/engines";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { ChangeReceipt, EvidenceTable, signed } from "./AgentExperience";
import { MODEL_PRICING, modelPrice, modelLabel, COST_LEVERS, PRICING_AS_OF, LIVE_MODEL_CHEAP, GAP06_USE_CASES, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

const SAMPLE_PROMPT =
  "You are a card servicing assistant. Using ONLY the account context and dispute policy below, draft a response to the member's question. Cite the policy sections you rely on, keep it under 120 words, and never invent account details.\n\n[account context ~1,200 tokens]\n[dispute policy excerpt ~1,800 tokens]";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd4 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });
const estTokens = (t: string) => Math.max(1, Math.ceil(t.length / 4));

export function CostSimulator() {
  const [modelId, setModelId] = useState<string>(LIVE_MODEL_CHEAP);
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [outTok, setOutTok] = useState(400);
  const [callsPerDay, setCallsPerDay] = useState(5000);
  const [caching, setCaching] = useState(true);
  const [cacheShare, setCacheShare] = useState(0.6);
  const [batching, setBatching] = useState(false);
  const [batchShare, setBatchShare] = useState(0.3);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP06_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP06_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP06_USE_CASES.find((u) => u.id === id) : null;
    if (uc) {
      const p = uc.payload;
      setModelId(p.modelId); setPrompt(p.prompt); setOutTok(p.outTok); setCallsPerDay(p.callsPerDay);
      setCaching(p.caching); setCacheShare(p.cacheShare); setBatching(p.batching); setBatchShare(p.batchShare);
    } else {
      setModelId(LIVE_MODEL_CHEAP); setPrompt(SAMPLE_PROMPT); setOutTok(400); setCallsPerDay(5000);
      setCaching(true); setCacheShare(0.6); setBatching(false); setBatchShare(0.3);
    }
  };

  const price = modelPrice(modelId) ?? MODEL_PRICING[0];
  const inTok = estTokens(prompt);
  const callsPerMonth = callsPerDay * 30;
  const cacheable = price.cachedInputPerMTok !== undefined;
  const spec = { inputTokens: inTok, outputTokens: outTok };
  const levers = { cache: caching && cacheable, cacheShare, batch: batching, batchShare, batchDiscount: COST_LEVERS.batchDiscount };

  const inputPerCall = price.inputPerMTok * (inTok / 1e6);
  const outputPerCall = price.outputPerMTok * (outTok / 1e6);
  const cacheRatio = cacheable ? price.cachedInputPerMTok! / price.inputPerMTok : 1;
  const effInputPerCall = (caching && cacheable) ? inputPerCall * (1 - cacheShare * (1 - cacheRatio)) : inputPerCall;
  const basePerCall = callCost(price, spec, { cache: false, cacheShare: 0, batch: false, batchShare: 0 });
  const baseAnnual = monthlyCost(basePerCall, callsPerDay) * 12;
  const effPerCall = callCost(price, spec, levers);
  const effMonthly = monthlyCost(effPerCall, callsPerDay);
  const effAnnual = effMonthly * 12;
  const savings = baseAnnual - effAnnual;
  const savingsPct = baseAnnual > 0 ? Math.round((savings / baseAnnual) * 100) : 0;
  const comparison = compareModels(MODEL_PRICING, spec, levers, callsPerDay);
  const ladder = savingsLadder(price, spec, levers, callsPerDay);
  const [baseline, setBaseline] = useState(() => ({ monthly: effMonthly, model: modelLabel(modelId), calls: callsPerDay }));
  const batchFactor = 1 - (batching ? batchShare * COST_LEVERS.batchDiscount : 0);
  const billedInput = effInputPerCall * batchFactor * callsPerMonth * 12;
  const billedOutput = outputPerCall * batchFactor * callsPerMonth * 12;

  const portfolioPreset = () => {
    setModelId(LIVE_MODEL_CHEAP);
    setCallsPerDay(200000);
    setOutTok(500);
    setCaching(true); setCacheShare(0.7);
    setBatching(true); setBatchShare(0.5);
  };

  const router = useRouter();
  const exportComparison = () => {
    downloadCsv("token-cost-by-model", ["Model", "Cost per call (USD)", "Monthly (USD)"], comparison.map((r) => [modelLabel(r.id), r.perCall.toFixed(6), Math.round(r.monthly)]));
    toast("Model comparison exported as CSV");
  };
  const exportScenario = () => {
    downloadJson("token-cost-scenario", { version: 1, mode: "SIMULATED", pricingAsOf: PRICING_AS_OF, modelId, prompt, outTok, callsPerDay, caching, cacheShare, batching, batchShare, result: { monthly: effMonthly, annual: effAnnual, savings }, baseline });
    toast("Scenario exported as JSON");
  };
  const exportActions: ExportAction[] = [
    { id: "cmp", label: "Model comparison (CSV)", hint: "This workload priced across models", onSelect: exportComparison },
    { id: "scn", label: "Export scenario (JSON)", hint: "Model + prompt + levers", onSelect: exportScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "act-preset", label: "Load portfolio scale preset", group: "action", keywords: "200k volume", run: portfolioPreset },
    { id: "act-cheapest", label: `Switch to cheapest model (${modelLabel(comparison[0].id)})`, group: "action", keywords: "save cost swap", run: () => setModelId(comparison[0].id) },
    { id: "exp-cmp", label: "Export model comparison (CSV)", group: "export", run: exportComparison },
    { id: "exp-scn", label: "Export scenario (JSON)", group: "export", run: exportScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  return (
    <InstrumentShell title="Prompt Cost and Token Simulator" eyebrow="GAP-06 · Agent architecture" description="Turn a prompt, volume and model choice into a transparent operating-cost estimate."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Prompt Cost and Token Simulator" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Deterministic arithmetic; token counts are estimates" note="Illustrative results support review; they do not establish a production outcome." />} actions={<ExportMenu actions={exportActions} />}>
        <DecisionSummary title={`${usd0.format(effMonthly)} estimated monthly run cost`} explanation={`At ${callsPerDay.toLocaleString()} calls/day using ${modelLabel(modelId)}. Rates are an illustrative snapshot dated ${PRICING_AS_OF}, not a live vendor quote.`} metrics={[{ label: "Annual estimate", value: usd0.format(effAnnual) }, { label: "Cost per call", value: usd4.format(effPerCall) }, { label: "Savings vs same model without levers", value: `${savingsPct}%` }]} />
        <UseCaseRail useCases={GAP06_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Before committing to an architecture, leaders need to know whether the workflow can operate within acceptable cost boundaries. A design that works for a pilot may become uneconomic once volume, prompt size, or frontier model share increases." approach="The simulator converts call structure into estimated annual cost. It shows the effect of model choice, prompt size, volume, caching, batching, and savings levers." why="This connects architecture design to run cost, budget exposure, margin, pricing, and financial approval." metric="Cost per call and monthly run rate; the monthly delta of switching models." tradeoff="The cheapest model is not always adequate; caching adds engineering for a real saving." outcome="A defensible build versus buy number before anyone draws an architecture box." />

        <ChangeReceipt title="Compare with a pinned workload" onPin={() => setBaseline({ monthly: effMonthly, model: modelLabel(modelId), calls: callsPerDay })}>
          <p>Baseline: {baseline.model}, {baseline.calls.toLocaleString()} calls/day, {usd0.format(baseline.monthly)}/month. Current change: {signed(effMonthly - baseline.monthly, 2)} USD/month.</p>
          <p className="mt-1">This comparison captures all changed assumptions; it does not attribute a model/volume change solely to caching.</p>
        </ChangeReceipt>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Inputs */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Model</p>
              <div className="flex flex-wrap gap-1.5">
                {MODEL_PRICING.map((m) => (
                  <button key={m.id} aria-pressed={m.id === modelId} onClick={() => setModelId(m.id)}
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
              <textarea aria-label="Prompt used for token estimate" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
                className="w-full rounded-lg border border-line bg-white p-2.5 font-mono text-xs text-slatey-300 outline-none focus:border-primary/50" />
              <p className="mt-1 text-[11px] text-slatey-500">Rough estimate (~4 chars/token). Paste a real prompt to size it.</p>
            </Panel>

            <Panel className="space-y-4">
              <Slider label="Output tokens / call" value={outTok} min={50} max={2000} step={50} onChange={setOutTok} fmt={(v) => v.toLocaleString()} />
              <Slider label="Calls / day" value={callsPerDay} min={100} max={300000} step={100} onChange={setCallsPerDay} fmt={(v) => v.toLocaleString()} />
              <Toggle label="Prompt caching" hint={cacheable ? "Reuse the static context at cache read price" : "This model has no cache read price"} on={caching && cacheable} disabled={!cacheable} onChange={setCaching} />
              {caching && cacheable && <Slider label="Cacheable share of input" value={Math.round(cacheShare * 100)} min={0} max={95} step={5} onChange={(v) => setCacheShare(v / 100)} fmt={(v) => `${v}%`} />}
              <Toggle label="Batch eligible" hint="Async workloads at batch discount" on={batching} onChange={setBatching} />
              {batching && <Slider label="Batch eligible share" value={Math.round(batchShare * 100)} min={0} max={100} step={5} onChange={(v) => setBatchShare(v / 100)} fmt={(v) => `${v}%`} />}
              <button onClick={portfolioPreset} className="text-xs font-semibold text-primary hover:underline">Load portfolio scale preset →</button>
            </Panel>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Tokens / call" value={(inTok + outTok).toLocaleString()} tone="neutral" interpretation={`${inTok.toLocaleString()} in · ${outTok.toLocaleString()} out`} />
              <KpiCard label="Cost / call" value={usd4.format(effPerCall)} tone="neutral" interpretation={`${modelLabel(modelId)}`} />
              <KpiCard label="Monthly run rate" value={usd0.format(effMonthly)} tone="watch" interpretation={`${callsPerMonth.toLocaleString()} calls/mo`} />
              <KpiCard label="Annual run rate" value={usd0.format(effAnnual)} tone={effAnnual > 500000 ? "risk" : "healthy"} interpretation={`Illustrative rates · ${PRICING_AS_OF}`} />
            </div>

            <Panel>
              <p className="stat-label mb-2">Annual cost: billed input + billed output + savings = list-price baseline</p>
              <Bar label="Input" value={billedInput} max={baseAnnual} fmt={usd0.format} tone="bg-primary" />
              <Bar label="Output" value={billedOutput} max={baseAnnual} fmt={usd0.format} tone="bg-teal-500" />
              {savings > 0 && <Bar label="Saved by caching + batching" value={savings} max={baseAnnual} fmt={usd0.format} tone="bg-emerald-500" />}
              <p className="mt-2 text-xs text-slatey-400">Dollar labels round independently. The exact cost bridge below retains the calculated values.</p>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">This workload priced across models <span className="font-normal text-slatey-500">· monthly, cheapest first</span></p>
              {(() => {
                const maxM = Math.max(...comparison.map((r) => r.monthly)) || 1;
                const cheapest = comparison[0];
                const curRow = comparison.find((r) => r.id === modelId);
                return (
                  <>
                    <div className="space-y-1.5">
                      {comparison.map((r) => {
                        const isCur = r.id === modelId;
                        return (
                          <button key={r.id} aria-pressed={r.id === modelId} onClick={() => setModelId(r.id)} className="block w-full text-left">
                            <div className="mb-0.5 flex items-center justify-between text-[11px]">
                              <span className={isCur ? "font-semibold text-ink" : "text-slatey-400"}>{modelLabel(r.id)}{r.id === cheapest.id && <span className="text-emerald-700"> · cheapest</span>}{isCur && <span className="text-primary"> · current</span>}</span>
                              <span className="font-mono text-slatey-500">{usd0.format(r.monthly)}/mo</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${isCur ? "bg-primary" : r.id === cheapest.id ? "bg-emerald-500" : "bg-slate-400"}`} style={{ width: `${(r.monthly / maxM) * 100}%` }} /></div>
                          </button>
                        );
                      })}
                    </div>
                    {modelId !== cheapest.id && curRow && (
                      <p className="mt-2 text-[11px] text-slatey-500">Switching to <span className="font-semibold text-ink">{modelLabel(cheapest.id)}</span> saves <span className="font-semibold text-emerald-700">{usd0.format(curRow.monthly - cheapest.monthly)}/mo</span> on this workload, weigh against answer quality for your job.</p>
                    )}
                  </>
                );
              })()}
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Savings ladder <span className="font-normal text-slatey-500">· monthly, cumulative leverage</span></p>
              <div className="space-y-1.5">
                {ladder.map((st, i) => {
                  const maxM = ladder[0].monthly || 1;
                  return (
                    <div key={st.label}>
                      <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{st.label}</span><span className="font-mono text-slatey-500">{usd0.format(st.monthly)}{st.savedPct > 0 && <span className="text-emerald-700"> · −{st.savedPct}%</span>}</span></div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${i === 0 ? "bg-slate-400" : "bg-emerald-500"}`} style={{ width: `${(st.monthly / maxM) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <InsightCard title={savings > 0 ? `Caching + batching cut ${savingsPct}%, ${usd0.format(savings)} / year` : "No leverage applied yet"} tone={savings > 0 ? "success" : "info"}>
              {savings > 0
                ? <>Before leverage this workload runs <span className="font-semibold">{usd0.format(baseAnnual)}</span>/year; after, <span className="font-semibold">{usd0.format(effAnnual)}</span>. The static context you send on every call is the lever, cache it and the input line collapses.</>
                : <>Toggle caching on. Most enterprise prompts carry a large, static context block on every call, pricing it at cache read rates is where the savings live.</>}
            </InsightCard>
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Read the exact cost bridge and rates</summary>
          <EvidenceTable caption="Monthly savings bridge — successive reductions, not additive percentages" headers={["Stage", "Monthly cost", "Reduction from preceding stage"]} rows={ladder.map((stage, index) => [stage.label, usd4.format(stage.monthly), index ? usd4.format(ladder[index - 1].monthly - stage.monthly) : "Baseline"])} />
          <EvidenceTable caption={`Illustrative rates dated ${PRICING_AS_OF}`} headers={["Model", "Input USD/1M", "Output USD/1M", "Cached input USD/1M"]} rows={MODEL_PRICING.map((model) => [modelLabel(model.id), model.inputPerMTok, model.outputPerMTok, model.cachedInputPerMTok ?? "Not supplied"])} />
          <p className="text-sm text-slatey-400">Caching changes the eligible input component first. Batching discounts the eligible share of the remaining total. Savings percentages share the list-price baseline and must not be added.</p>
        </details>
        {/* Credibility */}
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Use unit economics to constrain architecture decisions before scaling." lift="Prevents designs that are technically viable but financially fragile." measure="Cost per task, annual run rate, cache hit rate, batching savings, cost per successful outcome." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Size the call before arguing the architecture. Unit economics often settles the design debate earlier than a diagram does."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stack: Next.js (static) + shared design system; pure client side arithmetic.</p>
              <p>Pricing lives in a dated config (`@labs/kit`, as of {PRICING_AS_OF}), never in copy, with a per-model cache-read price. Tokens are estimated at ~4 chars/token.</p>
              <p>Cost/call = input tokens × input price + output tokens × output price. Caching reprices the cacheable share of input at the cache read rate; batching applies a {Math.round(COST_LEVERS.batchDiscount * 100)}% discount to the eligible share.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this artifact uses modeled pricing and assumptions. Production forecasting would require current vendor pricing, actual traffic patterns, utilization data, and finance approved costing rules.</p>
        </div>
      <ToastHost />
      <CommandPalette commands={paletteCommands} />
    </InstrumentShell>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-slatey-400">{label}</label>
        <span className="font-mono text-xs font-semibold text-ink">{fmt(value)}</span>
      </div>
      <label className="mb-2 flex items-center gap-2 text-xs text-slatey-400">Exact value<input type="number" aria-label={`${label} exact value`} min={min} max={max} step={step} value={value} onChange={(event) => { const next = event.target.valueAsNumber; if (Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next))); }} className="min-h-11 w-32 rounded border border-line p-2 text-ink" /></label>
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function Toggle({ label, hint, on, disabled, onChange }: { label: string; hint: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button aria-pressed={on} onClick={() => !disabled && onChange(!on)} disabled={disabled}
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
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
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
