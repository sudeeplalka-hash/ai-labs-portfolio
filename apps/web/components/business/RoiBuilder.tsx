"use client";

// C3-5 · AI Business Case and ROI Builder (Collection 3 · gallery).
// Inputs → payback / NPV / IRR → a tornado sensitivity chart (±30% on the drivers)
// → a one-slide exec summary. Single-point ROI is what juniors present; ranges are
// what gets funded. Adoption ramp links conceptually to EL-01. SIMULATED.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cashflows, npv, irr, payback, roiTornado, HORIZON_YEARS, type RoiInputs } from "@labs/engines";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, KpiCard, Badge, LiveBadge, FreshnessStamp, InsightCard, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { C35_USE_CASES, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { NumericControl, EvidenceTable, Delta, useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "./DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

const H = HORIZON_YEARS;

const fmt = (v: number) => (v < 0 ? "-" : "") + (Math.abs(v) >= 1e6 ? `$${(Math.abs(v) / 1e6).toFixed(2)}M` : `$${Math.round(Math.abs(v) / 1000)}k`);

export function RoiBuilder() {
  const [p, setP] = useState<RoiInputs>({ investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 });
  const [baseline, setBaseline] = useState<RoiInputs>({ investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 });
  const set = (k: keyof RoiInputs, v: number) => setP((cur) => ({ ...cur, [k]: v }));
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C35_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C35_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? C35_USE_CASES.find((u) => u.id === id) : null;
    setP(uc ? uc.payload : { investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 });
  };
  const r = p.rate / 100;

  const cf = cashflows(p);
  const baseNpv = npv(cf, r);
  const baseIrr = irr(cf);
  const irrAvailable = cf.some((v) => v < 0) && cf.some((v) => v > 0) && npv(cf, -0.9) * npv(cf, 5) <= 0;
  const irrLabel = irrAvailable ? `${Math.round(baseIrr * 100)}%` : "Not available";
  const baselineCf = cashflows(baseline);
  const baselineNpv = npv(baselineCf, baseline.rate / 100);
  const discounted = cf.map((v, year) => v / (1 + r) ** year);
  const bridge = discounted.map((v, year) => v - baselineCf[year] / (1 + baseline.rate / 100) ** year);
  const pb = payback(cf);

  const drivers = roiTornado(p);

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

  const buildBusinessCase = (): string => {
    const narrative = rangeLow > 0
      ? "stays NPV-positive across the full ±30% sensitivity band"
      : baseNpv > 0
      ? "is positive at plan but turns negative under adverse assumptions, condition funding on the adoption ramp"
      : "does not clear the hurdle rate at these assumptions";
    return [
      `# AI initiative, ${H}-year business case`,
      "",
      `**Recommendation: ${fundable}.**`,
      "",
      "## Headline",
      "",
      "| Metric | Value |",
      "| --- | --- |",
      `| NPV (base) | ${fmt(baseNpv)} @ ${p.rate}% discount |`,
      `| NPV (±30% range) | ${fmt(rangeLow)} to ${fmt(rangeHigh)} |`,
      `| IRR | ${irrLabel} |`,
      `| Payback | ${pb ? `${pb.toFixed(1)} yr` : ">3 yr"} |`,
      "",
      "## Assumptions",
      "",
      `- Upfront investment: ${fmt(p.investment)}`,
      `- Annual value @ full adoption: ${fmt(p.annualValue)}`,
      `- Adoption ramp: ${p.rampMonths} months to full`,
      `- Annual run cost: ${fmt(p.runCost)}`,
      `- Discount rate: ${p.rate}%`,
      "",
      "## Sensitivity (tornado, ±30%)",
      "",
      ...drivers.map((d) => `- **${d.label}**, ${fmt(Math.min(d.low, d.high))} … ${fmt(Math.max(d.low, d.high))} (swing ${fmt(d.swing)})`),
      "",
      "## Recommendation",
      "",
      `${fundable}. The case ${narrative}. Largest lever to govern: **${drivers[0].label.toLowerCase()}**.`,
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`business-case-${activeUc ? activeUc.id : "custom"}`, buildBusinessCase(), {
      scenario: activeUc ? activeUc.title : "Custom inputs",
    });

  const router = useRouter();
  const exportCashflows = () => {
    downloadCsv("roi-cashflows", ["Year", "Cash flow (USD)"], cf.map((c, i) => [i, Math.round(c)]));
    toast("Cash flows exported as CSV");
  };
  const exportTornado = () => {
    downloadCsv("roi-tornado", ["Driver", "NPV low (USD)", "NPV high (USD)", "Swing (USD)"], drivers.map((d) => [d.label, Math.round(d.low), Math.round(d.high), Math.round(d.swing)]));
    toast("Tornado exported as CSV");
  };
  const exportScenario = () => { downloadJson("roi-scenario", { version: 1, ...p }); toast("Scenario exported as JSON"); };
  const exportActions: ExportAction[] = [
    { id: "cf", label: "Cash flows (CSV)", hint: "Year 0..3", onSelect: exportCashflows },
    { id: "tor", label: "Tornado (CSV)", hint: "Driver swings on NPV", onSelect: exportTornado },
    { id: "scn", label: "Export scenario (JSON)", hint: "All assumptions", onSelect: exportScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "exp-cf", label: "Export cash flows (CSV)", group: "export", run: exportCashflows },
    { id: "exp-tor", label: "Export tornado (CSV)", group: "export", run: exportTornado },
    { id: "exp-scn", label: "Export scenario (JSON)", group: "export", run: exportScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  const savedState = { p, baseline };
  const scenarioLink = useScenarioLink({ id: "C3-5", state: savedState, activeId: activeUcId,
    restore: (s) => { setP(s.p); setBaseline(s.baseline); },
    validate: (v): v is typeof savedState => validateScenario(v, { p: (v) => validateScenario(v, { investment: bounded(100000,2000000), annualValue: bounded(200000,5000000), rampMonths: bounded(1,24), runCost: bounded(0,800000), rate: bounded(4,25) }), baseline: (v) => validateScenario(v, { investment: bounded(100000,2000000), annualValue: bounded(200000,5000000), rampMonths: bounded(1,24), runCost: bounded(0,800000), rate: bounded(4,25) }) }),
  });

  return (
    <InstrumentShell title="AI business case and ROI" eyebrow="AI investment & economics" description="Change an assumption and trace its effect on the funding decision."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "C3-5" }]}
      decision={<DecisionSummary title={fundable} explanation={`NPV ${fmt(baseNpv)} at ${p.rate}% discount. The ±30% sensitivity range is ${fmt(rangeLow)} to ${fmt(rangeHigh)}.`} nextAction={`Start with ${drivers[0].label.toLowerCase()}, the largest sensitivity driver.`} tone={rangeLow > 0 ? "positive" : baseNpv > 0 ? "caution" : "negative"} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={C35_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="AI business cases are often fragile because value, adoption, run cost, and implementation effort are uncertain. Funding decisions need to see the range, the payback, and the driver that can break the case." approach="The builder calculates NPV, IRR, payback, run cost impact, adoption ramp, and sensitivity. A tornado view shows which assumption creates the largest swing in value." why="This connects AI funding to financial discipline, value realization, adoption risk, run cost, and executive approval." metric="NPV and payback; the widest tornado bar (the driver the case hinges on)." tradeoff="Optimistic value versus conservative adoption and run cost assumptions." outcome="A fund/defer decision with the fragility named, not hidden in a point estimate." />}
      actions={<ExportMenu actions={exportActions} />}
    >

        <Panel className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">What changed from the pinned baseline</h2><p className="mt-1 text-sm text-slatey-400">Baseline {fmt(baselineNpv)} → current {fmt(baseNpv)}. NPV change: <Delta value={baseNpv - baselineNpv} format={fmt} />.</p></div><div className="flex flex-wrap gap-2"><button className="rounded-lg border border-line px-3 py-2 text-sm" onClick={() => setBaseline({ ...p })}>Pin current baseline</button><button className="rounded-lg border border-line px-3 py-2 text-sm" onClick={() => setP({ ...baseline })}>Restore baseline</button></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{bridge.map((delta, year) => <div key={year} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slatey-500">{year === 0 ? "Upfront investment" : `Year ${year} discounted flow`}</p><p className="mt-1 text-sm font-semibold text-ink"><Delta value={delta} format={fmt} /></p></div>)}</div>
          <p className="mt-3 text-xs text-slatey-500">The four contributions sum exactly to the NPV change before display rounding. Each scenario uses its own discount rate. Sensitivity below varies one input at a time; it is not a probability interval.</p>
          <EvidenceTable caption="Cash flows and exact baseline bridge" headings={["Year", "Baseline cash flow", "Current cash flow", "Current discounted flow", "NPV contribution change"]} rows={cf.map((v, year) => [year, baselineCf[year].toLocaleString("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}), v.toLocaleString("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}), discounted[year].toLocaleString("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}), bridge[year].toLocaleString("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0})])} />
        </Panel>
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Inputs */}
          <Panel className="min-w-0 space-y-4">
            <NumericControl id="roi-investment" label="Investment (upfront)" value={p.investment} min={100000} max={2000000} step={50000} onChange={(v) => set("investment", v)} format={fmt} />
            <NumericControl id="roi-annualValue" label="Annual value @ full adoption" value={p.annualValue} min={200000} max={5000000} step={100000} onChange={(v) => set("annualValue", v)} format={fmt} />
            <NumericControl id="roi-rampMonths" label="Adoption ramp (months to full)" value={p.rampMonths} min={1} max={24} step={1} onChange={(v) => set("rampMonths", v)} format={(v) => `${v} mo`} />
            <NumericControl id="roi-runCost" label="Annual run cost" value={p.runCost} min={0} max={800000} step={20000} onChange={(v) => set("runCost", v)} format={fmt} />
            <NumericControl id="roi-rate" label="Discount rate" value={p.rate} min={4} max={25} step={1} onChange={(v) => set("rate", v)} format={(v) => `${v}%`} />
          </Panel>

          {/* Results */}
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard label={`NPV · ${H}yr`} value={fmt(baseNpv)} tone={baseNpv > 0 ? "healthy" : "critical"} interpretation={`@ ${p.rate}% discount`} />
              <KpiCard label="IRR" value={irrLabel} tone={irrAvailable && baseIrr > r ? "healthy" : "risk"} interpretation={irrAvailable ? "Break-even discount rate" : "No root between −90% and 500%"} />
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
                      <button key={d.label} onClick={() => document.getElementById(`roi-${d.key}`)?.focus()} className="block w-full rounded-lg p-2 text-left hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`${d.label}: sensitivity ${fmt(l)} to ${fmt(hgh)}. Edit this assumption.`}>
                        <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{d.label}</span><span className="font-mono text-slatey-500">{fmt(l)} … {fmt(hgh)}</span></div>
                        <div className="relative h-4 w-full">
                          <div className="absolute top-0.5 h-3 rounded bg-amber-400/80" style={{ left: `${pct(l)}%`, width: `${Math.max(1.5, pct(hgh) - pct(l))}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slatey-500">Dashed line = base NPV {fmt(baseNpv)}. Widest bar = the driver that most moves the case. Select a row to focus its assumption.</p>
              </div>
            </Panel>

            {/* Exec slide */}
            <div className="rounded-xl border-2 border-ink/10 bg-white p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slatey-500">Steering pre read · business case</p>
                <Badge tone={fundTone}>{fundable}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-ink">AI initiative, {H}-year business case</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-center">
                <div><p className="text-[11px] text-slatey-500">NPV (range)</p><p className="font-mono text-sm font-semibold text-ink">{fmt(rangeLow)} to {fmt(rangeHigh)}</p></div>
                <div><p className="text-[11px] text-slatey-500">IRR</p><p className="font-mono text-sm font-semibold text-ink">{irrLabel}</p></div>
                <div><p className="text-[11px] text-slatey-500">Payback</p><p className="font-mono text-sm font-semibold text-ink">{pb ? `${pb.toFixed(1)} yr` : ">3 yr"}</p></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slatey-300">
                Recommendation: <span className="font-semibold text-ink">{fundable}</span>. The case {rangeLow > 0 ? "stays NPV-positive across the full ±30% sensitivity band" : baseNpv > 0 ? "is positive at plan but turns negative under adverse assumptions, condition funding on the adoption ramp" : "does not clear the hurdle rate at these assumptions"}. Largest lever: <span className="font-semibold text-ink">{drivers[0].label.toLowerCase()}</span>.
              </p>
              <div className="mt-3">
                <ArtifactButton label="Download the one pager" onClick={onGenerate} title="Download this business case as Markdown" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Fund, fund with conditions, or defer based on range, sensitivity, and payback." lift="Improves funding discipline by surfacing the driver that can make or break the case." measure="NPV, IRR, payback, sensitivity driver, adoption progress, realized value vs modeled value." />
          <InsightCard title="Present the range, not the point" tone="info">
            A single NPV invites a fight about the assumption behind it. A tornado shows you already stress-tested it, and
            names the one driver leadership should actually govern. That&apos;s what moves a case from &ldquo;interesting&rdquo; to &ldquo;funded.&rdquo;
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Present the range, not only the point. Points get challenged. Ranges with clear assumptions get governed."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Cash flows: year 0 = −investment; year t = annual value × average adoption (linear ramp) − run cost, over {H} years. NPV discounts at the chosen rate; IRR solved by bisection; payback interpolated on undiscounted cumulative flow.</p>
              <p>Tornado varies each driver ±30% and re computes NPV; bars are sorted by swing and centered on the base NPV. Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a portfolio business case artifact. Real funding decisions would require finance validation, benefits ownership, implementation estimates, risk adjustments, and post launch value tracking.</p>
        </div>

      <ToastHost />
      <CommandPalette commands={paletteCommands} />
    </InstrumentShell>
  );
}
