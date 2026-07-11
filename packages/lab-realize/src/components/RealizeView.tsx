"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, GitBranch, SlidersHorizontal, FileText, ArrowRight, RotateCcw, Cpu,
  CheckCircle2, AlertTriangle, Users,
} from "lucide-react";
import { Panel, SectionHeader, KpiCard, Badge, InsightCard, cn } from "@labs/design-system";
import { useProgramSource, formatMoney, formatMonths, type StageKey } from "@labs/program-core";
import { deriveInputs, applyOverrides, computeRoi, valueRiver, sensitivity, dossier, type Overrides } from "../engine/model";
import { deriveAdoptionPlan, projectAdoption, ADOPTION_TARGET, type AdoptionIntervention } from "../engine/adoption";
import { ValueWaterfall } from "./ValueWaterfall";

// One money style everywhere (R1.4): the shared program formatter, so the
// verdict here and the handoff strip upstream can never disagree on format.
const usd = formatMoney;
const STAGE_LABEL: Record<StageKey, string> = { frame: "Frame", data: "Data", build: "Build", deploy: "Deploy", govern: "Govern", realize: "Realize", operate: "Operate" };
const STAGE_HREF: Record<StageKey, string> = { frame: "/frame", data: "/data", build: "/build", deploy: "/deploy", govern: "/govern", realize: "/realize", operate: "/operate" };

function Src({ s }: { s: StageKey }) {
  return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slatey-400">{STAGE_LABEL[s]}</span>;
}

