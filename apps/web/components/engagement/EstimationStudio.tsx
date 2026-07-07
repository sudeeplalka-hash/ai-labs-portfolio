"use client";

// EL-08 · Estimation & Scoping Studio (Collection 4 · control room).
// Estimate three ways (bottom up / analogous / three point PERT), watch them
// disagree, staff the chosen number, then push a scope change through change
// control and watch schedule, staffing, and MARGIN move. AI estimates blow up in
// data discovery and evaluation, those are explicit line items here. SIMULATED.

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { pertEstimate, marginPct as engineMargin } from "@labs/engines";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { EL08_USE_CASES, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

interface Task { phase: string; weeks: number; ai?: boolean }
interface UseCase {
  key: string; label: string;
  wbs: Task[];
  analogous: { baseWeeks: number; factor: number };
  three: { o: number; m: number; p: number };
  change: { label: string; add: Task[] };
}

const RATE = { bill: 12, cost: 7.5 }; // $k per person-week (blended)
const STAFF = [
  { role: "Engagement lead", n: 1 }, { role: "Senior engineer", n: 2 }, { role: "ML engineer", n: 1 },
  { role: "Data engineer", n: 1 }, { role: "QA / eval", n: 1 },
];
const CAPACITY = 4.8; // effective FTE-weeks per calendar week

const USE_CASES: UseCase[] = [
  {
    key: "disputes", label: "Disputes RAG assistant (finserv)",
    wbs: [
      { phase: "Discovery & requirements", weeks: 3 },
      { phase: "Data readiness discovery", weeks: 5, ai: true },
      { phase: "Retrieval + build", weeks: 8 },
      { phase: "Eval harness build", weeks: 4, ai: true },
      { phase: "Model iteration loops", weeks: 4, ai: true },
      { phase: "Systems integration", weeks: 5 },
      { phase: "Hardening & UAT", weeks: 4 },
    ],
    analogous: { baseWeeks: 28, factor: 1.15 },
    three: { o: 26, m: 34, p: 52 },
    change: { label: "Add 2 dispute categories + a new data source", add: [{ phase: "Data readiness (new source)", weeks: 4, ai: true }, { phase: "Eval expansion", weeks: 3, ai: true }, { phase: "Build + iteration", weeks: 3 }, { phase: "Regression", weeks: 2 }] },
  },
  {
    key: "netops", label: "Network ops copilot (telecom)",
    wbs: [
      { phase: "Discovery & requirements", weeks: 2 },
      { phase: "Data readiness discovery", weeks: 4, ai: true },
      { phase: "Copilot build", weeks: 7 },
      { phase: "Eval harness build", weeks: 3, ai: true },
      { phase: "Model iteration loops", weeks: 3, ai: true },
      { phase: "Systems integration", weeks: 6 },
      { phase: "Hardening & UAT", weeks: 3 },
    ],
    analogous: { baseWeeks: 24, factor: 1.2 },
    three: { o: 22, m: 29, p: 44 },
    change: { label: "Add new alarm taxonomy + second fab imaging", add: [{ phase: "Taxonomy + data", weeks: 4, ai: true }, { phase: "Eval expansion", weeks: 3, ai: true }, { phase: "Domain adaptation", weeks: 2 }, { phase: "Regression", weeks: 1 }] },
  },
];

type Method = "bottomup" | "analogous" | "pert";
const sumWeeks = (t: Task[]) => t.reduce((a, x) => a + x.weeks, 0);
const duration = (weeks: number) => Math.ceil(weeks / CAPACITY);
const marginPct = (effort: number, revEffort: number) => engineMargin(effort, revEffort, RATE.bill, RATE.cost);

export function EstimationStudio() {
  const [ucKey, setUcKey] = useState(USE_CASES[0].key);
  const [method, setMethod] = useState<Method>("pert");
  const [scopeOn, setScopeOn] = useState(false);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL08_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL08_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => { setActiveUcId(id); setScopeOn(false); };
  const uc: UseCase = activeUc ? activeUc.payload.scenario : USE_CASES.find((u) => u.key === ucKey)!;

  const bottomUp = sumWeeks(uc.wbs);
  const analogous = Math.round(uc.analogous.baseWeeks * uc.analogous.factor);
  const est = pertEstimate(uc.three);
  const pert = Math.round(est.mean);
  const pertStd = Math.round(est.std);
  const pertP80 = Math.round(est.p80);
  const pertP90 = Math.round(est.p90);
  const totals: Record<Method, number> = { bottomup: bottomUp, analogous, pert };
  const spread = Math.max(bottomUp, analogous, pert) - Math.min(bottomUp, analogous, pert);

  const baseEffort = totals[method];
  const changeWeeks = sumWeeks(uc.change.add);
  const effort = scopeOn ? baseEffort + changeWeeks : baseEffort;

  const baselineMargin = marginPct(baseEffort, baseEffort);
  const absorbedMargin = marginPct(effort, baseEffort);
  const coMargin = marginPct(effort, effort);
  const staffScale = Math.max(1, Math.round(effort / 33));

  const buildChangeOrder = (): string => {
    const schedDelta = duration(effort) - duration(baseEffort);
    const price = changeWeeks * RATE.bill;
    return [
      "# Change order, draft",
      "",
      `**Engagement:** ${uc.label}`,
      `**Estimation basis:** ${method === "pert" ? "PERT (three point)" : method} · base effort ${baseEffort} person-weeks`,
      "",
      "## Scope change",
      "",
      uc.change.label,
      "",
      "## Impact",
      "",
      "| Dimension | Delta |",
      "| --- | --- |",
      `| Added effort | +${changeWeeks} person-weeks |`,
      `| Schedule | +${schedDelta} weeks |`,
      `| Price | +$${price.toLocaleString()}k |`,
      `| Margin if absorbed silently | ${absorbedMargin}% (from ${baselineMargin}%) |`,
      `| Margin with this change order | ${coMargin}% |`,
      "",
      "## Added-work breakdown",
      "",
      ...uc.change.add.map((t) => `- ${t.phase}, ${t.weeks}w${t.ai ? " *(AI-risk: data/eval)*" : ""}`),
      "",
      "## Recommendation",
      "",
      `Process as a formal change order. Absorbing the scope silently drops margin to ${absorbedMargin}%; the change order holds it at ${coMargin}%.`,
      "",
      "Approved by: ________________   Date: __________",
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`change-order-${uc.key}`, buildChangeOrder(), { scenario: `${uc.label} · ${uc.change.label}` });

  const router = useRouter();
  const exportEstimate = () => {
    downloadCsv("estimate-summary", ["Item", "Weeks"], [["Bottom-up", bottomUp], ["Analogous", analogous], ["PERT mean (P50)", pert], ["P80 commit", pertP80], ["P90", pertP90]]);
    toast("Estimate exported as CSV");
  };
  const exportScenario = () => { downloadJson("estimate-scenario", { version: 1, useCase: uc.key, method, three: uc.three, scopeOn }); toast("Scenario exported as JSON"); };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Estimate summary (CSV)", hint: "Methods + confidence ladder", onSelect: exportEstimate },
    { id: "json", label: "Export scenario (JSON)", hint: "Use case + method", onSelect: exportScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "m-pert", label: "Method: three point (PERT)", group: "action", run: () => setMethod("pert") },
    { id: "m-bu", label: "Method: bottom up", group: "action", run: () => setMethod("bottomup") },
    { id: "m-an", label: "Method: analogous", group: "action", run: () => setMethod("analogous") },
    { id: "act-scope", label: scopeOn ? "Revert scope change" : "Apply scope change", group: "action", keywords: "change control", run: () => setScopeOn((v) => !v) },
    { id: "exp-csv", label: "Export estimate (CSV)", group: "export", run: exportEstimate },
    { id: "exp-json", label: "Export scenario (JSON)", group: "export", run: exportScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-08</span>
          <div className="ml-auto"><ExportMenu actions={exportActions} /></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Operating Model and Transformation Leadership Artifacts</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Estimation and Scope Control Studio</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            AI estimates often fail where uncertainty is highest: data discovery, evaluation, integration, and change
            control. This artifact compares estimation methods and shows how scope movement affects margin and schedule.
          </p>
        </div>

        <UseCaseRail useCases={EL08_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="A single point estimate can create false confidence. Senior delivery requires a range, a confidence level, a clear commitment point, and a disciplined approach to scope change." approach="The studio compares bottom up, analogous, and PERT estimates, then models staffing, schedule, confidence levels, and change control impact." why="This connects estimation to delivery confidence, margin protection, client expectation management, and commercial governance." metric="The P80 commit; gross margin under a scope change." tradeoff="Absorbing scope silently protects the relationship but drops margin; a change order holds margin but is a harder conversation." outcome="A defensible committed estimate plus the change control impact of moving scope." />

        {!activeUc && (
          <div className="mb-5 flex flex-wrap gap-2">
            {USE_CASES.map((u) => (
              <button key={u.key} onClick={() => { setUcKey(u.key); setScopeOn(false); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${u.key === ucKey ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>{u.label}</button>
            ))}
          </div>
        )}

        {/* Three methods */}
        <div className="grid gap-3 md:grid-cols-3">
          <MethodCard on={method === "bottomup"} onClick={() => setMethod("bottomup")} title="Bottom-up" weeks={bottomUp}>
            <ul className="mt-2 space-y-0.5 text-[11px] text-slatey-400">
              {uc.wbs.map((t) => (
                <li key={t.phase} className="flex items-center justify-between gap-2">
                  <span>{t.phase} {t.ai && <Badge tone="orange" className="ml-1">AI risk</Badge>}</span>
                  <span className="font-mono text-slatey-500">{t.weeks}w</span>
                </li>
              ))}
            </ul>
          </MethodCard>
          <MethodCard on={method === "analogous"} onClick={() => setMethod("analogous")} title="Analogous" weeks={analogous}>
            <p className="mt-2 text-[11px] text-slatey-400">Past similar engagement {uc.analogous.baseWeeks}w × complexity {uc.analogous.factor.toFixed(2)}. Fast, but blind to what&apos;s new about this one.</p>
          </MethodCard>
          <MethodCard on={method === "pert"} onClick={() => setMethod("pert")} title="Three point (PERT)" weeks={pert} range={`${pert - pertStd} to ${pert + pertStd}w`}>
            <p className="mt-2 text-[11px] text-slatey-400">O {uc.three.o} · M {uc.three.m} · P {uc.three.p}. PERT = (O+4M+P)/6; ±1σ = {pertStd}w. Present the range, not the point &mdash; <span className="font-semibold text-ink">commit at P80 = {pertP80}w</span> (P90 {pertP90}w).</p>
          </MethodCard>
        </div>

        <InsightCard title={`The three disagree by ${spread} weeks`} tone="warn">
          That spread is the conversation. The analogous number is cheapest and most wrong; bottom up misses the unknowns it hasn&apos;t imagined; PERT&apos;s range is the honest answer, <span className="font-semibold">{pert - pertStd} to {pert + pertStd} weeks</span>.
        </InsightCard>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="stat-label">Confidence ladder</span>
          <span className="rounded-md border border-line px-2 py-1 font-mono text-xs">P50 {pert}w</span>
          <span className="rounded-md border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-xs font-semibold text-primary">P80 {pertP80}w &middot; commit</span>
          <span className="rounded-md border border-line px-2 py-1 font-mono text-xs">P90 {pertP90}w</span>
          <span className="text-[11px] text-slatey-500">The mean is a coin flip; a defensible commit carries contingency to P80.</span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* Staffing + critical path */}
          <Panel>
            <p className="stat-label mb-2">Staffing &amp; schedule <span className="font-normal text-slatey-500">· from {method === "pert" ? "PERT" : method}</span></p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {STAFF.map((s) => (
                <div key={s.role} className="flex items-center justify-between rounded-md border border-line px-2.5 py-1.5">
                  <span className="text-slatey-400">{s.role}</span>
                  <span className="font-mono font-semibold text-ink">×{s.n * staffScale}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="text-slatey-400">Effort <span className="font-mono font-semibold text-ink">{effort}w</span></span>
              <span className="text-slatey-400">Duration <span className="font-mono font-semibold text-ink">~{duration(effort)}wk</span></span>
              <span className="text-slatey-400">Team <span className="font-mono font-semibold text-ink">{STAFF.reduce((a, s) => a + s.n * staffScale, 0)}</span></span>
            </div>
          </Panel>

          {/* Change control */}
          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <p className="stat-label">Change control</p>
              <button onClick={() => setScopeOn((v) => !v)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${scopeOn ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:text-ink"}`}>{scopeOn ? "Scope change applied" : "Apply scope change"}</button>
            </div>
            <p className="text-xs text-slatey-400">{uc.change.label}, <span className="font-mono">+{changeWeeks}w</span>, concentrated in data + eval.</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <MarginPill label="Baseline" pct={baselineMargin} />
              <MarginPill label="Absorbed" pct={scopeOn ? absorbedMargin : baselineMargin} danger={scopeOn} />
              <MarginPill label="With change order" pct={scopeOn ? coMargin : baselineMargin} good={scopeOn} />
            </div>

            {scopeOn && (
              <div className="mt-3 rounded-md border border-line bg-slate-50 p-2.5 text-xs text-slatey-300">
                <p className="font-semibold text-ink">Change order, draft</p>
                <p className="mt-1">Scope: {uc.change.label}. Added effort +{changeWeeks} person-weeks; schedule +{duration(effort) - duration(baseEffort)} weeks; price +${(changeWeeks * RATE.bill).toLocaleString()}k. Absorbing it silently drops margin to {absorbedMargin}%; the change order holds it at {coMargin}%.</p>
                <div className="mt-2"><ArtifactButton label="Download the change order" onClick={onGenerate} title="Download this change order as Markdown" /></div>
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Commit to a confidence backed estimate and route material scope change through explicit control." lift="Reduces margin leakage and delivery surprises by pricing uncertainty instead of hiding it." measure="P80 estimate, schedule variance, margin impact, change order value, scope movement." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "AI estimates often break in data discovery and evaluation. Price those unknowns as line items or absorb them later."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, consulting delivery estimation across HCLTech/Genpact/Deloitte.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Bottom up = sum of a WBS with AI specific line items flagged. Analogous = past baseline × complexity factor. PERT = (O + 4M + P)/6 with ±(P−O)/6 as the range.</p>
              <p>Duration = effort ÷ effective team capacity ({CAPACITY} FTE-weeks/week); margin = (revenue − cost)/revenue at ${RATE.bill}k bill / ${RATE.cost}k cost per person-week. A scope change absorbed silently drops margin; a change order re-prices it.</p>
              <p>Stack: Next.js (static) + shared design system; client side only.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a portfolio estimation model. Real estimation would require delivery history, client scope, technical discovery, staffing rates, vendor constraints, and commercial review.</p>
        </div>
      </main>
      <ToastHost />
      <CommandPalette commands={paletteCommands} />
    </div>
  );
}

function MethodCard({ on, onClick, title, weeks, range, children }: { on: boolean; onClick: () => void; title: string; weeks: number; range?: string; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-xl border bg-white p-3 text-left shadow-card transition hover:shadow-cardhover ${on ? "border-primary ring-1 ring-primary/30" : "border-line"}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="font-mono text-lg font-semibold text-ink">{weeks}w</p>
      </div>
      {range && <p className="text-[11px] font-medium text-primary">range {range}</p>}
      {children}
    </button>
  );
}

function MarginPill({ label, pct, danger, good }: { label: string; pct: number; danger?: boolean; good?: boolean }) {
  const tone = danger ? "text-rose-600" : good ? "text-emerald-700" : "text-ink";
  return (
    <div className="rounded-md border border-line bg-white px-2 py-1.5">
      <p className="text-[10px] text-slatey-500">{label}</p>
      <p className={`font-mono text-base font-semibold ${tone}`}>{pct}%</p>
    </div>
  );
}
