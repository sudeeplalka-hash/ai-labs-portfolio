"use client";

// Stage 07 · Operate — day-2 continuous operations (SPEC-OPERATE-STAGE-V2).
// Placed after Realize on the rail, scoped from Deploy onward, and defined by the
// loop-back: drift/staleness evidence becomes a retrain / re-index / rollback /
// re-scope decision that feeds Frame, Build, Deploy, Realize, and Govern.
// Three views, one authored incident arc, capped scope. SIMULATED throughout —
// seeded deterministic series, never telemetry.
//
// UX doctrine (this file): a first-time reader should be able to (1) see the one
// idea in a sentence, (2) understand every metric without prior knowledge — every
// KPI carries an "i" tooltip and the secondary terms live in a glossary, and
// (3) feel the three views as a sequence (Watch → Decide → Loop back), not a set
// of unordered toggles.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, Radar, RefreshCcw, Download, AlertTriangle, Repeat, ArrowRight,
} from "lucide-react";
import {
  Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp, MetricTooltip, type BadgeTone,
} from "@labs/design-system";
import {
  useProgramSource,
  deriveOpsSeries, detectSignals, deriveDay2Incident, valueAtRisk,
  buildOperateFeedback, buildWeeklyOpsReview, buildIncidentReport,
  type OpsSignal, type RemediationOption, type OperateFeedback,
} from "@labs/program-core";

type View = "health" | "incident" | "loop";
const SEV_TONE: Record<string, BadgeTone> = { high: "rose", med: "amber", low: "slate" };
const LOOP_LABEL: Record<string, string> = { frame: "→ Frame (re-scope)", build: "→ Build (retrain/re-index)", deploy: "→ Deploy (restrict)" };

// ---- Plain-English metric definitions (the "i" tooltips) ----------------------
// Grounded in operate-day2.ts so the words match what the numbers actually mean.
const KPI_TIP = {
  slo: "Service-Level Objectives — the classic “is it up and fast?” health: availability, 95th-percentile latency (p95), and error rate. In this incident they stay green the whole time. That is the trap: infra health tells you nothing about whether the answers are still correct.",
  canary: "A fixed set of known-good questions (a “canary” set inherited from Build's golden dataset) re-run on a schedule. The share that still return correct answers. Unlike SLOs it tracks answer quality — so it is what catches silent decay. A drop of 8+ points below the Build baseline while SLOs stay green is the “silent drift” signal.",
  staleness: "Days since the retrieval index / knowledge base was last successfully refreshed against the source of truth. As it grows, the model answers from an outdated corpus and recall + citation accuracy fall. Past the tier threshold (21 days, or 14 for high-governance) it is a breach.",
  cost: "Fully-loaded inference cost for one completed task. It creeps ~2%/week from prompt growth; a lower cache-hit rate raises it, and agent “loop anomalies” (retries / repeated actions) add wasted calls. Cheap to ignore, expensive at scale.",
  valueAtRisk: "Annualized dollars of realized value exposed while quality is degraded = annual value × adoption × quality-degradation %. It converts answer decay into money so Realize can net it out of the business case.",
} as const;

