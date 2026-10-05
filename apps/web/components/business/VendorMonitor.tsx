"use client";

// C3-4 · Vendor Evaluation & Risk Monitor (Collection 3 · gallery).
// Score three archetype vendors on a weighted matrix; move the weights and the
// ranking flips, that fragility is the point. Then flip to the risk view:
// concentration, renewal timeline, exit cost. The scorecard picks the vendor; the
// concentration view tells you what it costs to be wrong. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { C34_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { EvidenceTable, NumericControl, useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "./DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type CKey = "capability" | "security" | "roadmap" | "lockin" | "support" | "price";
const CRITERIA: { key: CKey; label: string }[] = [
  { key: "capability", label: "Capability" }, { key: "security", label: "Security" }, { key: "roadmap", label: "Roadmap" },
  { key: "lockin", label: "Low lock in" }, { key: "support", label: "Support" }, { key: "price", label: "Price / value" },
];

interface Vendor { key: string; label: string; blurb: string; scores: Record<CKey, number>; exitCost: number; renewal: number; concentration: number }
const VENDORS: Vendor[] = [
  { key: "hyper", label: "Hyperscaler", blurb: "Broad platform, deep integration, real lock in.", scores: { capability: 85, security: 88, roadmap: 82, lockin: 45, support: 78, price: 60 }, exitCost: 480000, renewal: 14, concentration: 75 },
  { key: "spec", label: "Specialist", blurb: "Best in class capability, narrower surface.", scores: { capability: 90, security: 80, roadmap: 88, lockin: 60, support: 85, price: 55 }, exitCost: 240000, renewal: 9, concentration: 55 },
  { key: "oss", label: "Open-source-backed", blurb: "Portable, cheaper, thinner support.", scores: { capability: 78, security: 75, roadmap: 80, lockin: 85, support: 65, price: 82 }, exitCost: 90000, renewal: 20, concentration: 45 },
];

type Weights = Record<CKey, number>;
const PRESETS: Record<string, Weights> = {
  Balanced: { capability: 25, security: 20, roadmap: 15, lockin: 15, support: 10, price: 15 },
  "Cost-sensitive": { capability: 15, security: 10, roadmap: 10, lockin: 20, support: 10, price: 35 },
  "Security-first": { capability: 25, security: 35, roadmap: 15, lockin: 10, support: 10, price: 5 },
};
const fmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

