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
import { Panel, KpiCard, Badge, LiveBadge, FreshnessStamp, InsightCard, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { C35_USE_CASES, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

const H = HORIZON_YEARS;

const fmt = (v: number) => (v < 0 ? "-" : "") + (Math.abs(v) >= 1e6 ? `$${(Math.abs(v) / 1e6).toFixed(2)}M` : `$${Math.round(Math.abs(v) / 1000)}k`);

export function RoiBuilder() {
  const [p, setP] = useState<RoiInputs>({ investment: 600000, annualValue: 1_400_000, rampMonths: 9, runCost: 180000, rate: 12 });
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
      `| IRR | ${Math.round(baseIrr * 100)}% |`,
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

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">C3-5</span>
          <div className="ml-auto"><ExportMenu actions={exportActions} /></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">AI Investment Strategy and Portfolio Governance</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">AI Business Case and ROI Builder</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A single ROI number rarely survives executive review. This artifact builds the case as a range, identifies the
            assumption the value depends on most, and turns the analysis into a fund, fund with conditions, or do not fund recommendation. Adoption ramp ties to{" "}
            <Link href="/engagement/adoption" className="font-medium text-primary hover:underline">EL-01</Link>.
          </p>
        </div>

        <UseCaseRail useCases={C35_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="AI business cases are often fragile because value, adoption, run cost, and implementation effort are uncertain. Funding decisions need to see the range, the payback, and the driver that can break the case." approach="The builder calculates NPV, IRR, payback, run cost impact, adoption ramp, and sensitivity. A tornado view shows which assumption creates the largest swing in value." why="This connects AI funding to financial discipline, value realization, adoption risk, run cost, and executive approval." metric="NPV and payback; the widest tornado bar (the driver the case hinges on)." tradeoff="Optimistic value versus conservative adoption and run cost assumptions." outcome="A fund/defer decision with the fragility named, not hidden in a point estimate." />

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
              <KpiCard label="IRR" value={`${Math.round(baseIrr * 100)}%`} tone={baseIrr > r ? "healthy" : "risk"} interpretation="Break even discount rate" />
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
                <p className="font-mono text-[11px] uppercase tracking-widest text-slatey-500">Steering pre read · business case</p>
                <Badge tone={fundTone}>{fundable}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-ink">AI initiative, {H}-year business case</h2>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-[11px] text-slatey-500">NPV (range)</p><p className="font-mono text-sm font-semibold text-ink">{fmt(rangeLow)} to {fmt(rangeHigh)}</p></div>
                <div><p className="text-[11px] text-slatey-500">IRR</p><p className="font-mono text-sm font-semibold text-ink">{Math.round(baseIrr * 100)}%</p></div>
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
            names the one driver leadership should actually govern. That&apos;s what moves a case from "interesting" to "funded."
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
      </main>
      <ToastHost />
      <CommandPalette commands={paletteCommands} />
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