// Secondary terms — one place, so the cards stay uncluttered.
const GLOSSARY: { term: string; def: string }[] = [
  { term: "SLO / p95 / error rate", def: "Service-Level Objective metrics: is the system up (availability), how slow is the slowest 5% of requests (p95 latency), and how often does it error. “System health,” not “answer health.”" },
  { term: "Canary evals / golden set", def: "A frozen set of questions with known-good answers, re-run on a schedule. “Canary pass rate” is the % still answered correctly. The golden set is inherited from Build, so this is the same yardstick used to ship." },
  { term: "Build baseline", def: "The canary pass rate the system launched with (from Build's faithfulness contract). Drift is measured against it, not against a fixed number." },
  { term: "Index staleness", def: "How many days the retrieval corpus is behind the live source of truth. The root cause of most RAG answer-decay: the model is fine, the documents it reads are old." },
  { term: "Retrieval recall", def: "Of the documents that should be retrieved for a question, the % the retriever actually surfaces. Falls as the index goes stale." },
  { term: "Citation rate", def: "% of answers that cite a real supporting source. Drops when retrieval degrades — answers get vaguer and less grounded." },
  { term: "Cache hit", def: "% of requests served from cache instead of a fresh model call. Higher = cheaper and faster." },
  { term: "Loop anomalies", def: "Agent runs whose action fingerprint looks off — repeated steps, excess iterations. A behavior-drift signal that also wastes cost." },
  { term: "Governance tier", def: "The risk tier assigned back in Govern. Higher tiers tighten thresholds — e.g. a staleness breach fires at 14 days instead of 21." },
  { term: "Value at risk", def: "Annualized value exposed while quality is degraded = annual value × adoption × quality-degradation %. The bridge from answer decay to dollars, for Realize." },
  { term: "Blast radius", def: "Who and what an incident affects — here, answer quality on recent-document questions, citation accuracy, and (with a lag) user trust and adoption." },
];

const REMEDIATION_TIP =
  "Each option fixes a different layer and loops back to a different stage. Re-index (→ Build): fix the refresh pipeline and rebuild the index — cheap root-cause fix. Retrain (→ Build): refresh the model and re-baseline the golden set — thorough but slow. Rollback (→ Deploy): restrict to covered documents, honest degraded mode — buys time, fixes nothing. Re-scope (→ Frame): re-frame the initiative around the document types that carry the value. “Loops back to” is the upstream stage Operate sends the work to — the point of the stage: a loop, not a ticket.";

function downloadMd(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Week-over-week helpers: signed delta + its direction, for the KPI trend chips.
const dlt = (a: number, b: number) => Math.round((a - b) * 100) / 100;
const dir = (d: number): "up" | "down" | "flat" => (d > 0.001 ? "up" : d < -0.001 ? "down" : "flat");

// The seven-stage spine with the arrow that bends Operate back to Frame — the whole
// reason this stage is the 7th and not the last. Pure SVG.
function LifecycleLoop() {
  const stages = ["Frame", "Data", "Build", "Deploy", "Govern", "Realize", "Operate"];
  const W = 640, H = 104, padX = 44, baseY = 40, n = stages.length;
  const x = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img"
      aria-label="The seven-stage lifecycle from Frame to Operate, with a dashed arrow looping back from Operate to Frame — the running system feeds the next cycle.">
      <defs>
        <marker id="loopArrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#1f6fc4" />
        </marker>
      </defs>
      <line x1={x(0)} y1={baseY} x2={x(n - 1)} y2={baseY} stroke="#e4e7eb" strokeWidth="2" />
      {stages.map((s, i) => {
        const cur = s === "Operate", tgt = s === "Frame";
        return (
          <g key={s}>
            <circle cx={x(i)} cy={baseY} r={cur ? 6 : 4} fill={cur ? "#1f6fc4" : tgt ? "#16a34a" : "#cbd2d9"} />
            <text x={x(i)} y={baseY - 12} textAnchor="middle" fontSize="9.5"
              className={cur ? "fill-primary font-semibold" : tgt ? "fill-emerald-700 font-semibold" : "fill-slate-500"}>{s}</text>
          </g>
        );
      })}
      <path d={`M ${x(n - 1)} ${baseY + 9} C ${x(n - 1)} ${baseY + 46}, ${x(0)} ${baseY + 46}, ${x(0)} ${baseY + 9}`}
        fill="none" stroke="#1f6fc4" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#loopArrow)" />
      <text x={(x(0) + x(n - 1)) / 2} y={baseY + 60} textAnchor="middle" fontSize="9.5" className="fill-primary">the loop — Operate feeds the next Frame</text>
    </svg>
  );
}