export function RealizeView() {
  const { state, isDemo, update, hydrated, src } = useProgramSource();
  const [ov, setOv] = useState<Overrides>({});
  // Phase F, scenario A/B: snapshot the current assumption set and compare.
  const [scenarioA, setScenarioA] = useState<{ ov: Overrides; riskAdjustedValue: number; roiPct: number; paybackMonths: number } | null>(null);

  const base = useMemo(() => deriveInputs(src), [src]);
  const inp = useMemo(() => applyOverrides(base, ov), [base, ov]);
  const roi = useMemo(() => computeRoi(inp), [inp]);
  const flows = useMemo(() => valueRiver(inp, roi), [inp, roi]);
  const sens = useMemo(() => sensitivity(inp), [inp]);
  const rows = useMemo(() => dossier(src, inp, roi), [src, inp, roi]);

  const worth = roi.riskAdjustedValue > 0 && roi.roiPct > 0;
  const payback = Number.isFinite(roi.paybackMonths) ? Math.round(roi.paybackMonths) : null;
  const maxSwing = Math.max(...sens.map((s) => s.swing), 1);
  const leaks = flows.filter((f) => f.kind === "leak");
  const biggestLeak = [...leaks].sort((a, b) => b.amount - a.amount)[0];

  // Recommended next action for the Strategy iteration loop, driven by the
  // largest leak so the program knows what to improve on the next pass.
  const nextAction = useMemo(() => {
    const k = biggestLeak?.key;
    if (k === "adoption") return "Strengthen the adoption plan, it is the largest value leak.";
    if (k === "quality") return "Raise answer quality in Build to close the quality leak.";
    if (k === "runcost") return "Optimize run cost in AI Ops (caching / model tier).";
    if (k === "risk") return "Resolve open governance findings to lower the risk discount.";
    return "Re-run the workshop with tighter scope to lift risk adjusted return.";
  }, [biggestLeak?.key]);

  // Signature over EVERY input this effect writes (same pattern as the other
  // stage writers): none of the written objects (outcomes/iteration) appear in
  // it, so the write can't retrigger its own effect, and no written field can
  // go stale because its input moved without moving ROI.
  const outcomeSig = JSON.stringify({
    roi: roi.roiPct, rav: roi.riskAdjustedValue, npv: roi.npv3yr,
    adoption: inp.adoption.value, payback: roi.paybackMonths,
    addr: roi.addressable, real: roi.realized, leak: biggestLeak?.label, next: nextAction,
  });
  useEffect(() => {
    if (!hydrated || isDemo) return;
    update((d) => {
      // Only re-stamp createdAt when the outcome actually changed, merely
      // visiting the page must not imply a fresh realization run.
      const prev = d.outcomes;
      const changed = !prev
        || prev.roi !== roi.roiPct
        || prev.riskAdjustedValue !== roi.riskAdjustedValue
        || prev.npv3yr !== roi.npv3yr
        || prev.recommendedNextAction !== nextAction;
      d.outcomes = {
        roi: roi.roiPct, adoption: inp.adoption.value,
        riskAdjustedValue: roi.riskAdjustedValue, paybackMonths: roi.paybackMonths,
        addressableValue: roi.addressable, realizedValue: roi.realized, npv3yr: roi.npv3yr,
        valueLeakage: biggestLeak?.label, recommendedNextAction: nextAction,
        createdAt: changed ? new Date().toISOString() : prev?.createdAt,
      };
      d.iteration = {
        lastOutcomeSummary: `${roi.roiPct}% risk adjusted ROI · ${Number.isFinite(roi.paybackMonths) ? Math.round(roi.paybackMonths) + "mo payback" : "no payback"} · biggest leak: ${biggestLeak?.label ?? "n/a"}`,
        recommendedNextAction: nextAction,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcomeSig, hydrated, isDemo]);
  const captured = roi.addressable > 0 ? Math.round((roi.realized / roi.addressable) * 100) : 0;
  const engine = isDemo ? null : state.rag;
  const shownSens = sens;

  return (
    <div className="space-y-6">
      {engine?.model && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-primary-soft/40 px-3 py-2 text-xs text-slatey-400">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span>
            Run cost driven by engine <span className="font-semibold text-ink">{engine.model}</span>
            {engine.modelDeployment ? ` (${engine.modelDeployment})` : ""}
            {typeof engine.modelCostFactor === "number" ? ` · cost ×${engine.modelCostFactor}` : ""}
          </span>
          <span className="text-slatey-500">set in Build · Model Fit</span>
        </div>
      )}

      {/* 1 · THE VERDICT, say the answer in one plain sentence */}
      <section id="verdict" className="scroll-mt-24">
        <div className={cn(
          "rounded-2xl border p-6 shadow-card",
          worth ? "border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 to-white" : "border-rose-500/30 bg-gradient-to-br from-rose-50/70 to-white",
        )}>
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
            worth ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-rose-50 text-rose-700 ring-rose-600/20",
          )}>
            {worth ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {worth ? "Worth funding" : "Not yet fundable"}
          </span>

          <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-ink">
            {worth ? (
              <>Returns <span className="text-emerald-700">{usd(roi.riskAdjustedValue)}/yr</span> on a {usd(inp.investment)} build{payback !== null ? <>, paying for itself in <span className="text-emerald-700">{formatMonths(payback)}</span></> : ""}.</>
            ) : (
              <>Not fundable as it stands, the value it creates doesn&rsquo;t yet cover what it costs to build and run.</>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slatey-400">
            This is the <span className="font-medium text-ink">risk‑adjusted</span> number, the honest one you could defend to finance. It starts from all the value on the table and subtracts every real‑world leak, each traced to the stage that caused it (shown below).
          </p>
        </div>

        {/* supporting numbers */}
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Risk adjusted value" value={`${usd(roi.riskAdjustedValue)}`} suffix="/yr" tone={worth ? "healthy" : "critical"} interpretation="defensible, traceable"
            tooltip="The annual value this initiative is expected to create after every leak is subtracted: low adoption, imperfect answer quality, run cost, and a risk discount. It starts from the addressable value (tasks × time saved × labor rate) and removes each loss, each sourced from an upstream stage. This is the defensible number you would put in front of finance." />
          <KpiCard label="ROI" value={`${roi.roiPct}`} suffix="%" tone={roi.roiPct > 50 ? "healthy" : roi.roiPct > 0 ? "watch" : "critical"} target="return vs cost, year one"
            tooltip="Return on investment: the risk adjusted annual value divided by the total cost to build and run it for one year, shown as a percent. Above 0% means it returns more than it costs, and higher is better." />
          <KpiCard label="Payback" value={payback !== null ? `${payback}` : "N/A"} suffix="mo" tone={payback !== null && payback <= 12 ? "healthy" : payback !== null && payback <= 24 ? "watch" : "risk"} target="time to recoup the build"
            tooltip="How many months of risk adjusted value it takes to recoup the upfront build investment. Shorter paybacks are easier to fund and lower risk; a dash means the value never covers the cost." />
          <KpiCard label="Value captured" value={`${captured}`} suffix="%" tone={captured >= 55 ? "healthy" : captured >= 35 ? "watch" : "risk"} target="of everything on the table"
            tooltip="Of the full addressable value (all the time that could be saved), the share you actually keep after adoption and answer quality losses, before run cost and risk. Higher means less leaks away before it even reaches the bottom line." />
        </div>
      </section>

      {/* 2 · WHERE THE VALUE GOES, the waterfall */}
      <section id="value" className="scroll-mt-24">
        <Panel>
          <SectionHeader eyebrow="Follow the money" title="Where the value goes"
            description="Start with everything on the table, subtract each real world leak, and you land on the defensible number."
            icon={GitBranch} action={<Badge tone={worth ? "emerald" : "rose"}>{worth ? "Worth funding" : "Not yet"}</Badge>} />
          <ValueWaterfall flows={flows} />
          <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-3 text-sm leading-relaxed text-slatey-300">
            Of <b className="text-ink">{usd(roi.addressable)}</b> on the table, the biggest single loss is{" "}
            <b className="text-ink">{usd(biggestLeak.amount)}</b> to{" "}
            <Link href={STAGE_HREF[biggestLeak.source]} className="font-medium text-primary hover:text-primary-dark">{biggestLeak.label.toLowerCase()}</Link>{" "}
            (from {STAGE_LABEL[biggestLeak.source]}). What survives every leak is{" "}
            <b className={worth ? "text-emerald-700" : "text-rose-700"}>{usd(roi.riskAdjustedValue)}/yr</b>.
          </div>
        </Panel>

        {/* Phase D, when does it pay for itself? Reacts to the scenario sliders. */}
        <Panel className="mt-6">
          <SectionHeader eyebrow="The CFO question" title="When does it pay for itself?"
            description="Cumulative risk adjusted value against the upfront build investment. The crossing point is the payback moment, drag the scenario sliders below and watch it move."
            icon={TrendingUp}
            action={payback !== null
              ? <Badge tone={payback <= 12 ? "emerald" : payback <= 24 ? "amber" : "rose"}>{payback} months</Badge>
              : <Badge tone="rose">no payback</Badge>} />
          <PaybackCrossover investment={inp.investment} annualNetValue={roi.riskAdjustedValue} paybackMonths={roi.paybackMonths} usd={usd} />
        </Panel>
      </section>

      {/* 3 · WHAT MOVES IT MOST, levers + scenario sliders + the takeaways */}
      <section id="levers" className="scroll-mt-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader title="What moves it most" description="The assumptions with the biggest effect on the outcome, where effort pays off." icon={TrendingUp} />
            <div className="space-y-2.5">
              {shownSens.map((s) => (
                <div key={s.key}>
                  <div className="mb-0.5 flex justify-between text-xs"><span className="text-slatey-300">{s.label}</span><span className="font-mono text-slatey-400">±{usd(s.swing / 2)}</span></div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.swing / maxSwing) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-md bg-primary-soft/50 p-2.5 text-[11px] leading-relaxed text-slatey-500">
              Pull the longest bar first, <b className="text-ink">{sens[0]?.label.toLowerCase()}</b> shifts the outcome more than anything else here.
            </p>
          </Panel>

          <Panel>
            <SectionHeader title="Test a scenario" description="Override any assumption to see the whole page move, nothing is hard coded." icon={SlidersHorizontal}
              action={Object.keys(ov).length > 0 ? <button onClick={() => setOv({})} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><RotateCcw className="h-3 w-3" /> reset</button> : null} />
            <div className="space-y-4">
              <OvSlider label="Adoption" suffix="%" min={10} max={95} value={Math.round(inp.adoption.value * 100)} src={base.adoption.source} onChange={(v) => setOv((o) => ({ ...o, adoption: v / 100 }))} />
              <OvSlider label="Answer quality" suffix="%" min={30} max={99} value={Math.round(inp.quality.value * 100)} src={base.quality.source} onChange={(v) => setOv((o) => ({ ...o, quality: v / 100 }))} />
              <OvSlider label="Minutes saved / task" suffix="m" min={1} max={60} value={inp.minutesSavedPerTask.value} src={base.minutesSavedPerTask.source} onChange={(v) => setOv((o) => ({ ...o, minutesSavedPerTask: v }))} />
              <OvSlider label="Build investment" suffix="k" min={50} max={800} value={Math.round(inp.investment / 1000)} src="frame" onChange={(v) => setOv((o) => ({ ...o, investment: v * 1000 }))} />
            </div>
            <p className="mt-3 text-[11px] text-slatey-500">Run cost <b className="text-ink">{usd(inp.annualRunCost.value)}/yr</b><Src s={base.annualRunCost.source} /> · risk discount <b className="text-ink">{Math.round(inp.riskDiscount.value * 100)}%</b><Src s={base.riskDiscount.source} /> are inherited from downstream stages.</p>

            {/* Phase F, scenario A/B */}
            <div className="mt-3 border-t border-line/70 pt-3">
              {!scenarioA ? (
                <button
                  onClick={() => setScenarioA({ ov: { ...ov }, riskAdjustedValue: roi.riskAdjustedValue, roiPct: roi.roiPct, paybackMonths: roi.paybackMonths })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-300 hover:bg-slate-50">
                  Save as scenario A, then tweak and compare
                </button>
              ) : (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="stat-label">Scenario A vs current</p>
                    <span className="flex gap-2">
                      <button onClick={() => setOv({ ...scenarioA.ov })} className="text-[11px] font-semibold text-primary hover:text-primary-dark">restore A</button>
                      <button onClick={() => setScenarioA(null)} className="text-[11px] font-medium text-slatey-400 hover:text-ink">clear</button>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <ScenarioDelta label="Risk adj. value" a={usd(scenarioA.riskAdjustedValue)} b={usd(roi.riskAdjustedValue)} better={roi.riskAdjustedValue >= scenarioA.riskAdjustedValue} />
                    <ScenarioDelta label="ROI" a={`${scenarioA.roiPct}%`} b={`${roi.roiPct}%`} better={roi.roiPct >= scenarioA.roiPct} />
                    <ScenarioDelta label="Payback" a={Number.isFinite(scenarioA.paybackMonths) ? `${Math.round(scenarioA.paybackMonths)}mo` : "N/A"} b={Number.isFinite(roi.paybackMonths) ? `${Math.round(roi.paybackMonths)}mo` : "N/A"} better={roi.paybackMonths <= scenarioA.paybackMonths} />
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InsightCard tone={inp.adoption.value > 0.6 ? "success" : "warn"} title="Adoption is usually the biggest lever">
            At {Math.round(inp.adoption.value * 100)}% adoption you capture {usd(roi.realized)} of {usd(roi.addressable)}. Adoption traces to feasibility &amp; data readiness, fix those upstream to lift it.
          </InsightCard>
          <InsightCard tone={inp.riskDiscount.value > 0.3 ? "danger" : "info"} title={`Risk discount is −${Math.round(inp.riskDiscount.value * 100)}%`}>
            Governance&rsquo;s risk tier discounts the value. Lower-risk, better-governed initiatives keep more of what they earn. Use the scenario sliders above to test it yourself.
          </InsightCard>
        </div>
      </section>

      {/* 3.5 · ADOPTION & CHANGE PLAN, the treatment for the biggest leak */}
      <section id="adoption" className="scroll-mt-24">
        <AdoptionPlanPanel
          audience={src.initiative?.params?.user ?? null}
          adoptionPct={Math.round(inp.adoption.value * 100)}
          citationAccuracy={src.rag?.citationAccuracy}
          humanReviewRequired={src.initiative?.meta?.humanReviewRequired}
          addressable={roi.addressable}
          quality={inp.quality.value}
          riskDiscount={inp.riskDiscount.value}
          usd={usd}
        />
      </section>

      {/* 4 · TRACEABILITY, the one-page dossier */}
      <section id="dossier" className="scroll-mt-24">
        <Panel>
          <SectionHeader eyebrow="The payoff, on one page" title="Traceability dossier" description="Every number above, traced to the decision it came from, click any row to open that stage." icon={FileText} />
          <div className="overflow-hidden rounded-xl border border-line">
            {rows.map((r, idx) => (
              <Link key={idx} href={STAGE_HREF[r.stage]} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-slate-50", idx < rows.length - 1 && "border-b border-line", idx === rows.length - 1 && "bg-emerald-50/50")}>
                <span className="w-20 shrink-0"><Badge tone={r.stage === "govern" && idx === rows.length - 1 ? "emerald" : "blue"}>{STAGE_LABEL[r.stage]}</Badge></span>
                <span className="w-28 shrink-0 text-sm font-semibold text-ink">{r.label}</span>
                <span className="flex-1 text-sm text-ink">{r.value}</span>
                <span className="w-full text-[11px] text-slatey-400 sm:w-auto sm:flex-[2]">{r.basis}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slatey-400">This is the whole program on one screen, the artifact you hand a stakeholder.</p>
            <Link href="/story/brief" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
              Open the board brief <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function OvSlider({ label, suffix, min, max, value, src, onChange }: { label: string; suffix: string; min: number; max: number; value: number; src: StageKey; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slatey-300">{label}<Src s={src} /></span>
        <span className="font-mono text-slatey-400">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" aria-label={label} />
    </div>
  );
}

// ---- Phase I · adoption & change plan ------------------------------------------
// Realize's own math names adoption as the biggest leak, this panel is the
// treatment. Pick interventions and watch projected adoption + recaptured value
// move. Uplifts are modeled planning numbers (labeled as such), session local.
function AdoptionPlanPanel({ audience, adoptionPct, citationAccuracy, humanReviewRequired, addressable, quality, riskDiscount, usd }: {
  audience: string | null; adoptionPct: number; citationAccuracy?: number; humanReviewRequired?: boolean;
  addressable: number; quality: number; riskDiscount: number; usd: (n: number) => string;
}) {
  const plan = useMemo(
    () => deriveAdoptionPlan({ audience, adoptionPct, citationAccuracy, humanReviewRequired }),
    [audience, adoptionPct, citationAccuracy, humanReviewRequired],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(plan.filter((i) => i.recommended).map((i) => i.id)));
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const chosen = plan.filter((i) => selected.has(i.id));
  const projected = projectAdoption(adoptionPct, chosen);
  const upliftPts = projected - adoptionPct;
  // Value per adoption point: realized = addressable × adoption × quality, so
  // each point recaptures addressable × quality / 100, risk adjusted here.
  const recaptured = Math.round(((upliftPts / 100) * addressable * quality) * (1 - riskDiscount));

  return (
    <Panel>
      <SectionHeader eyebrow="Adoption & change plan" title="The treatment for the biggest leak" icon={Users}
        description={`Adoption is where most AI value dies. Build the change plan for ${audience?.toLowerCase() ?? "your users"}, each intervention carries a modeled uplift, and the value it recaptures shows up live.`}
        action={
          <Badge tone={projected >= ADOPTION_TARGET ? "emerald" : projected > adoptionPct ? "amber" : "rose"}>
            {adoptionPct}% → {projected}% adoption
          </Badge>
        } />

      <div className="grid gap-2 md:grid-cols-2">
        {plan.map((i) => {
          const on = selected.has(i.id);
          return (
            <label key={i.id} className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
              on ? "border-primary/40 bg-primary/[0.04]" : "border-line bg-white hover:bg-slate-50/60",
            )}>
              <input type="checkbox" checked={on} onChange={() => toggle(i.id)} className="mt-0.5 h-4 w-4 accent-primary" aria-label={i.label} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{i.label}</span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">+{i.upliftPts}pts</span>
                  {i.recommended && <Badge tone="blue">suggested</Badge>}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-slatey-400">{i.detail}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-wide text-slatey-500">{i.owner} · {i.horizon}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3",
        upliftPts > 0 ? "border-emerald-600/25 bg-emerald-50/50" : "border-line bg-slate-50/60",
      )}>
        <p className="text-sm leading-relaxed text-slatey-300">
          {upliftPts > 0 ? (
            <>This plan lifts adoption <b className="text-ink">{adoptionPct}% → {projected}%</b>, recapturing{" "}
              <b className="text-emerald-700">~{usd(recaptured)}/yr</b> of risk adjusted value{projected >= ADOPTION_TARGET ? ", clearing the healthy-adoption bar." : "."}</>
          ) : (
            <>Select interventions to see how much of the adoption leak the plan recaptures.</>
          )}
        </p>
        <span className="text-[11px] italic text-slatey-500">Modeled uplifts, planning numbers, not measurements.</span>
      </div>
    </Panel>
  );
}

// ---- Phase F · scenario A/B delta chip ----------------------------------------
function ScenarioDelta({ label, a, b, better }: { label: string; a: string; b: string; better: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-2">
      <p className="stat-label">{label}</p>
      <p className="mt-0.5 text-[12px] leading-snug">
        <span className="text-slatey-400">{a}</span>
        <span className="mx-1 text-slatey-500">→</span>
        <span className={cn("font-semibold", a === b ? "text-ink" : better ? "text-emerald-700" : "text-rose-700")}>{b}</span>
      </p>
    </div>
  );
}

// ---- Phase D · payback crossover ---------------------------------------------
// Cumulative risk adjusted value vs the upfront investment over 36 months.
// Hand-rolled SVG (house style, no chart dependency), deterministic and
// print-safe. The crossing point is the payback moment.
function PaybackCrossover({ investment, annualNetValue, paybackMonths, usd }: {
  investment: number; annualNetValue: number; paybackMonths: number; usd: (n: number) => string;
}) {
  const W = 560, H = 190, padL = 46, padR = 14, padT = 14, padB = 26;
  const MONTHS = 36;
  const maxY = Math.max(investment * 1.5, (annualNetValue / 12) * MONTHS, 1);
  const x = (m: number) => padL + (m / MONTHS) * (W - padL - padR);
  const y = (v: number) => H - padB - (Math.max(0, v) / maxY) * (H - padT - padB);

  const valuePath = Array.from({ length: MONTHS + 1 }, (_, m) => `${m === 0 ? "M" : "L"}${x(m).toFixed(1)},${y((annualNetValue / 12) * m).toFixed(1)}`).join(" ");
  const crosses = Number.isFinite(paybackMonths) && paybackMonths > 0 && paybackMonths <= MONTHS && annualNetValue > 0;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[480px]" role="img"
        aria-label={crosses ? `Cumulative value crosses the ${usd(investment)} investment at month ${Math.round(paybackMonths)}` : "Cumulative value does not cross the investment within 36 months"}>
        {/* gridlines every 12 months */}
        {[0, 12, 24, 36].map((m) => (
          <g key={m}>
            <line x1={x(m)} y1={padT} x2={x(m)} y2={H - padB} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={x(m)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{m}mo</text>
          </g>
        ))}
        {/* y axis reference: investment */}
        <line x1={padL} y1={y(investment)} x2={W - padR} y2={y(investment)} stroke="#64748b" strokeDasharray="6 4" />
        <text x={padL + 4} y={y(investment) - 5} fontSize="10" fill="#64748b">build investment {usd(investment)}</text>
        {/* cumulative value line */}
        <path d={valuePath} fill="none" stroke={annualNetValue > 0 ? "#1f6fc4" : "#e11d48"} strokeWidth="2.5" />
        <text x={W - padR} y={y((annualNetValue / 12) * MONTHS) - 6} textAnchor="end" fontSize="10" fill={annualNetValue > 0 ? "#15508c" : "#be123c"}>
          cumulative risk adjusted value
        </text>
        {/* crossover marker */}
        {crosses && (
          <g>
            <circle cx={x(paybackMonths)} cy={y(investment)} r="5" fill="#059669" stroke="#fff" strokeWidth="1.5" />
            <text x={x(paybackMonths)} y={y(investment) + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill="#047857">
              payback · month {Math.round(paybackMonths)}
            </text>
          </g>
        )}
        {!crosses && (
          <text x={(padL + W - padR) / 2} y={padT + 12} textAnchor="middle" fontSize="11" fill="#be123c">
            {annualNetValue > 0 ? "Payback lands beyond 36 months" : "Value never covers the investment at current assumptions"}
          </text>
        )}
      </svg>
    </div>
  );
}
