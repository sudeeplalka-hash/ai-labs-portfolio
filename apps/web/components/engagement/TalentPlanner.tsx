"use client";

// EL-06 · Talent & Upskilling Pathway Planner (Collection 4 · control room).
// Team coverage vs the agentic era target per capability → gap heatmap → build /
// hire / partner per gap with a time to ready. The stack went agentic in 18 months;
// teams take 24. Start the people plan before the platform plan. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { EL06_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "../business/DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type Path = "none" | "build" | "hire" | "partner";
const PATH_MO: Record<Exclude<Path, "none">, number> = { build: 8, hire: 4, partner: 2 };
const PATH_LABEL: Record<Exclude<Path, "none">, string> = { build: "Build", hire: "Hire", partner: "Partner" };

interface Cap { key: string; label: string; current: number; target: number }
const CAPS: Cap[] = [
  { key: "prompt", label: "Prompt & context engineering", current: 55, target: 85 },
  { key: "orch", label: "Agent orchestration (MCP / A2A)", current: 30, target: 80 },
  { key: "eval", label: "Eval & observability for LLMs", current: 40, target: 85 },
  { key: "ops", label: "LLM Ops / deployment", current: 50, target: 80 },
  { key: "gov", label: "AI governance & risk", current: 45, target: 90 },
  { key: "domain", label: "Domain × AI translation", current: 65, target: 85 },
];
const STACK_MONTHS = 18;