export function OperateStage() {
  const { src, isDemo, update, hydrated } = useProgramSource();
  const [view, setView] = useState<View>("health");
  const [decision, setDecision] = useState<RemediationOption | null>(null);

  const series = useMemo(() => deriveOpsSeries(src), [src]);
  const signals = useMemo(() => detectSignals(series, src.initiative?.meta?.governanceTier), [series, src]);
  const incident = useMemo(() => deriveDay2Incident(src), [src]);
  const vaR = useMemo(() => valueAtRisk(src, series), [src, series]);
  const feedback: OperateFeedback | null = useMemo(
    () => (decision ? buildOperateFeedback(src, decision, series) : null),
    [decision, src, series],
  );

  // Persist the loop-back. Imperative (user-triggered on the decision click, not a
  // render effect) so it can't retrigger itself; `iteration` isn't read by the ops
  // series, so the write doesn't cascade. Live-gated: the demo archetype is
  // ephemeral, so we never write over it (ProgramProvider's writer rule).
  const choose = (op: RemediationOption) => {
    setDecision(op);
    if (isDemo) return;
    const fb = buildOperateFeedback(src, op, series);
    const nextAction = fb.toFrame?.title ?? fb.toBuild?.task ?? fb.toDeploy?.action ?? fb.decision.label;
    update((draft) => {
      draft.iteration = { ...(draft.iteration ?? {}), recommendedNextAction: nextAction };
      draft.operate = {
        decisionLabel: fb.decision.label,
        loopTarget: fb.decision.loopTarget,
        nextAction,
        valueAtRiskUsd: fb.toRealize.valueAtRiskUsd,
        evidenceNote: fb.toGovern.evidenceNote,
        buildTask: fb.toBuild?.task,
        issuedAt: fb.issuedAt,
      };
    });
  };

  if (!hydrated) return null;

  // Gate: placed after Realize on the rail, scoped from Deploy onward — so the
  // stage unlocks when Deploy is complete, not when Realize is.
  const deployDone = src.progress?.deploy === "done" || !!src.seededSample;
  if (!deployDone) {
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <Repeat className="mx-auto mb-2 h-6 w-6 text-slatey-500" />
        <h1 className="text-lg font-semibold text-ink">Operate unlocks after Deploy</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slatey-400">
          Day-2 operations watch the system you shipped. Complete <Link href="/deploy" className="font-medium text-primary hover:underline">Deploy</Link> first
          — or load the sample program from the home page to see a full operations history.
        </p>
      </Panel>
    );
  }

  const last = series.weeks[series.weeks.length - 1];
  const prev = series.weeks[series.weeks.length - 2] ?? last;
  const driftPts = Math.round((series.canaryBaselinePct - last.canaryPassPct) * 10) / 10;

  // ---- Chart geometry: availability (flat, green) vs canary (declining, red) ----
  // Now with axes, a shaded divergence band, and week markers so it teaches itself.
  const W = 640, H = 210, padL = 44, padR = 14, padT = 18, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = series.weeks.length;
  const xf = (i: number) => padL + (i / (n - 1)) * plotW;
  const yf = (v: number) => padT + ((100 - v) / 45) * plotH; // domain 55–100
  const availPts = series.weeks.map((w, i) => `${xf(i).toFixed(1)},${yf(w.availabilityPct).toFixed(1)}`);
  const canaryPts = series.weeks.map((w, i) => `${xf(i).toFixed(1)},${yf(w.canaryPassPct).toFixed(1)}`);
  const gapPoly = [...availPts, ...canaryPts.slice().reverse()].join(" ");
  const yticks = [60, 70, 80, 90, 100];
  const markers = [{ i: 4, label: "wk 5 · decay begins" }, { i: 6, label: "wk 7 · incident" }];

  const STEPS: { k: View; n: string; label: string; hint: string; Icon: typeof Activity }[] = [
    { k: "health", n: "1", label: "Watch", hint: "Spot the signal — quality decays while SLOs stay green.", Icon: Activity },
    { k: "incident", n: "2", label: "Decide", hint: "Pick a fix: re-index, retrain, rollback, or re-scope.", Icon: AlertTriangle },
    { k: "loop", n: "3", label: "Loop back", hint: "Send the decision upstream — that arrow is the stage.", Icon: RefreshCcw },
  ];

  return (
    <div>
      {/* Stage header */}
      <div className="mb-4">
        <p className="eyebrow mb-1">Stage 07 · the loop</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Operate — Day-2 Observability</h1>
          <LiveBadge mode="SIMULATED" />
          <FreshnessStamp freshness={{ lastVerified: "2026-07-04", note: "Seeded deterministic series — authored to teach the pattern" }} />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
          Govern asked <em>is it allowed</em>. Realize asked <em>is it worth it</em>. This stage asks the third question —
          <span className="font-semibold text-ink"> is it still working</span> — and when the answer turns, it doesn&apos;t file a ticket.
          It loops back: retrain, re-index, rollback, or re-scope.
        </p>
      </div>

      {/* Orientation: the one idea + the 1-2-3 the tabs below follow */}
      <div className="mb-5 rounded-xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">The trap this stage exists to catch:</span> a system can stay perfectly green
            while its answers quietly rot. Infra health and answer health drift apart silently — so you operate the loop, not the model.
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {STEPS.map((s) => (
            <button key={s.k} onClick={() => setView(s.k)}
              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition ${view === s.k ? "border-primary/40 bg-primary/[0.04]" : "border-line bg-white hover:border-primary/30"}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{s.n}</span>
              <span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink"><s.Icon className="h-3.5 w-3.5 text-slatey-400" />{s.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slatey-500">{s.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View switch (numbered to mirror the stepper) */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {STEPS.map(({ k, n: num, label, Icon }) => (
          <button key={k} onClick={() => setView(k)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${view === k ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${view === k ? "bg-white/25 text-white" : "bg-slate-100 text-slatey-500"}`}>{num}</span>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <button
          onClick={() => downloadMd(`weekly-ops-review-wk${last.week}.md`, buildWeeklyOpsReview(src, series, signals))}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-400 hover:border-primary/40 hover:text-ink">
          <Download className="h-3.5 w-3.5" /> Weekly ops review
        </button>
      </div>

      {/* ---------------- View 1 · Health board ---------------- */}
      {view === "health" && (
        <div className="space-y-4">
          {/* what you're looking at + the color key */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slatey-400">Four dashboards a real on-call would watch. Hover any <span className="font-semibold text-slatey-300">i</span> for what it means and why it matters.</p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slatey-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />healthy</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />watch</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />needs action</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="System SLOs" value={`${last.availabilityPct}%`} tone="healthy" tooltip={KPI_TIP.slo}
              spark={series.weeks.map((w) => w.availabilityPct)} trend={{ direction: "flat", goodWhen: "up" }}
              interpretation={`p95 ${last.p95Ms}ms · errors ${last.errorRatePct}% — all green`} />
            <KpiCard label="Canary pass rate" value={`${last.canaryPassPct}%`} tone={driftPts >= 8 ? "critical" : "watch"} tooltip={KPI_TIP.canary}
              spark={series.weeks.map((w) => w.canaryPassPct)} trend={{ direction: dir(dlt(last.canaryPassPct, prev.canaryPassPct)), value: dlt(last.canaryPassPct, prev.canaryPassPct), suffix: "pts", goodWhen: "up" }}
              interpretation={`vs ${series.canaryBaselinePct}% Build baseline (−${driftPts}pts)`} />
            <KpiCard label="Index staleness" value={`${last.indexStaleDays}d`} tone={last.indexStaleDays > 21 ? "critical" : "watch"} tooltip={KPI_TIP.staleness}
              spark={series.weeks.map((w) => w.indexStaleDays)} trend={{ direction: dir(dlt(last.indexStaleDays, prev.indexStaleDays)), value: dlt(last.indexStaleDays, prev.indexStaleDays), suffix: "d", goodWhen: "down" }}
              interpretation={`recall ${last.retrievalRecallPct}% · citations ${last.citationRatePct}%`} />
            <KpiCard label="Cost / task" value={`$${last.costPerTaskUsd.toFixed(3)}`} tone="watch" tooltip={KPI_TIP.cost}
              spark={series.weeks.map((w) => w.costPerTaskUsd)} trend={{ direction: dir(dlt(last.costPerTaskUsd, prev.costPerTaskUsd)), goodWhen: "down" }}
              interpretation={`cache ${last.cacheHitPct}% · ${last.loopAnomalies} agent anomalies`} />
          </div>

          <Panel>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="stat-label">The trap, in one picture <span className="font-normal text-slatey-500">· 12 weeks</span></p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-700"><span className="h-0.5 w-3 rounded bg-emerald-600" />availability (system is up)</span>
                <span className="inline-flex items-center gap-1 text-rose-600"><span className="h-0.5 w-3 rounded bg-rose-500" />canary evals (answers still correct)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img"
                aria-label="Over 12 weeks, availability stays flat near 100% while the canary eval pass-rate declines from its Build baseline — the gap between them widens after week 5 and again at the week-7 incident.">
                {/* y gridlines + labels */}
                {yticks.map((v) => (
                  <g key={v}>
                    <line x1={padL} y1={yf(v)} x2={W - padR} y2={yf(v)} stroke="#eef1f4" />
                    <text x={padL - 6} y={yf(v) + 3} textAnchor="end" fontSize="9" className="fill-slate-400">{v}%</text>
                  </g>
                ))}
                {/* week markers */}
                {markers.map((m) => (
                  <g key={m.i}>
                    <line x1={xf(m.i)} y1={padT} x2={xf(m.i)} y2={H - padB} stroke="#cbd2d9" strokeDasharray="3 3" />
                    <text x={xf(m.i)} y={padT - 5} textAnchor="middle" fontSize="8.5" className="fill-slate-500">{m.label}</text>
                  </g>
                ))}
                {/* divergence band (the growing quality gap) */}
                <polygon points={gapPoly} fill="#e24b4a" fillOpacity="0.08" />
                {/* lines */}
                <polyline points={availPts.join(" ")} fill="none" stroke="#16a34a" strokeWidth="2" />
                <polyline points={canaryPts.join(" ")} fill="none" stroke="#e24b4a" strokeWidth="2.5" />
                {/* x labels */}
                {series.weeks.filter((_, i) => i % 2 === 0).map((w, j) => (
                  <text key={w.week} x={xf(j * 2)} y={H - padB + 14} textAnchor="middle" fontSize="9" className="fill-slate-400">wk {w.week}</text>
                ))}
              </svg>
            </div>
            <p className="mt-2 text-[11px] text-slatey-500">
              Same system, two truths. The SLO line never blinks; the canary set — inherited from Build&apos;s golden dataset — has been sliding since week 5, and the shaded gap is the quality you&apos;re silently losing.
              This is EL-04&apos;s reported-vs-actual lesson at model altitude.
            </p>
          </Panel>

          <Panel>
            <p className="stat-label mb-2 flex items-center gap-1.5">
              Open signals
              <MetricTooltip text="A signal is a threshold or trend a real monitor would alert on. The evidence line shows exactly why it fired — that rationale is the observability line item you'd actually pay for." />
              <span className="font-normal text-slatey-500">· why each one fired</span>
            </p>
            <div className="space-y-2">
              {signals.map((sg: OpsSignal) => (
                <div key={sg.key} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEV_TONE[sg.severity]}>{sg.severity}</Badge>
                    <span className="text-sm font-semibold text-ink">{sg.title}</span>
                    <span className="ml-auto font-mono text-[11px] text-slatey-500">week {sg.week}</span>
                  </div>
                  <p className="mt-1 text-xs text-slatey-300">{sg.evidence}</p>
                  <p className="mt-1 text-[11px] text-slatey-500"><Radar className="mr-1 inline h-3 w-3" />Monitor: {sg.monitorHint}</p>
                </div>
              ))}
            </div>
          </Panel>

          <InsightCard title={`Value at risk while this stays open: $${Math.round(vaR.valueAtRiskUsd / 1000)}k/yr`} tone="danger">
            <span className="inline-flex items-center gap-1">{vaR.basis}<MetricTooltip text={KPI_TIP.valueAtRisk} /></span>. That number flows to Realize — degraded quality is not an engineering detail, it&apos;s unrealized value.
            Make the call in the <button onClick={() => setView("incident")} className="font-semibold text-primary hover:underline">incident arc</button> →
          </InsightCard>
        </div>
      )}

      {/* ---------------- View 2 · Incident arc ---------------- */}
      {view === "incident" && (
        <div className="space-y-4">
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="rose">{incident.id}</Badge>
              <h2 className="text-sm font-semibold text-ink">{incident.title}</h2>
            </div>
            <ol className="mt-3 space-y-1.5 border-l-2 border-line pl-4 text-xs text-slatey-300">
              {incident.timeline.map((t) => (
                <li key={t.at}><span className="font-mono font-semibold text-ink">{t.at}</span> — {t.what}</li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-slatey-500">
              <span className="font-semibold text-slatey-400">Blast radius:</span> {incident.blastRadius}
              <MetricTooltip className="ml-1 align-middle" text="Blast radius = who and what the incident touches. Here: answer quality on recent-document questions, citation accuracy, and — with a lag — user trust and adoption." />
            </p>
          </Panel>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <p className="stat-label">The decision — four options, one call</p>
              <MetricTooltip text={REMEDIATION_TIP} />
            </div>
            <p className="mb-2.5 text-xs text-slatey-400">Each option fixes a different layer and loops back to a different stage. Cheaper and faster isn&apos;t automatically better — read the tradeoff before you pick.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {incident.options.map((op) => {
                const on = decision?.key === op.key;
                return (
                  <button key={op.key} onClick={() => choose(op)}
                    className={`rounded-xl border bg-white p-3 text-left shadow-card transition hover:shadow-cardhover ${on ? "border-primary ring-1 ring-primary/40" : "border-line"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{op.label}</p>
                      <Badge tone={SEV_TONE[op.risk]}>{op.risk} risk</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slatey-500">
                      <span><span className="text-slatey-400">Cost</span> ${Math.round(op.costUsd / 1000)}k</span>
                      <span><span className="text-slatey-400">Time</span> {op.timeWeeks}w</span>
                      <span><span className="text-slatey-400">Loops to</span> {LOOP_LABEL[op.loopTarget]}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-slatey-400">{op.rationale}</p>
                    <p className="mt-1 text-[11px] italic leading-snug text-slatey-500">Tradeoff: {op.tradeoff}</p>
                    {on && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">Selected — see the loop <ArrowRight className="h-3 w-3" /></p>}
                  </button>
                );
              })}
            </div>
          </div>

          {feedback && (
            <InsightCard title={`Decision recorded: ${feedback.decision.label}`} tone="success">
              Loop-back issued {LOOP_LABEL[feedback.decision.loopTarget]} — see <button onClick={() => setView("loop")} className="font-semibold text-primary hover:underline">the loop</button>.
              <span className="mt-1 block">
                <button onClick={() => downloadMd(`incident-report-${incident.id}.md`, buildIncidentReport(src, incident, feedback))}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download the incident report
                </button>
              </span>
            </InsightCard>
          )}
        </div>
      )}

      {/* ---------------- View 3 · The loop ---------------- */}
      {view === "loop" && (
        <div className="space-y-4">
          <Panel>
            <p className="stat-label mb-1">Where you are in the program</p>
            <div className="overflow-x-auto"><LifecycleLoop /></div>
            <p className="text-[11px] text-slatey-500">Operate is the 7th stage, not the last: the evidence it gathers becomes the input to the next Frame. That bend-back is what turns a one-off project into a program.</p>
          </Panel>
          {!feedback ? (
            <Panel>
              <div className="flex items-start gap-2">
                <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-slatey-400" />
                <div>
                  <p className="text-sm font-semibold text-ink">Nothing to loop yet</p>
                  <p className="mt-1 text-sm text-slatey-400">
                    This view renders what Operate <em>sends upstream</em> once you decide. Make the call in the{" "}
                    <button onClick={() => setView("incident")} className="font-medium text-primary hover:underline">incident arc</button> and the remediation will fan out to the five stages below.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {["→ Frame", "→ Build", "→ Deploy", "→ Realize", "→ Govern"].map((t) => (
                  <div key={t} className="rounded-lg border border-dashed border-line px-2 py-3 text-center text-[11px] font-medium text-slatey-400">{t}</div>
                ))}
              </div>
            </Panel>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {feedback.toBuild && (
                  <Panel><p className="stat-label mb-1">→ Build</p>
                    <p className="text-sm text-ink">{feedback.toBuild.task}</p>
                    <p className="mt-1 text-[11px] text-slatey-500">Evidence attached: {feedback.toBuild.evidence}</p>
                    <Link href="/build" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Build →</Link>
                  </Panel>
                )}
                {feedback.toFrame && (
                  <Panel><p className="stat-label mb-1">→ Frame · next cycle</p>
                    <p className="text-sm text-ink">{feedback.toFrame.title}</p>
                    <p className="mt-1 text-[11px] text-slatey-500">{feedback.toFrame.rationale}</p>
                    <Link href="/frame" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Frame →</Link>
                  </Panel>
                )}
                {feedback.toDeploy && (
                  <Panel><p className="stat-label mb-1">→ Deploy</p>
                    <p className="text-sm text-ink">{feedback.toDeploy.action}</p>
                    <Link href="/deploy" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Deploy →</Link>
                  </Panel>
                )}
                <Panel><p className="stat-label mb-1">→ Realize</p>
                  <p className="text-sm text-ink">{feedback.toRealize.note}</p>
                  <Link href="/realize" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Realize →</Link>
                </Panel>
                <Panel><p className="stat-label mb-1">→ Govern · evidence pack</p>
                  <p className="text-sm text-ink">{feedback.toGovern.evidenceNote}</p>
                  <Link href="/govern" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Govern →</Link>
                </Panel>
              </div>
              <InsightCard title="This arrow is the stage" tone="info">
                A lifecycle that ends at Realize is a project. One that loops through Operate is a program — the running system
                teaches the next Frame what to build. That feedback arrow is the most senior thing on this map.
              </InsightCard>
            </>
          )}
        </div>
      )}

      {/* Credibility block */}
      <div className="mt-8 space-y-4 border-t border-line pt-6">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">Steering-committee takeaway:</span> Green SLOs don&apos;t mean right answers.
          Infra health and answer health drift apart silently — you operate the loop, not the model.
        </p>

        <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
          <summary className="cursor-pointer font-semibold text-ink">New to these terms? Open the glossary</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term}>
                <dt className="text-xs font-semibold text-ink">{g.term}</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-slatey-400">{g.def}</dd>
              </div>
            ))}
          </dl>
        </details>

        <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
          <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
          <div className="mt-2 space-y-1 text-xs leading-relaxed">
            <p>Series: seeded deterministic 12-week history (`deriveOpsSeries`) — same initiative, same operations story. The canary baseline traces to Build&apos;s golden-set faithfulness; SLOs are engineered to stay green while canary evals decay, because that divergence is the lesson.</p>
            <p>Detection: threshold + trend detectors (`detectSignals`) with the real-world monitor named per signal; the staleness threshold tightens for high governance tiers.</p>
            <p>The loop: a chosen remediation builds a typed feedback contract (`buildOperateFeedback`) routing to Frame / Build / Deploy, with value-at-risk computed for Realize and an evidence note for Govern. Engine is tested in `program-core` (determinism, detector logic, routing).</p>
          </div>
        </details>
        <p className="text-xs text-slatey-500">
          <span className="font-semibold text-slatey-400">Limitations:</span> the incident is authored and the series are seeded math —
          real day-2 needs telemetry ingestion, alert routing, and on-call. This stage shows the signals worth buying and the decision they exist to trigger, not a monitoring product.
        </p>
      </div>
    </div>
  );
}
