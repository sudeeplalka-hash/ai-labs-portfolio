"use client";

// EL-09 · Resource Onboarding & KT Tracker (Collection 4 · commercial wing).
// Onboarding as a critical path problem, access requests are the longest pole.
// 30/60/90 ramps, time-to-productive, blocked-on-access flags, and a pre-provision
// compression lever. Flip to KT: a departing senior's knowledge mapped to bus factor
// with sessions to close single points of failure. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { EL09_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "../business/DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

interface Resource { key: string; role: string; loc: "Onshore" | "Offshore"; access: number }
const RESOURCES: Resource[] = [
  { key: "ml", role: "ML Engineer", loc: "Offshore", access: 18 },
  { key: "data", role: "Data Engineer", loc: "Onshore", access: 8 },
  { key: "pm", role: "Delivery PM", loc: "Onshore", access: 4 },
  { key: "qa", role: "QA / Eval", loc: "Offshore", access: 21 },
  { key: "mlops", role: "MLOps", loc: "Onshore", access: 12 },
  { key: "sme", role: "Domain SME", loc: "Onshore", access: 6 },
];
const RAMP = 35; // ramp days once access lands
const rate = (loc: Resource["loc"]) => (loc === "Onshore" ? 1100 : 700);
const ttp = (access: number) => RAMP + Math.max(0, access - 7); // access beyond a 7-day norm delays productivity
const fmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);

interface Area { area: string; bus: number }
const KT_AREAS: Area[] = [
  { area: "Disputes RAG pipeline", bus: 1 },
  { area: "Eval harness", bus: 2 },
  { area: "Fraud scoring model", bus: 1 },
  { area: "Prod deployment runbook", bus: 1 },
  { area: "Data contracts", bus: 3 },
];

