"use client";

// EL-03 · Capacity & Resourcing Planner (Collection 4 · control room).
// Portfolio demand vs a ~30-person skill inventory. The heatmap flags where you're
// over-allocated, not on headcount, on specific skills, and hire / contract /
// upskill toggles move the delivery date and cost live. Capacity plans fail on
// skills, not headcount: thirty people ≠ thirty people. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { EL03_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "../business/DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type Res = "none" | "hire" | "contract" | "upskill";
interface Skill { key: string; label: string; capacity: number; demand: number }

const SKILLS: Skill[] = [
  { key: "ml", label: "ML Engineering", capacity: 6, demand: 9 },
  { key: "data", label: "Data Engineering", capacity: 5, demand: 7 },
  { key: "mlops", label: "MLOps / Platform", capacity: 4, demand: 4 },
  { key: "delivery", label: "Delivery / PM", capacity: 5, demand: 4 },
  { key: "sme", label: "Domain SME", capacity: 6, demand: 5 },
  { key: "qa", label: "QA / Eval", capacity: 4, demand: 6 },
];

const LEAD: Record<Exclude<Res, "none">, number> = { hire: 6, contract: 1, upskill: 4 }; // weeks
const RATE: Record<Exclude<Res, "none">, number> = { hire: 18, contract: 28, upskill: 8 }; // $k / FTE / month
const RES_OPTS: Exclude<Res, "none">[] = ["hire", "contract", "upskill"];
const BASE_WEEKS = 20;
const BASE_MONTHLY = 30 * 16; // $k (30 FTE × $16k loaded)

