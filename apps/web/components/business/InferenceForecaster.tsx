"use client";

// C3-3 · Inference Run Rate Forecaster (Collection 3 · gallery).
// Portfolio-level run rate over 24 months: API (grows with volume) vs self-host
// (fixed capacity that steps up), with the crossover CLIFF marked. Self-host cost =
// hardware amortization + utilization + ops headcount, all visible. Distinct
// altitude from GAP-06 (portfolio vs per-call). SIMULATED, stated formulas.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forecastRunRate, cliffSensitivity } from "@labs/engines";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { C33_USE_CASES, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { NumericControl, EvidenceTable, useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "./DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

const CLUSTER_CAP_TOKENS = 2.5e9; // tokens/month per cluster at 100% utilization
const CLUSTER_COST = 38000; // $/month amortized (hardware + power + DC)
const OPS_COST_PER_FTE = 22000; // $/month loaded
const CHEAP_PRICE = 3; // $ / 1M tokens (blended in+out)
const FRONTIER_PRICE = 18;

const fmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

export function InferenceForecaster() {
  const [month, setMonth] = useState(1);
  const [startVol, setStartVol] = useState(500_000); // calls/mo
  const [growth, setGrowth] = useState(6); // %/mo
  const [tokensPerCall, setTokensPerCall] = useState(3000);
  const [frontierShare, setFrontierShare] = useState(40); // %
  const [util, setUtil] = useState(60); // %
  const [opsFte, setOpsFte] = useState(1.5);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C33_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C33_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? C33_USE_CASES.find((u) => u.id === id) : null;
    const p = uc ? uc.payload : { startVol: 500_000, growth: 6, tokensPerCall: 3000, frontierShare: 40, util: 60, opsFte: 1.5 };
    setStartVol(p.startVol); setGrowth(p.growth); setTokensPerCall(p.tokensPerCall); setFrontierShare(p.frontierShare); setUtil(p.util); setOpsFte(p.opsFte);
  };

  const fp = { startVol, growthPct: growth, tokensPerCall, frontierShare, utilPct: util, opsFte, cheapPrice: CHEAP_PRICE, frontierPrice: FRONTIER_PRICE, clusterCapTokens: CLUSTER_CAP_TOKENS, clusterCost: CLUSTER_COST, opsCostPerFte: OPS_COST_PER_FTE, months: 24 };
  const forecast = forecastRunRate(fp);
  const { api, self, apiCum, selfCum } = forecast;
  const cliff = forecast.cliffMonth ?? -1; // -1 = no crossover inside the horizon
  const sensitivity = cliffSensitivity(fp, [
    { key: "growthPct", label: `Growth \u2192 ${growth + 6}%/mo`, to: growth + 6 },
    { key: "frontierShare", label: `Frontier share \u2192 ${Math.max(0, frontierShare - 20)}%`, to: Math.max(0, frontierShare - 20) },
    { key: "tokensPerCall", label: `Tokens/call \u2192 ${Math.round(tokensPerCall * 1.5).toLocaleString()}`, to: Math.round(tokensPerCall * 1.5) },
    { key: "utilPct", label: `Utilization \u2192 ${Math.min(100, util + 25)}%`, to: Math.min(100, util + 25) },
  ]);

  const W = 720, H = 220, PAD = 40;
  const maxY = Math.max(...api, ...self);
  const xf = (i: number) => PAD + (i / 23) * (W - PAD * 2);
  const yf = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2);
  const poly = (arr: number[]) => arr.map((v, i) => `${xf(i).toFixed(1)},${yf(v).toFixed(1)}`).join(" ");

  const router = useRouter();
  const exportForecast = () => {
    downloadCsv("inference-forecast", ["Month", "API (USD)", "Self-host (USD)"], api.map((a, i) => [i + 1, Math.round(a), Math.round(self[i])]));
    toast("24-month forecast exported as CSV");
  };
  const exportScenario = () => {
    downloadJson("inference-forecast-scenario", { version: 1, startVol, growth, tokensPerCall, frontierShare, util, opsFte });
    toast("Scenario exported as JSON");
  };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "24-month forecast (CSV)", hint: "API vs self host per month", onSelect: exportForecast },
    { id: "scn", label: "Export scenario (JSON)", hint: "All assumptions", onSelect: exportScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "exp-csv", label: "Export 24-month forecast (CSV)", group: "export", run: exportForecast },
    { id: "exp-json", label: "Export scenario (JSON)", group: "export", run: exportScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  const savedState = { startVol, growth, tokensPerCall, frontierShare, util, opsFte, month };
  const scenarioLink = useScenarioLink({ id: "C3-3", state: savedState, activeId: activeUcId,
    restore: (s) => { setStartVol(s.startVol); setGrowth(s.growth); setTokensPerCall(s.tokensPerCall); setFrontierShare(s.frontierShare); setUtil(s.util); setOpsFte(s.opsFte); setMonth(s.month); },
    validate: (v): v is typeof savedState => validateScenario(v, { startVol: bounded(100000,5000000), growth: bounded(0,20), tokensPerCall: bounded(500,8000), frontierShare: bounded(0,100), util: bounded(20,100), opsFte: bounded(0.5,5), month: (v) => Number.isInteger(v) && bounded(1,24)(v) }),
  });

  return (
    <InstrumentShell title="Inference run-rate forecaster" eyebrow="AI investment & economics" description="Inspect each month of API and self-host cost before making a platform commitment."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "C3-3" }]}
      decision={<DecisionSummary title={cliff >= 0 ? `Self-host first undercuts API in month ${cliff + 1}` : "No monthly crossover in 24 months"} explanation={`24-month total: API ${fmt(apiCum)}; self-host ${fmt(selfCum)}. A monthly crossover does not by itself recover earlier spend.`} nextAction="Pin a month below, then test utilization and volume. Prices are explicit illustrative assumptions, not current vendor quotes." />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={C33_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="API usage offers flexibility, but cost scales with volume. Self hosting can reduce marginal cost after utilization reaches the right level, but it introduces fixed capacity, operations, infrastructure, and talent requirements, and the decision depends on utilization more than sticker price." approach="The forecaster projects API and self hosted costs across 24 months. It marks the crossover point and shows how growth, token volume, frontier model share, utilization, and staffing assumptions move the decision." why="This connects AI operating strategy to budget planning, unit economics, platform investment, infrastructure commitments, and cost governance." metric="The crossover month; 24-month cumulative cost each way." tradeoff="API is flexible pay per use; self host is fixed capacity that only amortizes past the crossover." outcome="The crossover month with the assumption that moves it most made explicit." />}
      actions={<ExportMenu actions={exportActions} />}
    >

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Inputs */}
          <Panel className="min-w-0 space-y-4">
            <NumericControl label="Starting volume" value={startVol} min={100000} max={5000000} step={100000} onChange={setStartVol} format={(v) => `${(v / 1e6).toFixed(1)}M/mo`} />
            <NumericControl label="Monthly growth" value={growth} min={0} max={20} step={1} onChange={setGrowth} format={(v) => `${v}%`} />
            <NumericControl label="Tokens / call" value={tokensPerCall} min={500} max={8000} step={100} onChange={setTokensPerCall} format={(v) => v.toLocaleString()} />
            <NumericControl label="Share on frontier model" value={frontierShare} min={0} max={100} step={5} onChange={setFrontierShare} format={(v) => `${v}%`} />
            <NumericControl label="Self host utilization" value={util} min={20} max={95} step={5} onChange={setUtil} format={(v) => `${v}%`} />
            <NumericControl label="Ops headcount (FTE)" value={opsFte} min={0.5} max={5} step={0.5} onChange={setOpsFte} format={(v) => `${v}`} />
          </Panel>

          {/* Chart + KPIs */}
          <div className="min-w-0 space-y-4">
            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Monthly run rate · 24 months</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rose-500" /> API</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-teal-600" /> Self host</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-0" role="img" aria-label="API vs self-host monthly run rate over 24 months">
                  <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e4e7eb" />
                  <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#e4e7eb" />
                  {cliff >= 0 && (
                    <g>
                      <line x1={xf(cliff)} y1={PAD} x2={xf(cliff)} y2={H - PAD} stroke="#152433" strokeDasharray="3 3" strokeOpacity="0.5" />
                      <circle cx={xf(cliff)} cy={yf(self[cliff])} r="4" fill="#152433" />
                      <text x={xf(cliff)} y={PAD - 6} textAnchor="middle" className="fill-ink" fontSize="11" fontWeight="600">cliff · mo {cliff + 1}</text>
                    </g>
                  )}
                  <line x1={xf(month - 1)} x2={xf(month - 1)} y1={PAD} y2={H - PAD} stroke="#64748b" strokeDasharray="2 4" />
                  <circle cx={xf(month - 1)} cy={yf(api[month - 1])} r="5" fill="#e24b4a" />
                  <circle cx={xf(month - 1)} cy={yf(self[month - 1])} r="5" fill="#0d9488" />
                  <polyline points={poly(api)} fill="none" stroke="#e24b4a" strokeWidth="2.5" />
                  <polyline points={poly(self)} fill="none" stroke="#0d9488" strokeWidth="2.5" />
                  <text x={PAD} y={H - PAD + 14} className="fill-slate-400" fontSize="10">mo 1</text>
                  <text x={W / 2} y={H - PAD + 14} textAnchor="middle" className="fill-slate-400" fontSize="10">mo 12</text>
                  <text x={W - PAD} y={H - PAD + 14} textAnchor="end" className="fill-slate-400" fontSize="10">mo 24</text>
                  <text x={PAD - 6} y={PAD + 4} textAnchor="end" className="fill-slate-400" fontSize="10">{fmt(maxY)}</text>
                </svg>
              </div>
              <NumericControl label="Inspect month" value={month} min={1} max={24} onChange={setMonth} format={(v) => `Month ${v}`} />
              <div className="mt-3 rounded-lg border border-line bg-slate-50 p-3 text-sm" aria-live="polite"><strong>Month {month}:</strong> API {fmt(api[month - 1])}; self-host {fmt(self[month - 1])}. {api[month - 1] >= self[month - 1] ? "Self-host is lower" : "API is lower"} by {fmt(Math.abs(api[month - 1] - self[month - 1]))} for this month.</div>
              <EvidenceTable caption="All 24 monthly values" headings={["Month", "API (USD/month)", "Self-host (USD/month)", "Lower monthly cost"]} rows={api.map((cost, i) => [i + 1, Math.round(cost).toLocaleString(), Math.round(self[i]).toLocaleString(), cost < self[i] ? "API" : "Self-host"])} />
            </Panel>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard label="The cliff" value={cliff >= 0 ? `Mo ${cliff + 1}` : "N/A"} tone={cliff >= 0 ? "watch" : "healthy"} interpretation={cliff >= 0 ? "Self-host undercuts API" : "Beyond 24 mo"} />
              <KpiCard label="API · 24-mo total" value={fmt(apiCum)} tone="neutral" interpretation="Cumulative" />
              <KpiCard label="Self host · 24 mo total" value={fmt(selfCum)} tone="neutral" interpretation="Cumulative" />
            </div>

            <Panel>
              <p className="stat-label mb-2">Crossover sensitivity <span className="font-normal text-slatey-500">· crossover under each single move</span></p>
              <ul className="space-y-1.5">
                {sensitivity.map((lv) => (
                  <li key={lv.key} className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 text-xs">
                    <span className="text-slatey-300">{lv.label}</span>
                    <span className="font-mono text-slatey-500">
                      {lv.cliffMonth === null ? "no cliff" : `mo ${lv.cliffMonth + 1}`}
                      {lv.delta !== null && lv.delta < 0 && <span className="ml-1 text-emerald-700">({lv.delta} mo)</span>}
                      {lv.delta !== null && lv.delta > 0 && <span className="ml-1 text-rose-600">(+{lv.delta} mo)</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[10px] text-slatey-500">Each row recomputes the crossover with one assumption changed, earlier (green) means self-host monthly cost first undercuts API sooner; cumulative payback may differ.</p>
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={cliff >= 0 ? `The cliff is at month ${cliff + 1}` : "No cliff inside 24 months"} tone={cliff >= 0 ? "warn" : "success"}>
            {cliff >= 0
              ? <>Self-host first undercuts API in month {cliff + 1}. Later cluster additions can reverse that ordering; inspect every month and the 24-month totals before treating the crossover as a commitment.</>
              : <>At these assumptions API stays cheaper for all 24 months. Inspect volume, model mix and utilization independently; each can change the relative economics.</>}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Revisit inference strategy when volume and utilization make the run rate materially different from the pilot economics." lift="Avoids both premature self hosting and uncontrolled API spend." measure="Monthly run rate, cumulative 24 month cost, utilization, cost per task, crossover month." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The crossover is not decided by vendor claims. It is decided by utilization, growth, and the share of workloads that truly need higher cost models."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built &amp; assumptions</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>API/mo = volume × tokens/call × blended price (${CHEAP_PRICE} to ${FRONTIER_PRICE}/1M tokens by frontier share). Volume compounds at the monthly growth rate.</p>
              <p>Self host/mo = ⌈tokens ÷ (cluster capacity {(CLUSTER_CAP_TOKENS / 1e9).toFixed(1)}B × utilization)⌉ × ${(CLUSTER_COST / 1000)}k amortized + ops FTE × ${(OPS_COST_PER_FTE / 1000)}k. The cliff is the first month self-host &lt; API.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this model uses simplified cost assumptions. Production forecasting would require current pricing, workload profiles, infrastructure benchmarks, reliability requirements, and finance approved cost allocation.</p>
        </div>

      <ToastHost />
      <CommandPalette commands={paletteCommands} />
    </InstrumentShell>
  );
}