export function TalentPlanner() {
  const [paths, setPaths] = useState<Record<string, Path>>({});
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL06_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL06_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const caps: Cap[] = activeUc ? activeUc.payload.caps : CAPS;
  const stackMonths = activeUc ? activeUc.payload.stackMonths : STACK_MONTHS;
  const stackLabel = activeUc ? activeUc.payload.stackLabel : "Stack went agentic";
  const selectUseCase = (id: string | null) => { setActiveUcId(id); setPaths({}); };

  const rows = caps.map((c) => {
    const gap = Math.max(0, c.target - c.current);
    const p = paths[c.key] ?? "none";
    const resolved = gap === 0 || p !== "none";
    const after = resolved ? c.target : c.current;
    const mo = gap > 0 && p !== "none" ? PATH_MO[p] : 0;
    return { ...c, gap, p, resolved, after, mo };
  });

  const gaps = rows.filter((r) => r.gap > 0);
  const openGaps = gaps.filter((r) => r.p === "none").length;
  const readyNow = Math.round(rows.reduce((a, r) => a + r.current, 0) / rows.length);
  const readyAfter = Math.round(rows.reduce((a, r) => a + r.after, 0) / rows.length);
  const teamMonths = gaps.every((r) => r.p !== "none") ? Math.max(0, ...gaps.map((r) => r.mo)) : null;

  const preset = (p: Exclude<Path, "none">) => setPaths(Object.fromEntries(gaps.map((r) => [r.key, p])));

  const savedState = { paths };
  const scenarioLink = useScenarioLink({ id: "EL-06", state: savedState, activeId: activeUcId,
    restore: (s) => { setPaths(s.paths); },
    validate: (v): v is typeof savedState => validateScenario(v, { paths: (v) => recordOf(v, ["none","build","hire","partner"]) }),
  });

  return (
    <InstrumentShell title="Talent and capability pathway" eyebrow="Operating model & engagement" description="Choose how to close each capability gap and inspect the modeled readiness timeline."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "EL-06" }]}
      decision={<DecisionSummary title={openGaps ? `${openGaps} gaps have no pathway` : `Modeled team readiness in ${teamMonths} months`} explanation={`Current coverage ${readyNow}%; modeled coverage after selected pathways ${readyAfter}%. Outcomes are projected, not achieved.`} nextAction="Choose build, hire or partner per capability; review the latest completion date against the pace of change." tone={openGaps ? "caution" : "positive"} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={EL06_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="Agentic and enterprise AI work requires new combinations of context engineering, orchestration, evaluation, LLMOps, governance, and domain translation. Training alone does not close every gap, and some gaps require hiring or partnership." approach="The planner assesses current and target capability coverage, exposes gaps, and models build, hire, or partner pathways with time to ready implications." why="This connects AI strategy to workforce planning, capability maturity, delivery risk, budget, and operating model change." metric="Skill gap per role; time to productive per pathway." tradeoff="Building is slow but sticky; hiring is fast but costly; partnering is quick but external." outcome="The build/hire/partner pathway per role, with time to productive." />}

    >

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Readiness now" value={`${readyNow}%`} tone={readyNow >= 70 ? "watch" : "risk"} interpretation="Average current capability score" />
          <KpiCard label="Readiness after plan" value={`${readyAfter}%`} tone="healthy" interpretation="After selected pathways" />
          <KpiCard label="Open gaps" value={`${openGaps}/${gaps.length}`} tone={openGaps > 0 ? "critical" : "healthy"} interpretation="No pathway chosen" />
          <KpiCard label="Time to ready" value={teamMonths !== null ? `${teamMonths} mo` : "N/A"} tone={teamMonths !== null && teamMonths > stackMonths ? "risk" : "watch"} interpretation={`Stack moved in ${stackMonths} mo`} />
        </div>

        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="stat-label">Capability gap <span className="font-normal text-slatey-500">· current → target</span></p>
            <div className="flex gap-1">
              {(["build", "hire", "partner"] as const).map((p) => (
                <button key={p} onClick={() => preset(p)} className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-slatey-400 hover:text-ink">All {p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.key} className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border border-line p-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
                <span className="text-xs font-medium text-ink">{r.label}</span>
                <div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${r.gap > 30 ? "bg-rose-400" : r.gap > 0 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${r.current}%` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${r.target}%` }} title={`Target ${r.target}`} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slatey-500">{r.current} → {r.target}{r.gap > 0 ? ` · gap ${r.gap}` : " · met"}</p>
                </div>
                <div className="min-w-0 text-left sm:text-right">
                  {r.gap > 0 ? (
                    <div className="inline-flex items-center gap-1">
                      {(["build", "hire", "partner"] as const).map((p) => (
                        <button key={p} aria-pressed={r.p === p} aria-label={`${r.label}: ${PATH_LABEL[p]}, ${PATH_MO[p]} months`} onClick={() => setPaths((c) => ({ ...c, [r.key]: c[r.key] === p ? "none" : p }))}
                          className={`min-h-10 rounded border px-2 py-1 text-xs font-medium transition ${r.p === p ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{PATH_LABEL[p]}</button>
                      ))}
                      {r.p !== "none" && <span className="ml-1 font-mono text-[10px] text-slatey-500">{r.mo}mo</span>}
                    </div>
                  ) : <Badge tone="emerald">met</Badge>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slatey-500">Tick = target. Build 8mo (cheap, permanent) · Hire 4mo (permanent, costly) · Partner 2mo (fast, rented).</p>
        </Panel>

        {/* Stack vs team timeline */}
        <Panel className="mt-4">
          <p className="stat-label mb-2">The stack moves faster than the team</p>
          <div className="space-y-2 text-xs">
            <TimeBar label={stackLabel} months={stackMonths} max={26} color="bg-primary" />
            {teamMonths !== null ? <TimeBar label="Team ready (this plan)" months={teamMonths} max={Math.max(26, stackMonths)} color={teamMonths <= stackMonths ? "bg-emerald-500" : "bg-rose-500"} /> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">Choose a pathway for all {openGaps} open gaps to calculate team readiness. No completion date is assumed.</p>}
            {gaps.filter((row) => row.p !== "none").map((row) => <TimeBar key={row.key} label={`${row.label} · ${row.p}`} months={row.mo} max={Math.max(26, stackMonths)} color="bg-teal-500" />)}
          </div>
        </Panel>

        <div className="mt-6">
          <InsightCard title={openGaps > 0 ? `${openGaps} capability gaps have no plan` : teamMonths !== null && teamMonths <= stackMonths ? "Team keeps pace with the stack" : "Plan set, but slower than the stack"} tone={openGaps > 0 ? "danger" : teamMonths !== null && teamMonths <= stackMonths ? "success" : "warn"}>
            {openGaps > 0
              ? <>Orchestration and eval are the widest gaps and the newest skills, build only there takes eight months. Mix in partner for speed on the critical path and build for what must live in house.</>
              : <>Partner buys speed where you can&apos;t wait; build owns what becomes your edge. The mix, not the method, is the plan.</>}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Build, hire, or partner for each capability gap based on urgency, permanence, and cost." lift="Aligns team readiness with the pace of the AI platform roadmap." measure="Capability coverage, time to ready, open gaps, pathway cost, productive capacity." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The AI stack may change in 18 months. Teams often take longer. Start the people plan before the platform plan becomes urgent."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, team capability building across delivery portfolios.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each capability has current coverage vs an agentic era target; gap = target − current. A pathway (build 8mo / hire 4mo / partner 2mo) closes it; team time to ready = the slowest chosen pathway, compared against the {stackMonths}-month stack shift.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a modeled capability planner. Real workforce planning would require role inventory, skills assessment, hiring market data, vendor strategy, budget, and manager validation.</p>
        </div>

    </InstrumentShell>
  );
}

function TimeBar({ label, months, max, color, note }: { label: string; months: number; max: number; color: string; note?: string }) {
  return (
    <div className="grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_4rem]">
      <span className="text-slatey-400">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (months / max) * 100)}%` }} /></div>
      <span className="text-right font-mono text-[11px] text-slatey-500">{note ?? `${months} mo`}</span>
    </div>
  );
}