export function VendorMonitor() {
  const [selectedVendor, setSelectedVendor] = useState(VENDORS[0].key);
  const [w, setW] = useState<Weights>(PRESETS.Balanced);
  const [view, setView] = useState<"scorecard" | "risk">("scorecard");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C34_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C34_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? C34_USE_CASES.find((u) => u.id === id) : null;
    setW(uc ? uc.payload.weights : PRESETS.Balanced);
  };

  const rawWeightSum = CRITERIA.reduce((a, c) => a + w[c.key], 0);
  const sumW = rawWeightSum || 1;
  const inspected = VENDORS.find((v) => v.key === selectedVendor) ?? VENDORS[0];
  const scoreOf = (v: Vendor) => Math.round(CRITERIA.reduce((a, c) => a + w[c.key] * v.scores[c.key], 0) / sumW);
  const ranked = [...VENDORS].map((v) => ({ v, s: scoreOf(v) })).sort((a, b) => b.s - a.s);
  const top = ranked[0];

  const applyPreset = (name: string) => { setW(PRESETS[name]); setActiveUcId(null); };
  const setWeight = (k: CKey, val: number) => setW((cur) => ({ ...cur, [k]: val }));

  const savedState = { w, view, selectedVendor };
  const scenarioLink = useScenarioLink({ id: "C3-4", state: savedState, activeId: activeUcId,
    restore: (s) => { setW(s.w); setView(s.view); setSelectedVendor(s.selectedVendor); },
    validate: (v): v is typeof savedState => validateScenario(v, { selectedVendor: oneOf(VENDORS.map((v) => v.key)), w: (v) => validateScenario(v, Object.fromEntries(CRITERIA.map((c) => [c.key, bounded(0,40)]))), view: oneOf(["scorecard","risk"]) }),
  });

  return (
    <InstrumentShell title="Vendor fit and exit exposure" eyebrow="AI investment & economics" description="Make the vendor choice with its concentration and switching cost visible."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "C3-4" }]}
      decision={<DecisionSummary title={!rawWeightSum ? "Set at least one decision weight" : top.s === ranked[1].s ? `Tied lead: ${top.v.label} and ${ranked[1].v.label}` : `Leading fit: ${top.v.label}`} explanation={`Score ${top.s}/100, ${top.s - ranked[1].s} points ahead of ${ranked[1].v.label}. Exit exposure ${fmt(top.v.exitCost)}; concentration ${top.v.concentration}%.`} nextAction="Inspect a vendor, then vary the decision weights to test whether the ranking holds." tone={top.v.exitCost > 300000 ? "caution" : "neutral"} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={C34_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="The best scoring vendor may also introduce lock in, concentration, or renewal exposure. Executive decisions need both views: which vendor fits the need and what it costs if the relationship, roadmap, or pricing changes." approach="The monitor compares vendor archetypes across capability, security, roadmap, lock in, support, and price. It then adds a risk view that shows concentration, renewal exposure, and estimated exit cost." why="This connects AI sourcing to procurement, third party risk, resiliency, cost exposure, roadmap dependency, and negotiating leverage." metric="Weighted vendor score; switching/exit cost exposure if the relationship sours." tradeoff="The best fit vendor may also be the biggest concentration risk." outcome="A vendor pick with the exit cost exposure named up front." />}

    >

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Weights */}
          <Panel className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="stat-label">Weights</p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(PRESETS).map((p) => (
                  <button key={p} onClick={() => applyPreset(p)} className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-slatey-400 hover:border-amber-400/50 hover:text-ink">{p}</button>
                ))}
              </div>
            </div>
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div className="mb-0.5 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">{c.label}</label><span className="font-mono text-xs font-semibold text-ink">{Math.round((w[c.key] / sumW) * 100)}%</span></div>
                <input type="range" aria-label={c.label} min={0} max={40} step={1} value={w[c.key]} onChange={(e) => setWeight(c.key, Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
            ))}
          </Panel>

          {/* Ranking / risk */}
          <div className="min-w-0 space-y-4">
            <div className="flex gap-1.5">
              {(["scorecard", "risk"] as const).map((vv) => (
                <button key={vv} aria-pressed={view === vv} onClick={() => setView(vv)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${vv === view ? "border-amber-500 bg-amber-500 text-white" : "border-line bg-white text-slatey-400 hover:border-amber-400/50 hover:text-ink"}`}>{vv}</button>
              ))}
            </div>

            {view === "scorecard" ? (
              <Panel className="space-y-3">
                {ranked.map(({ v, s }, i) => (
                  <div key={v.key} className={`rounded-lg border p-3 ${i === 0 ? "border-emerald-400 ring-1 ring-emerald-400/40" : "border-line"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="font-mono text-xs text-slatey-500">#{i + 1}</span><p className="text-sm font-semibold text-ink">{v.label}</p>{i === 0 && rawWeightSum > 0 && <Badge tone="emerald">Leading score</Badge>}</div>
                      <span className="font-mono text-lg font-semibold text-ink">{s}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slatey-500">{v.blurb}</p><button className="mt-2 rounded-lg border border-line px-3 py-2 text-sm text-primary" aria-pressed={selectedVendor === v.key} onClick={() => setSelectedVendor(v.key)}>Inspect {v.label}</button>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-400"}`} style={{ width: `${s}%` }} /></div>
                  </div>
                ))}
              </Panel>
            ) : (
              <Panel className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Vendor</th><th>Concentration</th><th>Renewal</th><th>Exit cost</th></tr></thead>
                  <tbody>
                    {ranked.map(({ v }, i) => (
                      <tr key={v.key} className={i === 0 ? "bg-amber-50/50" : ""}>
                        <td className="font-medium text-ink">{v.label}{i === 0 && <span className="ml-1 text-[10px] text-amber-700">(top pick)</span>}</td>
                        <td>{v.concentration > 65 ? <Badge tone="rose">{v.concentration}%</Badge> : v.concentration > 50 ? <Badge tone="amber">{v.concentration}%</Badge> : <span className="text-slatey-400">{v.concentration}%</span>}</td>
                        <td>{v.renewal} mo</td>
                        <td className={v.exitCost > 300000 ? "font-semibold text-rose-600" : "text-slatey-300"}>{fmt(v.exitCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-slatey-500">Concentration = share of AI spend on that vendor if chosen primary. Exit cost tracks lock in.</p>
              </Panel>
            )}
          </div>
        </div>

        <Panel className="mt-4"><h2 className="text-base font-semibold text-ink">{inspected.label}: fit and exit receipt</h2><p className="mt-2 text-sm text-slatey-400">Weighted score {scoreOf(inspected)}/100 · concentration {inspected.concentration}% · renewal in {inspected.renewal} months · exit cost {fmt(inspected.exitCost)}.</p>{rawWeightSum === 0 && <p role="alert" className="mt-2 text-sm text-amber-800">All weights are zero. No vendor can be recommended until a criterion has weight.</p>}<EvidenceTable caption="Criterion scores and contribution to ranking" headings={["Criterion", "Normalized weight", "Vendor score", "Weighted contribution"]} rows={CRITERIA.map((c) => [c.label, `${(w[c.key] / sumW * 100).toFixed(1)}%`, inspected.scores[c.key], (w[c.key] * inspected.scores[c.key] / sumW).toFixed(2)])} /><p className="mt-2 text-xs text-slatey-500">These are authored vendor archetypes. A close ranking calls for stronger evidence and a switching plan before a procurement decision.</p></Panel>

        <div className="mt-6">
          <InsightCard title={rawWeightSum ? `Leading score: ${top.v.label}, exit cost ${fmt(top.v.exitCost)}` : "No weighted decision yet"} tone={top.v.exitCost > 300000 ? "warn" : "info"}>
            Nudge two or three weights and the ranking can flip, a &ldquo;winner&rdquo; that survives only one weighting isn&apos;t a
            decision, it&apos;s a preference. Pair the pick with its concentration and exit cost before you sign.
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Choose the vendor with both fit and exit exposure visible." lift="Reduces hidden concentration risk by treating vendor choice as an operating dependency, not just a feature comparison." measure="Weighted score, concentration exposure, exit cost, renewal timing, switching feasibility." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The scorecard tells you who wins. The risk view tells you what it costs if the winner becomes wrong."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Weighted score = Σ(weight × criterion score) ÷ Σ(weights), so weights are relative and always normalize to 100%. Lock in and price are scored so higher = better (less lock in, better value).</p>
              <p>Risk view pairs each vendor with concentration (spend share if primary), renewal window, and exit cost (tracks lock in). Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a simplified vendor model. Real vendor selection would require procurement terms, security review, architecture fit, legal review, financial analysis, and operational due diligence.</p>
        </div>

    </InstrumentShell>
  );
}