export function CapacityPlanner() {
  const [res, setRes] = useState<Record<string, Res>>({});
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL03_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL03_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const skills: Skill[] = activeUc ? activeUc.payload.skills : SKILLS;
  const baseWeeks = activeUc ? activeUc.payload.baseWeeks : BASE_WEEKS;
  const baseMonthly = activeUc ? activeUc.payload.baseMonthly : BASE_MONTHLY;
  const teamLabel = activeUc ? activeUc.payload.teamLabel : "30 FTE";
  const selectUseCase = (id: string | null) => { setActiveUcId(id); setRes({}); };

  const rows = skills.map((s) => {
    const gap = Math.max(0, s.demand - s.capacity);
    const r = res[s.key] ?? "none";
    const added = gap > 0 && r !== "none" ? gap : 0;
    const effCap = s.capacity + added;
    const util = s.demand / effCap;
    return { ...s, gap, r, effCap, util };
  });

  const utilizationScale = Math.max(1.5, ...rows.map((row) => row.demand / row.capacity));
  const gapRows = rows.filter((r) => r.gap > 0);
  let slip = 0;
  let addedCost = 0;
  for (const r of gapRows) {
    if (r.r !== "none") { slip = Math.max(slip, LEAD[r.r]); addedCost += r.gap * RATE[r.r]; }
    else slip = Math.max(slip, Math.round((r.demand / r.capacity - 1) * baseWeeks));
  }
  const deliveryWeeks = baseWeeks + slip;
  const monthly = baseMonthly + addedCost;
  const unresolvedRows = gapRows.filter((r) => r.r === "none");
  const unresolved = unresolvedRows.length;
  const totalGap = unresolvedRows.reduce((total, row) => total + row.gap, 0);
  const bottleneck = [...unresolvedRows].sort((a, b) => b.demand / b.capacity - a.demand / a.capacity)[0];

  const savedState = { res };
  const scenarioLink = useScenarioLink({ id: "EL-03", state: savedState, activeId: activeUcId,
    restore: (s) => { setRes(s.res); },
    validate: (v): v is typeof savedState => validateScenario(v, { res: (v) => recordOf(v, ["none","hire","contract","upskill"]) }),
  });

  return (
    <InstrumentShell title="Capacity and skills coverage" eyebrow="Operating model & engagement" description="Resolve the specific skill gap and see the schedule and cost consequence."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "EL-03" }]}
      decision={<DecisionSummary title={unresolved ? `${unresolved} skill gaps still need a decision` : "Every skill gap has a modeled resolution"} explanation={`Delivery ${deliveryWeeks} weeks (${slip} beyond plan); monthly cost $${monthly}k, including $${addedCost}k in added capacity.`} nextAction={bottleneck ? `Start with ${bottleneck.label}; choose hire, contract or upskill for each gap.` : "Review the available capacity against your delivery priorities."} tone={unresolved ? "caution" : "positive"} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={EL03_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="AI portfolios require the right mix of ML engineering, data engineering, platform, delivery, domain, and evaluation capacity. A raw headcount view hides the bottlenecks that delay delivery." approach="The planner maps demand and capacity by skill pool, highlights overallocation, and models the effect of hire, contract, and upskill actions on cost and schedule." why="This connects AI delivery plans to workforce strategy, capacity planning, budget, schedule confidence, and execution risk." metric="Utilization versus target; skill coverage gaps against demand." tradeoff="Hiring is slow and costly; contracting is fast but thin; upskilling is sticky but takes time." outcome="A hire/contract/upskill call per gap, with the date and cost impact." />}

    >

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Team" value={teamLabel} tone="neutral" interpretation={`${totalGap} FTE short in skills`} />
          <KpiCard label="Delivery" value={`~${deliveryWeeks} wk`} tone={slip > 6 ? "risk" : slip > 0 ? "watch" : "healthy"} interpretation={slip > 0 ? `+${slip} wk vs plan` : "on plan"} />
          <KpiCard label="Monthly cost" value={`$${monthly}k`} tone={addedCost > 0 ? "watch" : "neutral"} interpretation={addedCost > 0 ? `+$${addedCost}k added` : "base team"} />
          <KpiCard label="Unresolved gaps" value={`${unresolved}/${gapRows.length}`} tone={unresolved > 0 ? "critical" : "healthy"} interpretation="Over allocated skills" />
        </div>

        {/* Heatmap */}
        <Panel>
          <p className="stat-label mb-3">Skill utilization <span className="font-normal text-slatey-500">· demand ÷ capacity</span></p>
          <div className="space-y-3">
            {rows.map((r) => {
              const overP = r.util / utilizationScale * 100;
              const barColor = r.util > 1.05 ? "bg-rose-500" : r.util > 0.9 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={r.key} className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border border-line p-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:gap-3">
                  <span className="text-xs font-medium text-ink">{r.label}</span>
                  <div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${overP}%` }} />
                      <div className="absolute inset-y-0 w-px bg-ink/50" style={{ left: `${100 / utilizationScale}%` }} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-slatey-500">demand {r.demand} · capacity {r.effCap}{r.gap > 0 && r.r !== "none" ? ` (+${r.gap})` : ""} · {Math.round(r.util * 100)}%</p>
                  </div>
                  <div className="min-w-0 text-left sm:text-right">
                    {r.gap > 0 ? (
                      <div className="inline-flex gap-1">
                        {RES_OPTS.map((o) => (
                          <button key={o} aria-pressed={r.r === o} aria-label={`${r.label}: ${o}, ${LEAD[o]} weeks, $${RATE[o]}k per FTE per month`} onClick={() => setRes((cur) => ({ ...cur, [r.key]: cur[r.key] === o ? "none" : o }))}
                            className={`min-h-10 rounded border px-2 py-1 text-xs font-medium capitalize transition ${r.r === o ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{o}</button>
                        ))}
                      </div>
                    ) : (
                      <Badge tone="slate">{r.capacity - r.demand > 0 ? `+${r.capacity - r.demand} slack` : "balanced"}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slatey-500">Every bar uses the same scale. The tick marks 100% utilization; bars beyond it show overload, with the exact percentage below. Hire = +6 wk / $18k·FTE · Contract = +1 wk / $28k · Upskill = +4 wk / $8k (draws on slack).</p>
        </Panel>

        <div className="mt-6">
          <InsightCard title={bottleneck ? `Bottleneck: ${bottleneck.label}` : "No bottleneck"} tone={unresolved > 0 ? "danger" : "success"}>
            {unresolved > 0
              ? <>Capacity decisions remain for {unresolvedRows.map((g) => g.label).join(", ")}. Contract is fastest to the date, upskill is cheapest but leans on the slack in Delivery and SME, hiring is permanent but adds six weeks. Pick per constraint, not per habit.</>
              : <>Every gap has a modeled resolution. Delivery lands at ~{deliveryWeeks} weeks for +${addedCost}k/month, now decide whether the pulled-in date is worth the run rate.</>}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Resolve capacity gaps by skill, not by generic headcount." lift="Improves delivery confidence by matching the work to the actual capabilities required." measure="Skill utilization, open gaps, delivery date impact, monthly cost, time to productive capacity." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Thirty people do not equal thirty usable delivery units. Capacity fails by skill, not by headcount."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, a direct mirror of the 31-resource AMEX intelligence mapping; the most personal instrument on the site.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Utilization = demand ÷ effective capacity per skill. Resolving a gap adds its shortfall as capacity; delivery slip = the worst gap&apos;s overflow (unresolved) or its resolution lead time (resolved). Monthly cost = base team + Σ(gap × resolution rate).</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a deterministic planner. Real capacity planning would require availability data, role definitions, location constraints, ramp time, vendor constraints, and delivery priorities.</p>
        </div>

    </InstrumentShell>
  );
}
