"use client";

import { useMemo, useState } from "react";
import { Compass, Sparkles, Target, FileText, ArrowRight, PlayCircle, Layers, Wand2, RotateCcw, ShieldCheck, Cpu, Route, Activity, TrendingUp } from "lucide-react";
import { Panel, SectionHeader, Badge, InsightCard, cn } from "@labs/design-system";
import { useProgram } from "@labs/program-core";
import type { InitiativeMeta } from "@labs/program-core";
import {
  blankWorkshop, scoreWorkshop, buildBrief, toInitiative, sharpenedProblem, falsifiableTarget, generateWorkshop, deriveInitiativeMeta, type Workshop,
} from "../../strategy/model";
import { SAMPLE, ARCHETYPES, VALUE_CARDS, TRANSFORMATION, PROOF_CARDS, WHAT_THIS_DEMONSTRATES } from "../../strategy/content";
import type { FramingParams, UseCase } from "../../engine/types";
import { StrategyWorkshop } from "./StrategyWorkshop";
import { ScorePanel } from "./ScorePanel";
import { InitiativeBrief } from "./InitiativeBrief";
import { IdeaGenerator } from "./IdeaGenerator";

const scrollTo = (id: string) => { if (typeof document !== "undefined") document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

export function StrategyPlanningView() {
  const { state, update, addToPortfolio, hydrated } = useProgram();
  const [w, setW] = useState<Workshop>(blankWorkshop);
  const set = (patch: Partial<Workshop>) => setW((prev) => ({ ...prev, ...patch }));

  const scored = useMemo(() => scoreWorkshop(w), [w]);
  const brief = useMemo(() => buildBrief(w, scored), [w, scored]);
  const meta = useMemo(() => deriveInitiativeMeta(w), [w]);

  const started = w.ambition.trim().length > 0 || w.painPoint.trim().length > 0 || w.initiativeName.trim().length > 0;
  const lastRun = hydrated ? state.outcomes : undefined;
  const hasLastRun = !!lastRun && (lastRun.roi !== undefined || lastRun.riskAdjustedValue !== undefined);

  const loadSample = () => { setW(SAMPLE); setTimeout(() => scrollTo("workshop"), 60); };
  const seedFromIdea = (uc: UseCase, p: FramingParams, ambition: string) => {
    setW(generateWorkshop(uc, p, ambition));
    setTimeout(() => scrollTo("workshop"), 60);
  };
  const saveToProgram = () => {
    if (!hydrated) return;
    const init = toInitiative(w, scored);
    update((d) => { d.initiative = init; d.progress.frame = "done"; });
    addToPortfolio({ id: `wk-${Date.now()}`, name: init.name ?? "Initiative", scores: init.scores, bucket: "Wins", scope: init.scope, createdAt: init.createdAt ?? new Date().toISOString() });
    try { window.localStorage.setItem("apcc_brief", JSON.stringify(brief)); } catch { /* quota */ }
  };

  return (
    <div className="space-y-8">
      {/* HERO */}
      <header>
        <p className="eyebrow">Strategy &amp; Planning</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Turn a vague AI idea into a <span className="text-primary">decision-ready initiative</span>.</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slatey-300">
          Most AI programs don&rsquo;t fail because the model is weak. They fail because the use case was poorly framed, the value
          was unclear, the data assumptions were untested, or the risks were discovered too late. This lab helps teams define the
          business problem, score the opportunity, identify readiness gaps, and create a structured initiative brief before moving
          into data and build.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => scrollTo("generate")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
            <Wand2 className="h-4 w-4" /> Start Strategy Workshop
          </button>
          <button onClick={loadSample} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-slatey-300 hover:bg-slate-50">
            <PlayCircle className="h-4 w-4" /> Use Sample Initiative
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {VALUE_CARDS.map((c, i) => (
            <div key={i} className="rounded-xl border border-line bg-white p-4 shadow-card">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                {i === 0 ? <Compass className="h-4 w-4" /> : i === 1 ? <Target className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slatey-400">{c.body}</p>
            </div>
          ))}
        </div>
      </header>

      {/* LAST RUN OUTCOME — Realize → Strategy iteration loop */}
      {hasLastRun && <LastRunPanel outcomes={lastRun!} nextAction={state.iteration?.recommendedNextAction ?? lastRun!.recommendedNextAction} />}

      {/* IDEA GENERATOR — vague ambition → scored options */}
      <div id="generate" className="scroll-mt-24">
        <Panel>
          <SectionHeader eyebrow="Idea generator" title="Start from a vague ambition" description="Type a rough idea, turn the five knobs, and watch a sharpened framing and a scored spread of options appear. Pick one to seed the workshop." icon={Wand2} />
          <IdeaGenerator onUse={seedFromIdea} />
        </Panel>
      </div>

      {/* VAGUE → SCOPED */}
      <Panel>
        <SectionHeader eyebrow="The shift this lab makes" title="From vague idea to decision-ready use case" icon={Sparkles} />
        <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <TransformCard tone="slate" tag="Vague idea" text={w.ambition || TRANSFORMATION.vague} />
          <Arrow />
          <TransformCard tone="blue" tag="Sharpened initiative" text={sharpenedProblem(w) || TRANSFORMATION.sharpened} />
          <Arrow />
          <TransformCard tone="emerald" tag="Falsifiable target" text={((w.baseline || w.target || w.valueDriver || w.timeHorizon || w.targetUsers) ? falsifiableTarget(w) : TRANSFORMATION.falsifiable)} />
        </div>
      </Panel>

      {/* WORKSHOP + LIVE SCORE */}
      <div id="workshop" className="scroll-mt-24">
        <SectionHeader eyebrow="Strategy workshop" title="Shape the initiative" description="Answer what you can — the readiness score and gates update live. Nothing here needs a real AI call." icon={Layers}
          action={started ? <button onClick={() => setW(blankWorkshop())} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><RotateCcw className="h-3 w-3" /> reset</button> : null} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><StrategyWorkshop w={w} set={set} /></div>
          <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start"><ScorePanel scored={scored} /></div>
        </div>
      </div>

      {/* AI PATTERN & CAPABILITY FIT + BUILD PATH — Strategy's downstream plan */}
      {started && <CapabilityFitPanel meta={meta} />}

      {/* BRIEF */}
      <InitiativeBrief brief={brief} scored={scored} onSave={saveToProgram} />

      {/* ARCHETYPES */}
      <div>
        <SectionHeader eyebrow="Patterns" title="AI use-case archetypes" description="Six shapes most enterprise AI initiatives fall into — with the data they need, their common risks, and the controls that keep them safe." icon={ShieldCheck} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPES.map((a) => (
            <div key={a.name} className="flex flex-col rounded-xl border border-line bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-ink">{a.name}</h3>
              <dl className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
                <ArchRow label="Best fit" tone="ink">{a.bestFit}</ArchRow>
                <ArchRow label="Data needed">{a.dataNeeded}</ArchRow>
                <ArchRow label="Common risks" tone="rose">{a.risks}</ArchRow>
                <ArchRow label="Controls" tone="emerald">{a.controls}</ArchRow>
                <ArchRow label="Success metric">{a.metric}</ArchRow>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT THIS DEMONSTRATES */}
      <Panel>
        <SectionHeader eyebrow="For reviewers" title="What this lab demonstrates" />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-300">{WHAT_THIS_DEMONSTRATES}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PROOF_CARDS.map((c, i) => (
            <InsightCard key={i} tone={i === 0 ? "info" : i === 1 ? "success" : "warn"} title={c.title}>{c.body}</InsightCard>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CapabilityFitPanel({ meta }: { meta: InitiativeMeta }) {
  const tierTone = meta.governanceTier === "Critical" ? "rose" : meta.governanceTier === "High" ? "amber" : meta.governanceTier === "Medium" ? "blue" : "emerald";
  const bp = meta.buildPathRecommendation;
  return (
    <Panel>
      <SectionHeader eyebrow="AI pattern & capability fit" title="What kind of AI system is this — and what it will need downstream" icon={Cpu}
        description="Strategy classifies the initiative and stamps the capability path plus the governance and operational controls the later stages should expect." />
      <div className="grid gap-4 lg:grid-cols-3">
        {/* pattern + tags */}
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="stat-label mb-1">Primary AI pattern</p>
          <p className="text-sm font-semibold text-ink">{meta.primaryAiPattern}</p>
          <p className="stat-label mb-1 mt-3">Capabilities in play</p>
          <div className="flex flex-wrap gap-1.5">
            {(meta.capabilityTags ?? []).map((t) => <Badge key={t} tone="slate">{t}</Badge>)}
          </div>
        </div>
        {/* build path */}
        <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-1.5"><Route className="h-4 w-4 text-primary" /><p className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">Recommended build path</p></div>
          <p className="mt-1.5 text-sm font-semibold text-ink">{bp?.path}</p>
          <p className="mt-1 text-xs leading-relaxed text-slatey-400">{bp?.why}</p>
          <p className="stat-label mb-1 mt-3">Downstream stages required</p>
          <div className="flex flex-wrap gap-1.5">
            {(bp?.requiredStages ?? []).map((s) => <span key={s} className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] text-slatey-300">{s}</span>)}
          </div>
        </div>
        {/* controls */}
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-slatey-400" /><p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Likely controls</p></div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slatey-300">Governance tier</span>
            <Badge tone={tierTone as any}>{meta.governanceTier}</Badge>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slatey-400">{meta.governanceTierRationale}</p>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="text-sm text-slatey-300">Operational criticality</span>
            <Badge tone={meta.operationalCriticality === "High" ? "amber" : "slate"}>{meta.operationalCriticality}</Badge>
          </div>
          <ul className="mt-2 space-y-1 border-t border-line pt-2 text-[12px] text-slatey-300">
            <li className="flex items-center gap-1.5">{meta.humanReviewRequired ? <span className="text-emerald-600">●</span> : <span className="text-slatey-300">○</span>} Human-in-the-loop review {meta.humanReviewRequired ? "required" : "optional"}</li>
            <li className="flex items-center gap-1.5">{meta.auditEvidenceRequired ? <span className="text-emerald-600">●</span> : <span className="text-slatey-300">○</span>} Audit evidence {meta.auditEvidenceRequired ? "required" : "optional"}</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function LastRunPanel({ outcomes, nextAction }: { outcomes: NonNullable<ReturnType<typeof useProgram>["state"]["outcomes"]>; nextAction?: string }) {
  const usd = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`);
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
      <div className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-emerald-700" /><p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Last realization run</p></div>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {outcomes.roi !== undefined && <span className="text-slatey-300">Risk-adjusted ROI <b className="text-ink">{Math.round(outcomes.roi)}%</b></span>}
        {outcomes.paybackMonths !== undefined && Number.isFinite(outcomes.paybackMonths) && <span className="text-slatey-300">Payback <b className="text-ink">{Math.round(outcomes.paybackMonths)} mo</b></span>}
        {outcomes.riskAdjustedValue !== undefined && <span className="text-slatey-300">Risk-adjusted value <b className="text-ink">{usd(outcomes.riskAdjustedValue)}/yr</b></span>}
        {outcomes.valueLeakage && <span className="text-slatey-300">Primary leakage <b className="text-ink">{outcomes.valueLeakage}</b></span>}
      </div>
      {nextAction && <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slatey-400"><TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Recommended next action: {nextAction}</p>}
    </div>
  );
}

function Arrow() {
  return <div className="hidden items-center justify-center text-slatey-300 md:flex"><ArrowRight className="h-5 w-5" /></div>;
}
function TransformCard({ tone, tag, text }: { tone: "slate" | "blue" | "emerald"; tag: string; text: string }) {
  const styles = {
    slate: "border-line bg-slate-50/60",
    blue: "border-primary/25 bg-primary/[0.05]",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.05]",
  }[tone];
  const chip = { slate: "text-slatey-400", blue: "text-primary-dark", emerald: "text-emerald-700" }[tone];
  return (
    <div className={cn("rounded-xl border p-4", styles)}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide", chip)}>{tag}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
function ArchRow({ label, tone = "slate", children }: { label: string; tone?: "ink" | "rose" | "emerald" | "slate"; children: React.ReactNode }) {
  const c = { ink: "text-ink", rose: "text-rose-600", emerald: "text-emerald-700", slate: "text-slatey-400" }[tone];
  return (
    <div>
      <dt className="font-semibold uppercase tracking-wide text-slatey-500" style={{ fontSize: "9px" }}>{label}</dt>
      <dd className={cn("mt-0.5", c)}>{children}</dd>
    </div>
  );
}