export function OnboardingTracker() {
  const [view, setView] = useState<"onboard" | "kt">("onboard");
  const [pre, setPre] = useState(false);
  const [kt, setKt] = useState<Record<string, boolean>>({});
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL09_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL09_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const resources: Resource[] = activeUc ? activeUc.payload.resources : RESOURCES;
  const ktAreas: Area[] = activeUc ? activeUc.payload.ktAreas : KT_AREAS;
  const ktRoleLabel = activeUc ? activeUc.payload.ktRoleLabel : "Rolling off in 5 weeks · Lead ML Engineer";
  const selectUseCase = (id: string | null) => { setActiveUcId(id); setPre(false); setKt({}); };

  const rows = resources.map((r) => {
    const access = pre ? Math.min(r.access, 5) : r.access;
    return { ...r, access, days: ttp(access), blocked: access > 14, carry: ttp(access) * rate(r.loc) };
  });
  const avg = Math.round(rows.reduce((a, r) => a + r.days, 0) / rows.length);
  const blocked = rows.filter((r) => r.blocked).length;
  const carryFull = resources.reduce((a, r) => a + ttp(r.access) * rate(r.loc), 0);
  const carryPre = resources.reduce((a, r) => a + ttp(Math.min(r.access, 5)) * rate(r.loc), 0);
  const current = pre ? carryPre : carryFull;
  const savings = carryFull - carryPre;
  const maxDays = Math.max(60, ...rows.map((row) => row.days));

  const spofs = ktAreas.filter((a) => (kt[a.area] ? a.bus + 1 : a.bus) < 2).length;

  const savedState = { view, pre, kt };
  const scenarioLink = useScenarioLink({ id: "EL-09", state: savedState, activeId: activeUcId,
    restore: (s) => { setView(s.view); setPre(s.pre); setKt(s.kt); },
    validate: (v): v is typeof savedState => validateScenario(v, { view: oneOf(["onboard","kt"]), pre: bool, kt: (v) => recordOf(v,[true,false]) }),
  });

  return (
    <InstrumentShell title="Onboarding and knowledge transfer" eyebrow="Operating model & engagement" description="Separate avoidable access delay from the ramp, and plan continuity before people leave."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "EL-09" }]}
      decision={<DecisionSummary title={view === "onboard" ? `${blocked} resources blocked on access` : `${spofs} modeled single points of failure`} explanation={view === "onboard" ? `Average productive day ${avg}. ${pre ? "Pre-provisioned access is modeled." : `Pre-provisioning could reduce carrying cost by ${fmt(savings)}.`}` : "A scheduled transfer models one additional backup; it is not evidence of completed knowledge transfer."} nextAction={view === "onboard" ? "Compare access delay above the seven-day norm with the unchanged 35-day ramp." : "Plan a named backup and validate the transfer before treating the risk as closed."} tone={view === "onboard" ? (blocked ? "caution" : "positive") : (spofs ? "caution" : "positive")} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={EL09_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="Access delays, unclear ramp expectations, and undocumented senior knowledge create hidden cost. Technology strategy professionals need to know which roles are blocked, what preprovisioning saves, and where knowledge has a single point of failure." approach="The tracker models onboarding timelines, access delays, ramp time, carrying cost, and knowledge transfer coverage. It highlights blocked resources and bus factor risks." why="This connects onboarding to cost, margin, delivery continuity, vendor mobilization, and operational readiness." metric="Time to productive; KT items captured before roll off." tradeoff="Speed of ramp versus the depth of knowledge transfer captured." outcome="The onboarding critical path plus the KT captured before the senior leaves." />}

    >

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["onboard", "kt"] as const).map((v) => (
            <button key={v} aria-pressed={v === view} onClick={() => setView(v)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${v === view ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:text-ink"}`}>{v === "onboard" ? "Onboarding" : "Knowledge transfer"}</button>
          ))}
        </div>

        {view === "onboard" ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="Avg time to productive" value={`${avg} d`} tone={avg > 42 ? "risk" : "watch"} interpretation="35-day ramp + excess access delay" />
              <KpiCard label="Blocked on access" value={`${blocked}/${resources.length}`} tone={blocked > 0 ? "critical" : "healthy"} interpretation="Access > 14 days" />
              <KpiCard label="Ramp carrying cost" value={fmt(current)} tone="watch" interpretation="Cost before productive" />
              <KpiCard label="Compression saves" value={fmt(savings)} tone={savings > 0 ? "healthy" : "neutral"} interpretation="Pre provision access" />
            </div>

            <Panel className="mb-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="stat-label">Time to productive <span className="font-normal text-slatey-500">· one shared day scale</span></p>
                <button aria-pressed={pre} onClick={() => setPre((v) => !v)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${pre ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{pre ? "Access pre-provisioned" : "Pre-provision access"}</button>
              </div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.key} className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border border-line p-3 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto]">
                    <div className="min-w-0"><p className="truncate text-xs font-medium text-ink">{r.role}</p><p className="text-[10px] text-slatey-500">{r.loc}</p></div>
                    <div>
                      <div className="flex h-4 w-full overflow-hidden rounded bg-slate-100">
                        <div className={`${r.blocked ? "bg-rose-500" : "bg-amber-400"} h-full`} style={{ width: `${(Math.max(0, r.access - 7) / maxDays) * 100}%` }} title={`Excess access delay ${Math.max(0, r.access - 7)} days`} />
                        <div className="h-full bg-teal-500" style={{ width: `${(RAMP / maxDays) * 100}%` }} title={`Ramp ${RAMP}d`} />
                      </div>
                      <p className="mt-0.5 text-[10px] text-slatey-500">access {r.access}d → {Math.max(0, r.access - 7)}d beyond the 7-day norm + {RAMP}d ramp = productive day {r.days}</p>
                    </div>
                    <div className="text-left sm:text-right">{r.blocked ? <Badge tone="rose">blocked</Badge> : <span className="font-mono text-xs text-slatey-400">{r.days}d</span>}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slatey-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-400" /> Excess access delay</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rose-500" /> Excess delay · blocked</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-teal-500" /> Ramp</span>
              </div>
            </Panel>

            <InsightCard title="Access is the pole nobody manages" tone={blocked > 0 ? "warn" : "success"}>
              {blocked > 0
                ? <>{blocked} resources exceed the 14-day access threshold. Pre-provisioning caps access at five days and saves <span className="font-semibold">{fmt(savings)}</span> in modeled ramp carrying cost.</>
                : <>With access inside the seven-day norm, modeled time to productive is 35 days and carrying cost is {fmt(current)}. That&apos;s the cheapest margin lever in mobilization.</>}
            </InsightCard>
          </>
        ) : (
          <>
            <Panel className="mb-4">
              <p className="stat-label mb-1">{ktRoleLabel}</p>
              <p className="mb-3 text-xs text-slatey-400">Map their knowledge to bus factor, then schedule KT to close single points of failure before they leave.</p>
              <div className="space-y-2">
                {ktAreas.map((a) => {
                  const on = !!kt[a.area];
                  const bus = on ? a.bus + 1 : a.bus;
                  const spof = bus < 2;
                  return (
                    <div key={a.area} className={`flex items-center gap-3 rounded-lg border p-2.5 ${spof ? "border-rose-200 bg-rose-50/50" : "border-line"}`}>
                      <div className="min-w-0 flex-1"><p className="text-xs font-medium text-ink">{a.area}</p><p className="text-[10px] text-slatey-500">modeled bus factor {bus}{spof && " · single point of failure"}</p></div>
                      {spof && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />}
                      <button aria-pressed={on} aria-label={`${a.area}: ${on ? "remove" : "schedule"} knowledge transfer`} onClick={() => setKt((c) => ({ ...c, [a.area]: !c[a.area] }))} className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${on ? "border-emerald-500 bg-emerald-500 text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{on ? "KT scheduled" : "Schedule KT"}</button>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <InsightCard title={spofs > 0 ? `${spofs} modeled single points of failure remain` : "Backups planned for every area"} tone={spofs > 0 ? "danger" : "success"}>
              {spofs > 0
                ? <>{spofs} area{spofs > 1 ? "s" : ""} still live only in one person&apos;s head. Schedule KT with a named backup for each before the last day, knowledge capture is risk mitigation, not a nice-to-have.</>
                : <>Every area has a planned backup in this model. Verify the named recipient can perform the work before closing the transfer.</>}
            </InsightCard>
          </>
        )}

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Compress onboarding and close KT risks before they become delivery blockers." lift="Reduces carrying cost and protects continuity when senior knowledge leaves the program." measure="Time to productive, blocked resources, preprovisioning savings, KT completion, bus factor risk." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "A resource is a cost from day one and an asset only once productive. Onboarding compression is an operating lever."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, resource lead reality of the 31 resource AMEX portfolio; onshore/offshore mobilization.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Time to productive = ramp ({RAMP}d) + access beyond a 7-day norm; blocked if access &gt; 14 days. Carrying cost = time-to-productive × loaded day rate (onshore $1,100 · offshore $700). Pre-provisioning caps access at 5 days.</p>
              <p>KT view scores each knowledge area by bus factor; scheduling KT adds a backup (+1). Single point of failure = bus factor &lt; 2. Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a modeled onboarding and KT tracker. Real use would require access systems data, role plans, training status, manager validation, KT artifacts, and resource calendars.</p>
        </div>

    </InstrumentShell>
  );
}
